import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
}

interface Props {
  /** "thinking" = vibrate in place; "flying" = follow text end; "idle" = hidden */
  mode: "idle" | "thinking" | "flying";
  /** Ref to the message bubble currently streaming */
  targetRef: React.RefObject<HTMLElement>;
  /** Trigger value that changes whenever new text streams in */
  streamTick: number;
}

const PlaneCursor = ({ mode, targetRef, streamTick }: Props) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  // Track end-of-text position by inserting an invisible marker span
  useEffect(() => {
    if (mode !== "flying" || !targetRef.current) return;
    const el = targetRef.current;

    // Find the trailing position using a Range at end of element
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const rect = range.getBoundingClientRect();

    // Fallback: bottom-right of element
    const r = rect && rect.width + rect.height > 0 ? rect : el.getBoundingClientRect();
    setPos({ x: r.right, y: r.top + r.height / 2 });

    // Emit smoke particles
    setParticles((prev) => {
      const next = [...prev];
      for (let i = 0; i < 2; i++) {
        next.push({
          id: idRef.current++,
          x: r.right,
          y: r.top + r.height / 2,
          tx: -30 - Math.random() * 30,
          ty: -10 + (Math.random() - 0.5) * 20,
          size: 6 + Math.random() * 8,
        });
      }
      // cap size
      return next.slice(-80);
    });
  }, [mode, streamTick, targetRef]);

  // Position for thinking mode — center of target bubble's right edge
  useEffect(() => {
    if (mode !== "thinking" || !targetRef.current) return;
    const r = targetRef.current.getBoundingClientRect();
    setPos({ x: r.left + 28, y: r.top + 24 });
  }, [mode, targetRef, streamTick]);

  // Cleanup particles
  useEffect(() => {
    if (particles.length === 0) return;
    const t = setTimeout(() => {
      setParticles((p) => p.slice(-40));
    }, 1200);
    return () => clearTimeout(t);
  }, [particles.length]);

  if (mode === "idle" || !pos) return null;

  return (
    <>
      {/* Smoke particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none fixed rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background:
              "radial-gradient(circle, hsl(var(--cloud) / 0.85), hsl(var(--sky-glow) / 0.2) 60%, transparent 70%)",
            filter: "blur(2px)",
            // @ts-ignore custom props
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            animation: "smoke-rise 1.1s ease-out forwards",
            zIndex: 40,
          }}
        />
      ))}

      {/* Plane */}
      <div
        className="pointer-events-none fixed z-50 transition-[left,top] duration-150 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          transform: "translate(-10%, -50%)",
        }}
      >
        <div
          style={{
            animation:
              mode === "thinking"
                ? "plane-vibrate 0.18s ease-in-out infinite"
                : "float-y 1.2s ease-in-out infinite",
          }}
        >
          <Plane />
        </div>
        {mode === "thinking" && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: "hsl(var(--primary) / 0.4)",
              animation: "pulse-ring 1.4s ease-out infinite",
            }}
          />
        )}
      </div>
    </>
  );
};

const Plane = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.6))" }}>
    <path
      d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      fill="hsl(var(--cloud))"
      stroke="hsl(var(--primary))"
      strokeWidth="0.6"
    />
  </svg>
);

export default PlaneCursor;
