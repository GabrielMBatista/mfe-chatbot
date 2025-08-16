import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { GabsIAWidgetProps, useGabsIAWidget } from "@/hooks/useGabsIAWidget";

export const GabsIAWidget = ({
  fixedPosition,
}: GabsIAWidgetProps) => {
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
  } = useGabsIAWidget(fixedPosition);

  return (
    <>
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
              {history.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                      entry.owner === "user" ? "flex-end" : "flex-start",
                    textAlign: entry.owner === "user" ? "right" : "left",
                  }}
                >
                  <div
                    style={{
                      background:
                        entry.owner === "user" ? "#0028af" : "#f1f1f1",
                      color: entry.owner === "user" ? "#fff" : "#000",
                      padding: "10px 14px",
                      borderRadius:
                        entry.owner === "user"
                          ? "12px 0 12px 12px"
                          : "0 12px 12px 12px",
                      maxWidth: "80%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        lineHeight: "1.4",
                      }}
                    >
                      {entry.owner === "user" ? entry.question : entry.answer}
                    </p>
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

export default GabsIAWidget;
