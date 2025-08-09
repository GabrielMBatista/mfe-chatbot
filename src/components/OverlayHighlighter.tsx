import { useEffect, useState } from "react";

interface OverlayHighlighterProps {
  target: HTMLElement | null;
}

export const OverlayHighlighter = ({ target }: OverlayHighlighterProps) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target) return;

    const update = () => {
      setRect(target.getBoundingClientRect());
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target]);

  if (!target || !rect) return null;

  return (
    <div
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          borderRadius: 8,
          transition: "all 0.3s",
        }}
      />
    </div>
  );
};

export default OverlayHighlighter;
