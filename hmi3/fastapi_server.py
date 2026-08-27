from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from traditional_rag_pipeline.rag_chain import rag

app = FastAPI(title="Graphic Era RAG Chatbot")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Graphic Era RAG Backend Running"
    }


@app.post("/chat")
async def chat(req: ChatRequest):

    def event_stream():
        try:
            # STREAM TOKENS FROM RAG
            for token in rag(req.query):

                if token:
                    # SSE FORMAT
                    yield f"data: {json.dumps(token)}\n\n"

            # END SIGNAL
            yield "data: [DONE]\n\n"

        except Exception as e:
            error_message = {"error": str(e)}

            yield f"data: {json.dumps(error_message)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "fastapi:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )