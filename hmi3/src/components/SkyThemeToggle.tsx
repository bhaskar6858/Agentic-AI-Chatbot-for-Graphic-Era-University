import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSkyTheme } from "@/contexts/SkyThemeContext";

const SkyThemeToggle = () => {
  const { theme, toggle } = useSkyTheme();
  const isNight = theme === "night";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isNight ? "day" : "night"} sky`}
      title={`Switch to ${isNight ? "day" : "night"} sky`}
      className="glass relative h-10 w-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-300 overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isNight ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute"
          >
            <Moon className="h-4 w-4 text-sky-glow" fill="currentColor" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute"
          >
            <Sun className="h-4 w-4 text-sun-warm" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default SkyThemeToggle;
