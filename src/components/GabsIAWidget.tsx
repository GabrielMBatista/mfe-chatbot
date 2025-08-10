import { useEffect, useRef, useState } from "react";
import OverlayHighlighter from "./OverlayHighlighter";
import { useGabsIA } from "@/hooks/useGabsIA";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import guidedSteps from "@/tourSteps";

export const TYPES_VERSION = "1.0.0";

declare global {
  interface Window {
    reopenGabsIAWidget?: () => void;
  }
}

export type DockPos = Partial<{
  top: number | string;
  left: number | string;
  right: number | string;
  bottom: number | string;
}>;

export type GabsIAWidgetProps = {
  tourEnabled?: boolean;
  fixedPosition?: DockPos;
};

const localStorageKey = "gabs_disabled";
const positionStorageKey = "gabs_position";
const tourStorageKey = "gabs_tour_skipped";
const base = process.env.NEXT_PUBLIC_CHATBOT_ORIGIN || "http://localhost:3001";

const ASSETS = {
  anchor: `${base}/widget-anchor.lottie`,
  robot: `${base}/robot-avatar.lottie`,
};

export function reopenGabsIAWidget() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(localStorageKey);
  } catch {}
  window.dispatchEvent(new Event("enableGabs"));
  window.dispatchEvent(new Event("openChat"));
}

export function pinGabsIAWidgetAt(position: DockPos) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("pinGabs", { detail: position } as any));
}

export function unpinGabsIAWidget() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("unpinGabs"));
}

