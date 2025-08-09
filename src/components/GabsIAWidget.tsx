import { useEffect, useRef, useState } from "react";
import OverlayHighlighter from "./OverlayHighlighter";
import { useGabsIA } from "@/hooks/useGabsIA";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Versão dos tipos/contrato do widget (atualize ao mudar a API/props/tipos)
export const TYPES_VERSION = "1.0.0";

// Tipagem global para a função de reabrir o chat
declare global {
  interface Window {
    reopenGabsIAWidget?: () => void;
  }
}

export type ButtonAction = { label: string; anchorId: string };
export type BotResponse = { reply: string; actions?: ButtonAction[] };
export type TourStep = { selector: string; message: string; action: string };
export type DockPos = Partial<{
  top: number;
  left: number;
  right: number;
  bottom: number;
}>;

export type GabsIAWidgetProps = {
  tourEnabled?: boolean;
  // posição fixa definida pelo shell (ex.: { bottom: 24, right: 24 })
  fixedPosition?: DockPos;
};

const localStorageKey = "gabs_disabled";
const tourStorageKey = "gabs_tour_skipped";
const base = process.env.NEXT_PUBLIC_CHATBOT_ORIGIN || "http://localhost:3001";

// Novos assets (servir do origin do MF para evitar 404 no host)
const ASSETS = {
  anchor: `${base}/widget-anchor.lottie`,
  robot: `${base}/robot-avatar.lottie`,
};

// Export nomeado para o shell: import { reopenGabsIAWidget } from 'Chatbot/GabsIAWidget'
export function reopenGabsIAWidget() {
  if (typeof window === "undefined") return;
  try {
    // desfaz o "Desativar assistente"
    localStorage.removeItem(localStorageKey);
  } catch {}
  // reabilita o widget e abre o chat
  window.dispatchEvent(new Event("enableGabs"));
  window.dispatchEvent(new Event("openChat"));
}

// Novo: export para o shell definir posição fixa
export function pinGabsIAWidgetAt(position: DockPos) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("pinGabs", { detail: position } as any));
}

// Novo: export para desfazer modo fixo
export function unpinGabsIAWidget() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("unpinGabs"));
}

