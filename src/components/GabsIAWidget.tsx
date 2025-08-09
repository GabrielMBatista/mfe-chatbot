import { useEffect, useRef, useState } from "react";

type ButtonAction = { label: string; anchorId: string };
type BotResponse = { reply: string; actions?: ButtonAction[] };

const localStorageKey = "gabs_disabled";
const base = process.env.NEXT_PUBLIC_CHATBOT_ORIGIN || "http://localhost:3001";

export const GabsIAWidget = () => {
  const [responses, setResponses] = useState<Record<string, BotResponse>>({});
  const [disabled, setDisabled] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(-1);
  const [reduceMotion, setReduceMotion] = useState(false);

  const tourSteps = [
    "Sou o Gabs.IA, seu assistente interativo neste portfólio.",
    "🖱️ Clique em qualquer elemento interativo para saber mais sobre ele — eu destacarei o item e explicarei como foi feito.",
    "❓ Clique duas vezes em mim para fazer uma pergunta livre sobre o Gabriel ou seus projetos.",
    "👋 Você pode me mover pela tela e me ocultar quando quiser.",
  ];

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
        setResponses(json);
      } catch (err) {
        console.error("[GabsIA] Erro ao carregar responses.json", err);
      }
    };
    loadResponses();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved === "true") setDisabled(true);
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
  }, [responses]);

  const highlightElement = (el: HTMLElement) => {
    el.style.outline = "2px solid #0028af";
    el.style.transition = "outline 0.3s";
    setTimeout(() => {
      el.style.outline = "";
    }, 2000);
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
  }, []);


  const sendQuestion = async () => {
    if (!userMessage.trim()) return;
    setLoading(true);
    setContextMessage(null);
    setAiReply(null);

    try {
      const res = await fetch("/api/gabsia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      setAiReply(data.reply || "Sem resposta.");
    } catch (err) {
      setAiReply("Erro ao se comunicar com a IA.");
    } finally {
      setLoading(false);
      setUserMessage("");
    }
  };

  if (disabled) return null;

  return (
    <div
      ref={widgetRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        cursor: "grab",
      }}
    >
      {tourStep !== null && (
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
              <p>Este tour é opcional. Você pode abrir o chat a qualquer momento.</p>
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
              <p>{tourSteps[tourStep]}</p>
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
                      tourStep < tourSteps.length - 1 ? tourStep + 1 : null
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
                  {tourStep < tourSteps.length - 1 ? "Próximo" : "Finalizar"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {(contextMessage || aiReply || showInput) && (
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
            <strong>Gabs.IA</strong>
            <button
              onClick={() => {
                setContextMessage(null);
                setAiReply(null);
                setShowInput(false);
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
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <button
              onClick={() => {
                localStorage.setItem(localStorageKey, "true");
                setDisabled(true);
              }}
              style={{
                fontSize: 10,
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
              }}
            >
              Desativar assistente
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          className="gabs-avatar"
          title="Arraste-me ou clique em um item do portfólio"
          onClick={() => {
            if (isDragging) return;
            setContextMessage(null);
            setAiReply(null);
            setShowInput((prev) => !prev);
          }}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#0028af",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 30,
            boxShadow: "0 0 12px rgba(0,0,0,0.2)",
            userSelect: "none",
            animation:
              tourStep !== null && !reduceMotion
                ? "gabs-bounce 1s infinite"
                : undefined,
          }}
        >
          🤖
        </div>
      </div>
    </div>
  );
};

export default GabsIAWidget;
