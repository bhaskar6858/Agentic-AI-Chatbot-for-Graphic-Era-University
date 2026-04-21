import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Plane as PlaneIcon, Sparkles } from "lucide-react";
import SkyBackground from "@/components/SkyBackground";
import ChatMessage from "@/components/ChatMessage";
import PlaneCursor from "@/components/PlaneCursor";
import SkyThemeToggle from "@/components/SkyThemeToggle";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Tell me about the UR10e Robots",
  "What is the maximum temperature recorded?",
  "Show me last 5 values of Robot Telemetry",
  "Tell me about Elbow Restriction?",
];

const Index = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamTick, setStreamTick] = useState(0);
  
  // Hardcoded or LocalStorage-based URL with no UI toggle
  const [backendUrl] = useState(
    () => localStorage.getItem("airbus_backend_url") || "http://localhost:8000"
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeBubbleRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-scroll logic
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamTick]);

  const send = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isStreaming) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: query };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Msg = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsThinking(true);
    setIsStreaming(true);

    requestAnimationFrame(() => {
      const el = messageRefs.current.get(assistantId);
      if (el) (activeBubbleRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      setStreamTick((t) => t + 1);
    });

    try {
      const resp = await fetch(`${backendUrl.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!resp.ok || !resp.body) throw new Error(`Server returned ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (!line.startsWith("data: ")) continue;
          
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;

          let chunk = payload;
          try {
            const parsed = JSON.parse(payload);
            chunk = typeof parsed === "string" ? parsed : (parsed.text || "");
          } catch { /* raw text fallback */ }

          if (firstToken) {
            firstToken = false;
            setIsThinking(false);
          }

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
          setStreamTick((t) => t + 1);
        }
      }
    } catch (err: any) {
      toast({
        title: "Connection Lost",
        description: "Check if your FastAPI server is running on port 8000.",
        variant: "destructive",
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "⚠️ Error: Backend unreachable." } : m
        )
      );
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
    }
  };

  const planeMode = isThinking ? "thinking" : isStreaming ? "flying" : "idle";

  return (
    <main className="relative min-h-screen flex flex-col">
      <SkyBackground />

      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-sun-warm flex items-center justify-center glow-primary">
            <PlaneIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold leading-tight text-gradient">
              I'm still under development
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {/* Cruising at 36,000 ft of knowledge */}
            </p>
          </div>
        </motion.div>
        
        {/* Only Theme Toggle remains in the header */}
        <div className="flex items-center gap-2">
          <SkyThemeToggle />
        </div>
      </header>

      <section ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 pb-40">
        <div className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <Hero onPick={(s) => send(s)} />
          ) : (
            <div className="flex flex-col gap-6 pt-4">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                return (
                  <ChatMessage
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    isStreaming={isStreaming && isLast && m.role === "assistant"}
                    ref={(el) => {
                      if (el) messageRefs.current.set(m.id, el);
                      if (isLast && m.role === "assistant" && el) {
                        (activeBubbleRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 sm:px-8 pb-5 pt-10 bg-gradient-to-t from-sky-deep via-sky-deep/85 to-transparent pointer-events-none">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mx-auto w-full max-w-3xl pointer-events-auto"
        >
          <div className="glass rounded-2xl p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-primary/60 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about UR10e Robots…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm sm:text-base text-cloud placeholder:text-muted-foreground focus:outline-none max-h-40"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isStreaming}
              className="bg-gradient-to-br from-primary to-sun-warm text-primary-foreground h-11 w-11 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            {/* Powered by local Llama · Press Enter to send */}
          </p>
        </form>
      </div>

      <PlaneCursor mode={planeMode} targetRef={activeBubbleRef} streamTick={streamTick} />
    </main>
  );
};

const Hero = ({ onPick }: { onPick: (s: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center text-center pt-12 sm:pt-20"
  >
    <div className="relative mb-8">
      <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-primary via-sky-glow to-sun-warm flex items-center justify-center glow-primary">
        <PlaneIcon className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground rotate-[-20deg]" />
      </div>
      <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-sun-core animate-twinkle" />
    </div>

    <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 leading-tight text-gradient">
      UR10e Chatbot.
    </h2>
    <p className="text-cloud/90 max-w-xl text-sm sm:text-base mb-10 px-4 font-medium">
      Powered by RAG and Live Tool Calling Functions. Either ask about UR10e, or interact with Live Robot Logs. I can help you with both.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-2">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.08 }}
          onClick={() => onPick(s)}
          className="glass rounded-xl px-4 py-3 text-left text-sm text-cloud hover:bg-secondary/40 hover:scale-[1.02] transition-all"
        >
          <span className="text-accent mr-2">→</span>
          {s}
        </motion.button>
      ))}
    </div>
  </motion.div>
);

export default Index;