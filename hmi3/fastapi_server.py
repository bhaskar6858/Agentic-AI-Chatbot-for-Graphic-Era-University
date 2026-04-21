"""
A Flight with Airbus — FastAPI backend
=======================================

Wraps your local LlamaCpp .gguf model with a streaming SSE endpoint
that the React frontend (built in Lovable) can talk to.

Setup
-----
1) Install deps (in your project folder, not in Lovable):

   pip install fastapi uvicorn llama-cpp-python langchain-community

   (For GPU acceleration, install llama-cpp-python with the right CMAKE flags
    for your platform — see https://github.com/abetlen/llama-cpp-python)

2) Make sure your model file exists at:
   ./models/Ministral-3-3B-Instruct-2512-Q4_K_M.gguf

3) Run the server:

   uvicorn fastapi_server:app --reload --host 0.0.0.0 --port 8000

4) In the React app, click the gear icon (top-right) and set the backend URL
   to http://localhost:8000  (already the default).

5) Ask away — the streamed tokens drive the airplane cursor on the frontend.
"""

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.llms import LlamaCpp
import json

# ---- Model ----------------------------------------------------------------
MODEL_PATH = "./models/Ministral-3-3B-Instruct-2512-Q4_K_M.gguf"

SYSTEM_PROMPT = (
    "You are 'A Flight with Airbus', a friendly, expert in-flight assistant. "
    "Answer questions specifically about Airbus — its aircraft (A220, A320, A330, "
    "A350, A380, Beluga, military, helicopters), technology, sustainability, "
    "history, and operations. Be accurate, concise, and use markdown when helpful "
    "(short headings, bullet points, **bold** for key facts). "
    "If a question is unrelated to Airbus, politely steer it back."
)

llm= LlamaCpp(
    model_path= "./models/Ministral-3-3B-Instruct-2512-Q4_K_M.gguf",
    n_gpu_layers= 0,
    n_ctx=1024,
    n_threads=4,
    f16_kv=True,
    verbose= True

)

# ---- App ------------------------------------------------------------------
app = FastAPI(title="A Flight with Airbus")

# Allow the Lovable preview + your local dev to call this server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str


def build_prompt(user_query: str) -> str:
    # Simple chat-style prompt; tweak to match your model's preferred template.
    return (
        f"<s>[INST] <<SYS>>\n{SYSTEM_PROMPT}\n<</SYS>>\n\n"
        f"{user_query.strip()} [/INST]"
    )


@app.get("/")
def root():
    return {"status": "ok", "message": "A Flight with Airbus backend ✈️"}


@app.post("/chat")
def chat(req: ChatRequest):
    prompt = build_prompt(req.query)

    def event_stream():
        try:
            for chunk in llm.stream(prompt):
                # SSE — one event per token chunk. JSON-encode for safe newlines.
                yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable proxy buffering
            "Connection": "keep-alive",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_server:app", host="0.0.0.0", port=8000, reload=True)
