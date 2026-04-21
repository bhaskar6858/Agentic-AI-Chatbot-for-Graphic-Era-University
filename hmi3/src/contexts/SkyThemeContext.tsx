import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type SkyTheme = "day" | "night";

interface SkyThemeContextValue {
  theme: SkyTheme;
  toggle: () => void;
  setTheme: (t: SkyTheme) => void;
}

const SkyThemeContext = createContext<SkyThemeContextValue | undefined>(undefined);

export const SkyThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<SkyTheme>(
    () => (localStorage.getItem("airbus_sky_theme") as SkyTheme) || "day"
  );

  useEffect(() => {
    localStorage.setItem("airbus_sky_theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "day" ? "night" : "day"));

  return (
    <SkyThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </SkyThemeContext.Provider>
  );
};

export const useSkyTheme = () => {
  const ctx = useContext(SkyThemeContext);
  if (!ctx) throw new Error("useSkyTheme must be used within SkyThemeProvider");
  return ctx;
};
