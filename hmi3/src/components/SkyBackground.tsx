import { useEffect, useMemo, useState } from "react";
import robotBgDay from "@/assets/robot-bg.jpg";
import robotBgNight from "@/assets/robot-bg-night.jpg";
import ur10Arm from "@/assets/ur10-arm.png";
import { useSkyTheme } from "@/contexts/SkyThemeContext";

const SkyBackground = () => {
  const { theme } = useSkyTheme();
  const isNight = theme === "night";
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const parallax = (factor: number) => ({
    transform: `translate(${(mouse.x - 0.5) * factor}px, ${(mouse.y - 0.5) * factor}px)`,
  });

  // Sparks scattered across the scene (more pronounced at night)
  const sparks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        top: 20 + Math.random() * 60,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.6,
        delay: Math.random() * 4,
        depth: Math.random() * 2 + 1,
      })),
    []
  );

  // Foreground robot arms — positioned along the bottom, gently animating
  const robots = useMemo(
    () => [
      { id: 1, side: "left" as const, bottom: -40, size: 280, delay: 0,   duration: 5.5, depth: 22, opacity: 0.55 },
      { id: 2, side: "right" as const, bottom: -60, size: 320, delay: 1.2, duration: 6.8, depth: 28, opacity: 0.60 },
      { id: 3, side: "left" as const, bottom: -20, size: 180, delay: 2.4, duration: 7.5, depth: 14, opacity: 0.35 },
      { id: 4, side: "right" as const, bottom: -10, size: 160, delay: 3.0, duration: 8.2, depth: 12, opacity: 0.30 },
    ],
    []
  );

  const visibleSparks = isNight ? sparks : sparks.slice(0, 20);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-sky-deep">
      {/* DAY factory photo */}
      <div
        className="absolute inset-0 bg-cover bg-center will-change-transform transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: `url(${robotBgDay})`,
          animation: "sky-pan 60s ease-in-out infinite alternate",
          opacity: isNight ? 0 : 1,
          ...parallax(-8),
        }}
      />
      {/* NIGHT factory photo */}
      <div
        className="absolute inset-0 bg-cover bg-center will-change-transform transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: `url(${robotBgNight})`,
          animation: "sky-pan 60s ease-in-out infinite alternate",
          opacity: isNight ? 1 : 0,
          ...parallax(-8),
        }}
      />

      {/* Warm industrial glow — DAY */}
      <div
        className="absolute inset-0 mix-blend-soft-light will-change-transform transition-opacity duration-[1500ms]"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 55%, hsl(32 100% 65% / 0.45), transparent 70%)",
          animation: "sun-pulse 8s ease-in-out infinite",
          opacity: isNight ? 0 : 1,
          ...parallax(-15),
        }}
      />

      {/* Cyan neon glow — NIGHT */}
      <div
        className="absolute inset-0 will-change-transform transition-opacity duration-[1500ms]"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 50%, hsl(195 95% 55% / 0.30), transparent 65%)",
          animation: "sun-pulse 10s ease-in-out infinite",
          opacity: isNight ? 1 : 0,
          ...parallax(-15),
        }}
      />

      {/* Heavy darkening overlay — improves text contrast over busy factory image */}
      <div
        className="absolute inset-0"
        style={{
          background: isNight
            ? "linear-gradient(to bottom, hsl(var(--sky-deep) / 0.55) 0%, hsl(var(--sky-deep) / 0.65) 100%)"
            : "linear-gradient(to bottom, hsl(var(--sky-deep) / 0.45) 0%, hsl(var(--sky-deep) / 0.55) 100%)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, hsl(var(--sky-deep) / 0.7) 100%)",
        }}
      />

      {/* Top + bottom dark gradients */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-deep/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-sky-deep/80 to-transparent" />

      {/* Floating sparks */}
      {visibleSparks.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full will-change-transform transition-opacity duration-[1500ms]"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            background: isNight ? "hsl(195 95% 75%)" : "hsl(32 100% 75%)",
            animation: `spark-float ${4 + (s.id % 5)}s ease-in-out infinite, twinkle 2.5s ease-in-out infinite`,
            animationDelay: `${s.delay}s, ${s.delay}s`,
            opacity: isNight ? 0.95 : 0.7,
            boxShadow: isNight
              ? `0 0 ${s.size * 4}px hsl(195 95% 70% / 0.9)`
              : `0 0 ${s.size * 4}px hsl(32 100% 65% / 0.7)`,
            ...parallax(s.depth * -3),
          }}
        />
      ))}

      {/* Foreground UR10 robot arms */}
      {robots.map((r) => (
        <div
          key={r.id}
          className="absolute will-change-transform"
          style={{
            [r.side]: -40,
            bottom: r.bottom,
            opacity: r.opacity * (isNight ? 0.85 : 1),
            ...parallax(-r.depth),
          }}
        >
          <div
            style={{
              animation: `robot-sway ${r.duration}s ease-in-out infinite`,
              animationDelay: `${r.delay}s`,
              transformOrigin: "bottom center",
            }}
          >
            <img
              src={ur10Arm}
              alt=""
              width={r.size}
              height={r.size}
              style={{
                width: r.size,
                height: "auto",
                transform: r.side === "right" ? "scaleX(-1)" : "none",
                filter: isNight
                  ? "brightness(0.55) drop-shadow(0 8px 20px hsl(195 95% 50% / 0.4))"
                  : "brightness(0.85) drop-shadow(0 8px 20px hsl(32 100% 50% / 0.35))",
              }}
            />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes sky-pan {
          0%   { transform: scale(1.05) translate(0, 0); }
          100% { transform: scale(1.12) translate(-1.5%, -1%); }
        }
        @keyframes sun-pulse {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        @keyframes spark-float {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(4px, -8px); }
        }
        @keyframes robot-sway {
          0%, 100% { transform: rotate(-2deg); }
          50%      { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
};

export default SkyBackground;