export const GabsIAWidget = ({
  tourEnabled = false,
  fixedPosition,
}: GabsIAWidgetProps) => {
  const [responses, setResponses] = useState<Record<string, BotResponse>>({});
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [tourSkipped, setTourSkipped] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const { askGabs, loading } = useGabsIA();
  const [showInput, setShowInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(-1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dockPos, setDockPos] = useState<DockPos>({});

  const [showInstructions, setShowInstructions] = useState(true);

  const introSteps = [
    "Sou o G•One, seu assistente interativo neste portfólio.",
    "🖱️ Clique em qualquer elemento interativo para saber mais sobre ele — eu destacarei o item e explicarei como foi feito.",
    "❓ Clique duas vezes em mim para fazer uma pergunta livre sobre o Gabriel ou seus projetos.",
    "👋 Você pode me mover pela tela e me ocultar quando quiser.",
  ];
  const [highlightTarget, setHighlightTarget] = useState<HTMLElement | null>(
    null
  );
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => ({
    top: typeof window !== "undefined" ? window.innerHeight / 3 - 32 : 300,
    left: typeof window !== "undefined" ? window.innerWidth / 3 - 32 : 300,
  }));

  useEffect(() => {
    const loadResponses = async () => {
      try {
        const res = await fetch(`${base}/responses.json`);
        const json = await res.json();
        const { tourSteps: steps = [], ...bot } = json;
        setResponses(bot);
        setTourSteps(steps);
      } catch (err) {
        console.error("[GabsIA] Erro ao carregar responses.json", err);
      }
    };
    loadResponses();
  }, []);

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
      // quando desativado, não reage a anchors/data-gabs
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
    const step = tourSteps[index];
    if (!step) {
      setTourActive(false);
      setContextMessage(null);
      return;
    }
    const el = document.querySelector(step.selector) as HTMLElement | null;
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
    setContextMessage(step.message);
    setAiReply(null);
    setShowInput(false);
  };

  const startTour = () => {
    if (!tourSteps.length) return;
    setTourActive(true);
    setTourIndex(0);
    runTourStep(0);
  };

  const nextTourStep = () => {
    const next = tourIndex + 1;
    if (next < tourSteps.length) {
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
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        top: e.clientY - dragOffset.current.y,
        left: e.clientX - dragOffset.current.x,
      });
    };

    const handleMouseUp = () => {
      setTimeout(() => setIsDragging(false), 100);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    const startDrag = (e: MouseEvent) => {
      // drag desabilitado somente quando pinned (ou seja, quando disabled === true)
      if (pinned) return;
      const rect = widgetRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    const el = widgetRef.current;
    el?.addEventListener("mousedown", startDrag as any);
    return () => el?.removeEventListener("mousedown", startDrag as any);
  }, [pinned]);

  useEffect(() => {
    const handleOpenChat = () => {
      setContextMessage(null);
      setAiReply(null);
      setShowInput(true);
      setShowInstructions(false);
    };
    window.addEventListener("openChat", handleOpenChat as any);
    return () => window.removeEventListener("openChat", handleOpenChat as any);
  }, []);

  // Reage ao "enableGabs" para reativar o widget após desfazer o disable
  useEffect(() => {
    const handleEnable = () => setDisabled(false);
    window.addEventListener("enableGabs", handleEnable as any);
    return () => window.removeEventListener("enableGabs", handleEnable as any);
  }, []);

  // pinned segue o estado "disabled": só fixa quando gabs_disabled === "true"
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

  // Ouve eventos do shell para ajustar posição quando pinned (disabled === true)
  useEffect(() => {
    const onPin = (e: Event) => {
      const detail = (e as CustomEvent<DockPos>).detail || {};
      if (disabled && detail && Object.keys(detail).length) setDockPos(detail);
    };
    const onUnpin = () => {
      /* ignorado: pinned é derivado de disabled */
    };
    window.addEventListener("pinGabs", onPin as any);
    window.addEventListener("unpinGabs", onUnpin as any);
    return () => {
      window.removeEventListener("pinGabs", onPin as any);
      window.removeEventListener("unpinGabs", onUnpin as any);
    };
  }, []);

  useEffect(() => {
    // expõe função global (compat com chamadas diretas do shell)
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
    } catch (err) {
      setAiReply("Erro ao se comunicar com a IA.");
    } finally {
      setUserMessage("");
    }
  };

  // Estilo de posição: quando pinned (disabled === true), usa fixedPosition (se existir) ou dockPos; senão usa posição arrastável
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
      }}
    >
      {!disabled && <OverlayHighlighter target={highlightTarget} />}

      {showInstructions && tourStep !== null && !disabled && (
        <div
          style={{
            maxWidth: 300,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 12,
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            padding: 12,
            marginBottom: 8,
            position: "relative",
          }}
        >
          {tourStep === -1 ? (
            <>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                Bem-vindo! 👋
              </div>
              <p>
                Este tour é opcional. Você pode abrir o chat a qualquer momento.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={() => setTourStep(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0028af",
                    cursor: "pointer",
                  }}
                >
                  Pular tour
                </button>
                <button
                  onClick={() => setTourStep(0)}
                  style={{
                    background: "#0028af",
                    color: "#fff",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Começar
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{introSteps[tourStep]}</p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={() => setTourStep(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0028af",
                    cursor: "pointer",
                  }}
                >
                  Pular tour
                </button>
                <button
                  onClick={() =>
                    setTourStep(
                      tourStep < introSteps.length - 1 ? tourStep + 1 : null
                    )
                  }
                  style={{
                    background: "#0028af",
                    color: "#fff",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {tourStep < introSteps.length - 1 ? "Próximo" : "Finalizar"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {(contextMessage || aiReply || showInput) && !disabled && (
        <div
          style={{
            maxWidth: 300,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 12,
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            padding: 12,
            marginBottom: 8,
            position: "relative",
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
            {/* avatar do robô + título */}
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
                // fecha o chat e ativa o modo "desativado/fixo"
                try {
                  localStorage.setItem(localStorageKey, "true");
                } catch {}
                setDisabled(true);
                setContextMessage(null);
                setAiReply(null);
                setShowInput(false); // reduz ao canvas básico
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
                {tourSteps[tourIndex]?.action || "Próximo"}
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
          className="gabs-avatar"
          role="button"
          aria-label="Abrir G•One"
          title="Arraste-me ou clique em um item do portfólio"
          onClick={() => {
            if (isDragging) return;
            if (disabled) {
              // reativa e abre o chat quando o usuário clicar no avatar
              reopenGabsIAWidget();
              return;
            }
            setContextMessage(null);
            setAiReply(null);
            setShowInput((prev) => !prev);
            setHighlightTarget(null);
          }}
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "#0028af",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 0 12px rgba(0,0,0,0.2)",
            userSelect: "none",
            animation:
              tourStep !== null && !reduceMotion
                ? "gabs-bounce 1s infinite"
                : undefined,
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