export const GabsIAWidget = ({
  tourEnabled = false,
  fixedPosition,
}: GabsIAWidgetProps) => {
  const { askGabs, loading, responses } = useGabsIA();
  const [tourIndex, setTourIndex] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [tourSkipped, setTourSkipped] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dockPos, setDockPos] = useState<DockPos>({});

  const [highlightTarget, setHighlightTarget] = useState<HTMLElement | null>(
    null
  );
  const widgetRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<number>(0);
  const dragOffset = useRef({ x: 0, y: 0 });
  const latestPosRef = useRef<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const [position, setPosition] = useState(() => ({
    top: typeof window !== "undefined" ? window.innerHeight / 3 - 32 : 300,
    left: typeof window !== "undefined" ? window.innerWidth / 3 - 32 : 300,
  }));

  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved === "true") setDisabled(true);
    const skipped = localStorage.getItem(tourStorageKey);
    if (skipped === "true") setTourSkipped(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (disabled) return;
      const el = (e.target as HTMLElement).closest("[data-gabs]");
      if (!el) return;
      const id = el.getAttribute("data-gabs");
      if (id && responses[id]) {
        highlightElement(el as HTMLElement);
        setContextMessage(responses[id].reply);
        setAiReply(null);
        setShowInput(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [responses, disabled]);

  const highlightElement = (el: HTMLElement) => {
    setHighlightTarget(el);
    el.style.outline = "2px solid #0028af";
    el.style.transition = "outline 0.3s";
    setTimeout(() => {
      el.style.outline = "";
      setHighlightTarget(null);
    }, 2000);
  };

  const runTourStep = (index: number) => {
    const step = guidedSteps[index];
    if (!step) {
      setTourActive(false);
      setContextMessage(null);
      return;
    }
    const el = step.target
      ? (document.querySelector(step.target) as HTMLElement | null)
      : null;
    if (el) {
      highlightElement(el);
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 80,
        left: rect.left + window.scrollX - 80,
      });
      if (step.action === "click") {
        (el as HTMLElement).click();
      }
    }
    setContextMessage(step.content);
    setAiReply(null);
    setShowInput(false);
    if (step.action === "openChat") {
      window.dispatchEvent(new Event("openChat"));
    }
  };

  const startTour = () => {
    if (!guidedSteps.length) return;
    setTourActive(true);
    setTourIndex(0);
    runTourStep(0);
  };

  const nextTourStep = () => {
    const next = tourIndex + 1;
    if (next < guidedSteps.length) {
      setTourIndex(next);
      runTourStep(next);
    } else {
      setTourActive(false);
      setContextMessage(null);
    }
  };

  const skipTour = () => {
    localStorage.setItem(tourStorageKey, "true");
    setTourSkipped(true);
    setTourActive(false);
    setContextMessage(null);
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const clampPosition = (x: number, y: number) => {
    const sz = isMobile ? 64 : 54;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clampedX = Math.min(Math.max(x, margin), vw - sz - margin);
    const clampedY = Math.min(Math.max(y, margin), vh - sz - margin);
    return { left: clampedX, top: clampedY };
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(positionStorageKey);
      if (raw) {
        const p = JSON.parse(raw) as { left?: number; top?: number };
        if (typeof p.left === "number" && typeof p.top === "number") {
          const clamped = clampPosition(p.left, p.top);
          setPosition({ top: clamped.top, left: clamped.left });
        }
      }
    } catch {}
  }, [isMobile]);

  useEffect(() => {
    if (disabled) return;
    try {
      const raw = localStorage.getItem(positionStorageKey);
      if (raw) {
        const p = JSON.parse(raw) as { left?: number; top?: number };
        if (typeof p.left === "number" && typeof p.top === "number") {
          const clamped = clampPosition(p.left, p.top);
          setPosition({ top: clamped.top, left: clamped.left });
        }
      }
    } catch {}
  }, [disabled]);

  useEffect(() => {
    const handler = () => {
      if (pinned) return;
      setPosition((prev) => clampPosition(prev.left, prev.top));
    };
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, [pinned, isMobile]);

  useEffect(() => {
    latestPosRef.current = { left: position.left, top: position.top };
  }, [position]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const { left, top } = clampPosition(
        e.clientX - dragOffset.current.x,
        e.clientY - dragOffset.current.y
      );
      setPosition({ left, top });
    };
    const onMouseUp = () => {
      if (!pinned) {
        try {
          localStorage.setItem(
            positionStorageKey,
            JSON.stringify(latestPosRef.current)
          );
        } catch {}
      }
      setTimeout(() => setIsDragging(false), 100);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    const startMouseOnAvatar = (e: MouseEvent) => {
      if (pinned) return;
      const rect = avatarRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };
    const startMouseOnContainer = (e: MouseEvent) => {
      if (pinned) return;
      const rect = widgetRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const { left, top } = clampPosition(
        t.clientX - dragOffset.current.x,
        t.clientY - dragOffset.current.y
      );
      setPosition({ left, top });
    };
    const onTouchEnd = () => {
      if (!pinned) {
        try {
          localStorage.setItem(
            positionStorageKey,
            JSON.stringify(latestPosRef.current)
          );
        } catch {}
      }
      setTimeout(() => setIsDragging(false), 100);
      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("touchend", onTouchEnd as any);
      window.removeEventListener("touchcancel", onTouchEnd as any);
    };
    const startTouch = (e: TouchEvent) => {
      if (pinned) return;
      const rect = avatarRef.current?.getBoundingClientRect();
      const t = e.touches[0];
      if (!rect || !t) return;
      dragOffset.current = {
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
      };
      setIsDragging(true);
      window.addEventListener("touchmove", onTouchMove as any, {
        passive: false,
      });
      window.addEventListener("touchend", onTouchEnd as any);
      window.addEventListener("touchcancel", onTouchEnd as any);
    };
    const el = avatarRef.current;
    el?.addEventListener("mousedown", startMouseOnAvatar as any);
    el?.addEventListener("touchstart", startTouch as any, { passive: false });
    const container = widgetRef.current;
    container?.addEventListener("mousedown", startMouseOnContainer as any);
    return () => {
      el?.removeEventListener("mousedown", startMouseOnAvatar as any);
      el?.removeEventListener("touchstart", startTouch as any);
      container?.removeEventListener("mousedown", startMouseOnContainer as any);
    };
  }, [pinned, isMobile]);

  useEffect(() => {
    const handleOpenChat = () => {
      setContextMessage(null);
      setAiReply(null);
      setShowInput(true);
    };
    window.addEventListener("openChat", handleOpenChat as any);
    return () => window.removeEventListener("openChat", handleOpenChat as any);
  }, []);

  useEffect(() => {
    const handleEnable = () => setDisabled(false);
    window.addEventListener("enableGabs", handleEnable as any);
    return () => window.removeEventListener("enableGabs", handleEnable as any);
  }, []);

  useEffect(() => {
    if (disabled) {
      setPinned(true);
      if (fixedPosition && Object.keys(fixedPosition).length) {
        setDockPos(fixedPosition);
      }
    } else {
      setPinned(false);
    }
  }, [disabled, fixedPosition]);

  useEffect(() => {
    const onPin = (e: Event) => {
      const detail = (e as CustomEvent<DockPos>).detail || {};
      if (disabled && detail && Object.keys(detail).length) setDockPos(detail);
    };
    const onUnpin = () => {};
    window.addEventListener("pinGabs", onPin as any);
    window.addEventListener("unpinGabs", onUnpin as any);
    return () => {
      window.removeEventListener("pinGabs", onPin as any);
      window.removeEventListener("unpinGabs", onUnpin as any);
    };
  }, []);

  useEffect(() => {
    window.reopenGabsIAWidget = () => {
      reopenGabsIAWidget();
    };
    return () => {
      delete window.reopenGabsIAWidget;
    };
  }, []);

  const sendQuestion = async () => {
    if (!userMessage.trim()) return;
    setContextMessage(null);
    setAiReply(null);
    try {
      const data = await askGabs(userMessage);
      setAiReply(data.reply || "Sem resposta.");
    } catch {
      setAiReply("Erro ao se comunicar com a IA.");
    } finally {
      setUserMessage("");
    }
  };

  const stylePosition: DockPos = pinned
    ? fixedPosition && Object.keys(fixedPosition).length
      ? fixedPosition
      : dockPos
    : { top: position.top, left: position.left };

  return (
    <div
      ref={widgetRef}
      style={{
        position: "fixed",
        ...stylePosition,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        cursor: pinned ? "default" : "grab",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {!disabled && <OverlayHighlighter target={highlightTarget} />}

      {(contextMessage || aiReply || showInput) && !disabled && (
        <div
          style={{
            maxWidth: isMobile ? "92vw" : 300,
            width: isMobile ? "92vw" : 300,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 12,
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            padding: 12,
            marginBottom: 8,
            position: "relative",
            maxHeight: isMobile ? "60vh" : undefined,
            overflow: isMobile ? "auto" : "visible",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!reduceMotion ? (
                <DotLottieReact
                  src={ASSETS.robot}
                  loop
                  autoplay
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    overflow: "hidden",
                  }}
                />
              ) : (
                <img
                  src={ASSETS.robot}
                  alt="Avatar G•One"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = ASSETS.robot;
                  }}
                  style={{ width: 24, height: 24, borderRadius: "50%" }}
                />
              )}
              <strong>G•One</strong>
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.setItem(localStorageKey, "true");
                } catch {}
                setDisabled(true);
                setContextMessage(null);
                setAiReply(null);
                setShowInput(false);
                setHighlightTarget(null);
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: 16,
                cursor: "pointer",
                color: "#999",
                padding: 0,
                margin: 0,
              }}
              title="Fechar"
            >
              ✖
            </button>
          </div>

          {loading && <p>Gerando resposta...</p>}
          {contextMessage && <p>{contextMessage}</p>}
          {aiReply && <p>{aiReply}</p>}
          {showInput && (
            <>
              <input
                ref={inputRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
                placeholder="Digite sua pergunta"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: 6,
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={sendQuestion}
                style={{
                  marginTop: 6,
                  background: "#0028af",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Perguntar
              </button>
            </>
          )}

          {tourActive && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <button
                onClick={nextTourStep}
                style={{
                  background: "#0028af",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {guidedSteps[tourIndex]?.action === "openChat"
                  ? "Abrir chat"
                  : "Próximo"}
              </button>
              <button
                onClick={skipTour}
                style={{
                  background: "none",
                  border: "none",
                  color: "#999",
                  cursor: "pointer",
                }}
              >
                Pular tour
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {tourEnabled && !tourActive && !tourSkipped && !disabled && (
          <button
            onClick={startTour}
            style={{
              background: "#0028af",
              color: "#fff",
              border: "none",
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Iniciar tour
          </button>
        )}

        <div
          ref={avatarRef}
          className="gabs-avatar"
          role="button"
          aria-label="Abrir G•One"
          title="Arraste-me ou clique em um item do portfólio"
          onDoubleClick={() => {
            if (disabled) {
              reopenGabsIAWidget();
              return;
            }
            setContextMessage(null);
            setAiReply(null);
            setShowInput(true);
            setHighlightTarget(null);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          onClick={() => {
            if (isDragging) return;
            if (disabled) {
              reopenGabsIAWidget();
              return;
            }
            if (isMobile) {
              const now = Date.now();
              if (now - (lastTapRef.current || 0) < 300) {
                setContextMessage(null);
                setAiReply(null);
                setShowInput(true);
                setHighlightTarget(null);
                setTimeout(() => inputRef.current?.focus(), 0);
                lastTapRef.current = 0;
                return;
              }
              lastTapRef.current = now;
            }
            setContextMessage(null);
            setAiReply(null);
            setShowInput((prev) => !prev);
            setHighlightTarget(null);
          }}
          style={{
            width: isMobile ? 64 : 54,
            height: isMobile ? 64 : 54,
            borderRadius: "50%",
            background: "#0028af",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 0 12px rgba(0,0,0,0.2)",
            userSelect: "none",
            touchAction: "none",
            overflow: "hidden",
          }}
        >
          {!reduceMotion ? (
            <DotLottieReact
              src={ASSETS.anchor}
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <img
              src={ASSETS.anchor}
              alt="Abrir assistente"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = ASSETS.anchor;
              }}
              style={{ width: "60%", height: "60%", objectFit: "contain" }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GabsIAWidget;
