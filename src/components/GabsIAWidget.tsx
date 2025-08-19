import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useGabsIAWidget } from "@/hooks/useGabsIAWidget";
import { HelpCircle, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { CustomTour } from "@/components/CustomTour";
import { DockPos, GabsIAWidgetProps, TourStep } from "Chatbot/GabsIAWidget";

export const GabsIAWidget = ({
  fixedPosition,
}: GabsIAWidgetProps & { fixedPosition?: DockPos }) => {
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
    ASSETS,
    dragOffset,
    onmousemove,
    onmouseup,
    ontouchmove,
    ontouchend,
  } = useGabsIAWidget({ fixedPosition });

  const [tourState, setTourState] = useState<{
    run: boolean;
    steps: (TourStep | { target: string; content: string })[];
  }>({
    run: false,
    steps: [
      {
        target: ".gabs-avatar",
        content: "Este é o assistente G•One. Clique para interagir!",
      },
    ],
  });

  const [dynamicTourEnabled, setDynamicTourEnabled] = useState(false); // Estado para ativar/desativar o tour dinâmico

  const startFixedTour = () => {
    setTourState((prev) => ({
      ...prev,
      run: true,
      steps: [
        {
          target: ".gabs-avatar", // Widget do assistente G•One
          content:
            "Este é o G•One, assistente do portfólio. Clique para interagir ou buscar explicações rápidas nas áreas marcadas.",
        },
        {
          target: "header", // Cabeçalho do site
          content:
            "Navegue pelas principais seções do portfólio e alterne o tema aqui.",
        },
        {
          target: ".projects-section, [data-gabs='projects']", // Seção de projetos
          content:
            "Aqui estão os projetos desenvolvidos. Use filtros e busca para explorar.",
        },
        {
          target: ".theme-toggle, [data-gabs='theme']", // Alternância de tema
          content: "Alterne entre modo claro e escuro para melhor experiência.",
        },
        {
          target: ".search input", // Barra de busca de projetos
          content: "Pesquise projetos por nome, tecnologia ou descrição.",
        },
        {
          target: ".categories-filter, [data-gabs='filters']", // Filtros de categoria
          content:
            "Filtre os projetos por categoria: Frontend, Backend, Fullstack, Mobile.",
        },
        {
          target: "[data-gabs^='featured-project-']", // Projetos em destaque
          content: "Veja os projetos em destaque, com demonstração e código.",
        },
        {
          target: "[data-gabs^='project-']", // Card de projeto individual
          content:
            "Clique para ver detalhes, acessar demo ou código no GitHub.",
        },
        {
          target: "[data-gabs^='github-link-']", // Link para GitHub do projeto
          content: "Acesse o repositório do projeto diretamente pelo botão.",
        },
        {
          target: "[data-gabs^='view-details-']", // Botão de ver detalhes/demo
          content: "Veja uma prévia do projeto em diferentes resoluções.",
        },
        {
          target: ".cta-section, [data-gabs='cta']", // Seção de chamada para ação
          content: "Entre em contato ou saiba mais sobre o desenvolvedor.",
        },
        {
          target: "footer", // Rodapé do site
          content: "Links úteis, redes sociais e informações adicionais.",
        },
        {
          target: ".about-section, [data-gabs='about']", // Sobre/Experiência
          content:
            "Conheça a trajetória profissional e educacional do Gabriel.",
        },
      ],
    }));
  };

  const startDynamicTour = (gabsValue: string) => {
    const dynamicSteps: TourStep[] = [
      {
        target: `[data-gabs="${gabsValue}"]`,
        content: `Detalhes do item: ${gabsValue}`,
      },
    ];
    setTourState((prev) => ({
      ...prev,
      run: true,
      steps: dynamicSteps,
    }));
  };

  const handleTourComplete = () =>
    setTourState((prev) => ({ ...prev, run: false }));

  useEffect(() => {
    const handleDataGabsClick = (e: MouseEvent) => {
      if (!dynamicTourEnabled) return;

      const target = e.target as HTMLElement;
      const gabsValue = target
        .closest("[data-gabs]")
        ?.getAttribute("data-gabs");
      if (gabsValue) {
        startDynamicTour(gabsValue);
      }
    };

    document.addEventListener("click", handleDataGabsClick);

    return () => {
      document.removeEventListener("click", handleDataGabsClick);
    };
  }, [dynamicTourEnabled]); // Certifique-se de que `dynamicTourEnabled` seja estável

  useEffect(() => {
    if (!tourState.run) return; // Evita reexecução desnecessária
  }, []); // Removemos `tourState.run` para evitar loops

  return (
    <>
      <CustomTour
        steps={tourState.steps}
        isRunning={tourState.run}
        onComplete={handleTourComplete}
        onSkip={handleTourComplete}
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
          const rect = widgetRef.current?.getBoundingClientRect();
          const touch = e.touches[0];
          if (!rect || !touch) return;
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
          zIndex: 9999,
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong>G•One</strong>{" "}
                <HelpCircle
                  size={24}
                  color="#0028af"
                  onClick={startFixedTour} // Ativa o tour fixo
                  style={{ cursor: "pointer" }}
                />
                <Play
                  size={24}
                  color={dynamicTourEnabled ? "#28a745" : "#ccc"} // Cor muda com base no estado
                  onClick={() => setDynamicTourEnabled((prev) => !prev)} // Alterna o estado do tour dinâmico
                  style={{ cursor: "pointer" }}
                />
              </div>
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
              {/* Oculta question do initialMessage (index 1 ou 0) se estiver vazia */}
              {history.map((entry) => (
                <div key={`pair-${entry.index ?? entry.answer}`}>
                  {/* Mensagem do usuário */}
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
                  {/* Mensagem do G•One */}
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
                        padding: "10px 14px",
                        borderRadius: "0 12px 12px 12px",
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
                        {entry.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
            }
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            ref={avatarRef}
            className="gabs-avatar"
            role="button"
            aria-label="Abrir G•One"
            title="Arraste-me ou clique em um item do portfólio"
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

export { HelpCircle };
export default GabsIAWidget;
