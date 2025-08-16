import { useState, useEffect } from "react";
import {
  Tokens,
  tokensLight,
  tokensDark,
  injectGlobalStyles,
} from "@/styles/tokens";

export function useLocalTokens(): Tokens {
  useEffect(() => {
    injectGlobalStyles(); // Garantir que os estilos globais sejam aplicados
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const html = document.documentElement;
    const update = () => setIsDark(html.classList.contains("dark"));
    update();

    const mo = new MutationObserver(update);
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  return isDark ? tokensDark : tokensLight;
}
