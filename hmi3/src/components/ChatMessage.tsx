import { forwardRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const ChatMessage = forwardRef<HTMLDivElement, Props>(
  ({ role, content, isStreaming }, ref) => {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      if (!content) return;
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`group flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div
            className={`flex shrink-0 h-9 w-9 items-center justify-center rounded-full font-display text-sm font-semibold ${
              isUser
                ? "bg-secondary text-secondary-foreground"
                : "bg-gradient-to-br from-primary to-sun-warm text-primary-foreground glow-primary"
            }`}
          >
            {isUser ? "You" : "✈"}
          </div>
          <div
            ref={ref}
            className={`relative px-5 py-3.5 rounded-2xl border border-border shadow-[0_20px_60px_-20px_hsl(222_75%_4%/0.7)] ${
              isUser
                ? "rounded-tr-sm bg-secondary text-secondary-foreground"
                : "rounded-tl-sm bg-card text-card-foreground"
            }`}
          >
            {content ? (
              <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-pre:bg-sky-deep/60 prose-pre:border prose-pre:border-border prose-code:text-accent">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <span className="text-muted-foreground italic text-sm">Preparing for take-off…</span>
            )}
            {isStreaming && content && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-primary/80 animate-pulse rounded-sm" />
            )}
            {/* Copy button — visible on hover or after copy */}
            {content && !isStreaming && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);
ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
