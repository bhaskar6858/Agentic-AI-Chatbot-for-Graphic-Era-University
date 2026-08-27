import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Tell me about Graphic Era University",
  "What courses are offered?",
  "Tell me about placements",
  "What is the fee structure?",
];

const Index = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const backendUrl = "http://localhost:8000";

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (text?: string) => {
    const query = (text ?? input).trim();

    if (!query || isStreaming) return;

    const userMessage: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };

    const assistantId = crypto.randomUUID();

    const assistantMessage: Msg = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ]);

    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Backend error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        let newlineIndex;

        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex);

          buffer = buffer.slice(newlineIndex + 1);

          if (!line.startsWith("data: ")) continue;

          const payload = line.slice(6);

          if (payload === "[DONE]") continue;

          let chunk = payload;

          try {
            chunk = JSON.parse(payload);
          } catch {}

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: msg.content + chunk,
                  }
                : msg
            )
          );
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: "Error connecting to backend.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{
        backgroundImage: "url('/graphic.png')",
      }}
    >
      {/* Dark Overlay */}
      <div className="min-h-screen flex flex-col bg-black/60 backdrop-blur-[2px]">
        
        {/* Header */}

        <header className="p-5 text-center border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white">
            Graphic Era University Chatbot
          </h1>

          <p className="text-gray-300 mt-2 text-sm">
            Powered by RAG + Agentic AI + Tool Calling Functions
          </p>
        </header>

        {/* Chat Area */}

        <section
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 pb-36"
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-4">

            {messages.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="bg-gray-700/80 hover:bg-gray-600 text-white rounded-xl p-4 text-left transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "self-end bg-blue-600 text-white"
                    : "self-start bg-gray-700 text-gray-100"
                }`}
              >
                {msg.content}
              </div>
            ))}

            {isStreaming && (
              <div className="text-gray-300 text-sm italic">
                Generating response...
              </div>
            )}
          </div>
        </section>

        {/* Input Box */}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/70 backdrop-blur-md border-t border-gray-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="max-w-4xl mx-auto flex gap-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Graphic Era University..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none rounded-2xl bg-gray-800 text-white p-4 outline-none border border-gray-600 focus:border-gray-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-2xl px-5 transition-all disabled:opacity-50"
            >
              <Send size={22} />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Index;