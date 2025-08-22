import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useGabsIAWidget } from "@/hooks/useGabsIAWidget";
import { HelpCircle, Play } from "lucide-react";
import { CustomTour } from "@/components/CustomTour";
import { DockPos, GabsIAWidgetProps, TourStep } from "Chatbot/GabsIAWidget";
import { useTourController } from "@/hooks/useTourController";
import React from "react";

// Adiciona nova prop opcional para steps fixos
export interface GabsIAWidgetConfigurableProps extends GabsIAWidgetProps {
  fixedPosition?: DockPos;
  fixedTourSteps?: TourStep[]; // Corrigido para sempre TourStep
  onNavigate?: (route: string) => void; // Nova prop
}

export const GabsIAWidget = ({
  fixedPosition,
  fixedTourSteps,
  initialMessage,
  onNavigate,
}: GabsIAWidgetConfigurableProps & {
  initialMessage?: { question: string; answer: string; owner: "gone" };
}) => {
  const base =
    process.env.NEXT_PUBLIC_CHATBOT_ORIGIN || "http://localhost:3001";
  const ASSETS = {
    anchor: `${base}/Widget-anchor.lottie`,
    loading: `${base}/Loading.lottie`,
    typing: `${base}/Typing.lottie`, // Adicionado
  };

  const {
    reopenGabsIAWidget,
    history,
    setHistory,
    disabled,
    setDisabled,
    contextMessage,
    setContextMessage,
    userMessage,
    setUserMessage,
    aiReply,
    setAiReply,
    isDragging,
    setIsDragging,
    reduceMotion,
    isMobile,
    widgetRef,
    avatarRef,
    inputRef,
    lastTapRef,
    chatContainerRef,
    sendQuestion,
    stylePosition,
    localStorageKey,
    dragOffset,
    onmousemove,
    onmouseup,
    ontouchmove,
    ontouchend,
  } = useGabsIAWidget({ fixedPosition, initialMessage });

  const {
    tourState,
    dynamicTourEnabled,
    setDynamicTourEnabled,
    currentStep,
    handleTourComplete,
    handleNextStep,
    handlePrevStep,
    startFixedTour,
  } = useTourController({ fixedTourSteps, onNavigate });

  const allowedKeywords = [
    "gabriel",
    "portfólio",
    "projeto",
    "experiência",
    "habilidade",
    "idade",
    "casado",
    "filhos",
    "cidade",
  ];

  const isQuestionAllowed = (question: string) => {
    const q = question.toLowerCase();
    return allowedKeywords.some((kw) => q.includes(kw));
  };

  React.useEffect(() => {
    const handler = () => startFixedTour();
    window.addEventListener("startGabsTour", handler);
    return () => window.removeEventListener("startGabsTour", handler);
  }, [startFixedTour]);

  return (
    <>
      <CustomTour
        steps={tourState.steps}
        isRunning={tourState.run}
        onComplete={handleTourComplete}
        onSkip={handleTourComplete}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
        specificStep={currentStep}
      />
      <div
        ref={widgetRef}
        onMouseDown={(e: React.MouseEvent) => {
          const rect = widgetRef.current?.getBoundingClientRect();
          if (!rect) return;
          dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
          setIsDragging(true);
          window.addEventListener("mousemove", onmousemove);
          window.addEventListener("mouseup", onmouseup);
        }}
        onTouchStart={(e: React.TouchEvent) => {
          const touch = e.touches[0];
          const rect = widgetRef.current?.getBoundingClientRect();
          if (!rect) return;
          dragOffset.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
          };
          setIsDragging(true);
          window.addEventListener("touchmove", ontouchmove, { passive: false });
          window.addEventListener("touchend", ontouchend);
          window.addEventListener("touchcancel", ontouchend);
        }}
        style={{
          position: "fixed",
          ...stylePosition,
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          cursor: isDragging ? "grabbing" : "grab",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {(contextMessage || aiReply || history.length > 0) && !disabled && (
          <div
            style={{
              maxWidth: isMobile ? "92vw" : 300,
              width: isMobile ? "92vw" : 300,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 12,
              boxShadow: "0 0 10px rgba(0,0,0,0.2)",
              padding: 5,
              marginBottom: 8,
              position: "relative",
              maxHeight: isMobile ? "60vh" : "400px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
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
              <strong>G•One</strong>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HelpCircle
                  size={24}
                  color="#0028af"
                  onClick={() => startFixedTour()}
                  style={{ cursor: "pointer" }}
                />
                <Play
                  size={24}
                  className="dynamic-tour"
                  color={dynamicTourEnabled ? "#28a745" : "#ccc"}
                  onClick={() => setDynamicTourEnabled((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                />
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem(localStorageKey, "true");
                    } catch {}
                    setDisabled(true);
                    setContextMessage(null);
                    setAiReply(null);
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
            </div>

            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                scrollbarWidth: "thin",
                scrollbarColor: "#0028af #f1f1f1",
              }}
            >
              {history.map((entry, idx) => {
                const isLast = idx === history.length - 1;
                // Sempre mostra o balão da pergunta do usuário
                return (
                  <React.Fragment key={`pair-${entry.index ?? entry.answer}`}>
                    {entry.question && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            background: "#0028af",
                            color: "#fff",
                            padding: "10px 14px",
                            borderRadius: "12px 0 12px 12px",
                            maxWidth: "80%",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            marginBottom: 2,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              lineHeight: "1.4",
                            }}
                          >
                            {entry.question}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Se for o último item e answer está vazio, mostra o balão de loading */}
                    {isLast && entry.answer === "" ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            background: "#f1f1f1",
                            color: "#000",
                            padding: "1px 1px",
                            borderRadius: "0 12px 12px 12px",
                            maxWidth: "95%",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            marginBottom: 1,
                            minHeight: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                          }}
                        >
                          <DotLottieReact
                            src={ASSETS.typing ?? "/Typing.lottie"}
                            loop
                            autoplay
                            style={{ width: 36, height: 36 }} // aumentado
                          />
                        </div>
                      </div>
                    ) : (
                      entry.answer && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              background:
                                "linear-gradient(90deg,#e3eafc 0%,#f7faff 100%)",
                              color: "#222",
                              padding: "12px 16px",
                              borderRadius: "0 16px 16px 16px",
                              maxWidth: "95%",
                              boxShadow: "0 2px 8px rgba(0,40,175,0.08)",
                              marginBottom: 2,
                              border: "1px solid #dbeafe",
                              fontSize: "15px",
                              fontFamily: "Inter, Arial, sans-serif",
                              fontWeight: 500,
                              letterSpacing: "0.01em",
                            }}
                          >
                            {/* Interpreta HTML nas respostas do agente */}
                            <p
                              style={{
                                margin: 0,
                                lineHeight: "1.5",
                                wordBreak: "break-word",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: entry.answer.replace(/\n/g, "<br />"),
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {
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
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={() => {
                    if (!isQuestionAllowed(userMessage)) {
                      setAiReply(
                        "Desculpe, só posso responder perguntas sobre Gabriel Marques ou seu portfólio."
                      );
                      return;
                    }
                    sendQuestion();
                  }}
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
            }
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            ref={avatarRef}
            className="gabs-avatar"
            role="button"
            aria-label="Abrir G•One"
            title="clique duas vezes para abrir o assistente"
            gabs-content="Este é o G•One, assistente do portfólio. Clique para conversar ou obter ajuda contextual."
            data-gabs={"gabs-avatar"}
            onDoubleClick={() => {
              if (disabled) {
                reopenGabsIAWidget(setHistory);
                return;
              }
              setContextMessage(null);
              setAiReply(null);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            onClick={() => {
              if (isDragging) return;
              if (disabled) {
                reopenGabsIAWidget(setHistory);
                return;
              }
              if (isMobile) {
                const now = Date.now();
                if (now - (lastTapRef.current || 0) < 300) {
                  setContextMessage(null);
                  setAiReply(null);

                  setTimeout(() => inputRef.current?.focus(), 0);
                  lastTapRef.current = 0;
                  return;
                }
                lastTapRef.current = now;
              }
              setContextMessage(null);
              setAiReply(null);
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
        <style>
          {`
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #f1f1f1;
            }
            ::-webkit-scrollbar-thumb {
              background: #0028af;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #001a80;
            }
          `}
        </style>
      </div>
    </>
  );
};

export function startGabsTour() {
  window.dispatchEvent(new Event("startGabsTour"));
}
export default GabsIAWidget;
