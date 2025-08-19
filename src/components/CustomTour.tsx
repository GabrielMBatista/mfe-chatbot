import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { Tokens, tokensDark, tokensLight } from "@/styles/tokens";
import { CustomTourProps } from "Chatbot/GabsIAWidget";

const hsl = (v: string, a?: number) =>
  a == null ? `hsl(${v})` : `hsl(${v} / ${a})`;

/** Usa .dark no <html> para alternar entre tokens locais */
function useLocalTokens(): Tokens {
  const getIsDark = () =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const [isDark, setIsDark] = useState<boolean>(getIsDark);

  useEffect(() => {
    const html = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return isDark ? tokensDark : tokensLight;
}

function injectStyles(styles: string, targetDocument: Document = document) {
  const styleElement = targetDocument.createElement("style");
  styleElement.textContent = styles;
  targetDocument.head.appendChild(styleElement);
}

export const CustomTour: React.FC<CustomTourProps> = ({
  steps,
  isRunning,
  onComplete,
  onSkip,
  specificStep,
  isContextualHelp = false,
}) => {
  const t = useLocalTokens();
  // console.log("steps", steps);
  useEffect(() => {
    const styles = `
      .custom-tour-tooltip {
        position: fixed;
        z-index: 99;
        max-width: 24rem;
        max-height: 80vh;
        overflow-y: auto;
        border-radius: 12px;
        transition: all 0.3s ease-in-out;
      }
      .custom-tour-overlay {
        position: fixed;
        z-index: 80;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
      }
    `;
    injectStyles(styles);
  }, []);

  const [currentStep, setCurrentStep] = useState(specificStep ?? 0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(
    (targetElement: Element, placement?: string) => {
      const rect = targetElement.getBoundingClientRect();

      setTargetRect(rect);

      let x = rect.left + rect.width / 2 - tooltipSize.width / 2;
      let y = rect.bottom + 15;

      const margin = 20;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Ajustar para manter o card visível na área da viewport
      if (x < margin) x = margin;
      else if (x + tooltipSize.width > viewportWidth - margin) {
        x = viewportWidth - tooltipSize.width - margin;
      }

      if (y + tooltipSize.height > viewportHeight - margin) {
        y = rect.top - tooltipSize.height - 15;
        if (y < margin) {
          y = rect.top + rect.height / 2 - tooltipSize.height / 2;
        }
      }

      setTooltipPosition({ x, y });
    },
    [tooltipSize]
  );

  const observeTargetVisibility = useCallback(
    (targetElement: Element) => {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry.isIntersecting) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            calculatePosition(targetElement, steps[currentStep]?.placement);
          }
        },
        { root: null, threshold: 0.1 }
      );

      observer.observe(targetElement);

      return () => observer.disconnect();
    },
    [calculatePosition, currentStep, steps]
  );

  // Atualiza o tamanho do tooltip quando renderiza
  useEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      setTooltipSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [currentStep, isRunning]);

  // Recalcula em resize
  useEffect(() => {
    const handleResize = () => {
      if (!isRunning || !steps[currentStep]) return;
      const targetSelector = steps[currentStep].target;
      const targetElement = document.querySelector(targetSelector);
      if (targetElement) {
        calculatePosition(targetElement, steps[currentStep].placement);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentStep, isRunning, steps, calculatePosition]);

  // Adiciona evento de scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!isRunning || !steps[currentStep]) return;
      const targetSelector = steps[currentStep].target;
      const targetElement = document.querySelector(targetSelector);

      if (targetElement) {
        calculatePosition(targetElement, steps[currentStep]?.placement);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentStep, isRunning, steps, calculatePosition]);

  // Posiciona ao mudar o passo
  useEffect(() => {
    if (!isRunning || !steps[currentStep]) return;
    const targetSelector = steps[currentStep].target;
    const targetElement = document.querySelector(targetSelector);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        calculatePosition(targetElement, steps[currentStep].placement);
      }, 100);
    }
  }, [currentStep, isRunning, steps, calculatePosition]);

  // Reseta quando vem specificStep
  useEffect(() => {
    if (specificStep !== undefined) setCurrentStep(specificStep);
  }, [specificStep]);

  // Atualiza ao clicar no mesmo item ou em um novo
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const targetSelector = steps[currentStep]?.target;

      if (target.matches(targetSelector)) {
        calculatePosition(target, steps[currentStep]?.placement);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [steps, currentStep, calculatePosition]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const tooltipElement = tooltipRef.current;
      const targetSelector = steps[currentStep]?.target;
      const targetElement = document.querySelector(targetSelector);

      if (
        tooltipElement &&
        !tooltipElement.contains(e.target as Node) &&
        targetElement &&
        !targetElement.contains(e.target as Node)
      ) {
        onSkip(); // Encerra o tour ao clicar fora
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [steps, currentStep, onSkip]);

  useEffect(() => {
    if (!isRunning || !steps[currentStep]) return;
    const targetSelector = steps[currentStep].target;
    const targetElement = document.querySelector(targetSelector);

    if (targetElement) {
      const cleanupObserver = observeTargetVisibility(targetElement);
      return cleanupObserver;
    }
  }, [currentStep, isRunning, steps, observeTargetVisibility]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onComplete();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => onSkip();

  if (!isRunning || !steps[currentStep]) return null;

  const currentStepData = steps[currentStep];
  const isCenter = currentStepData.placement === "center";

  return (
    <>
      {/* Overlay (caso precise capturar cliques) */}
      <div style={{ pointerEvents: "auto" }} />

      {/* Spotlight */}
      {!isCenter && targetRect && (
        <div
          style={{
            position: "fixed",
            pointerEvents: "none",
            zIndex: 99,
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: `
              0 0 0 4px ${hsl(t.primary, 0.2)},
              0 0 0 9999px rgba(0, 0, 0, 0.5)
            `,
            border: `3px solid ${hsl(t.primary)}`,
            borderRadius: "16px",
            background: "transparent",
            transition:
              "box-shadow 0.3s ease-in-out, border-radius 0.3s ease-in-out",
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        style={{
          position: "fixed",
          zIndex: 99,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: targetRect ? undefined : "translate(-50%, -50%)",
          maxHeight: "80vh",
          overflowY: "auto",
          background: hsl(t.card),
          border: `1px solid ${hsl(t.border)}`,
          boxShadow: `0 10px 30px -5px ${hsl(t.primary, 0.2)}`,
          borderRadius: "12px",
          transition: "all 0.3s ease-in-out",
          maxWidth: "24rem",
        }}
      >
        <CardContent style={{ padding: "1.5rem" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Close */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  transition: "background-color 0.3s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hsl(t.primary, 0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X style={{ height: "16px", width: "16px" }} />
              </Button>
            </div>

            {/* Content */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {currentStepData.content}
            </div>

            {/* Progress */}
            {!isContextualHelp && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: hsl(t.mutedForeground),
                }}
              >
                <span>
                  {currentStep + 1} of {steps.length}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        height: "8px",
                        width: "8px",
                        borderRadius: "9999px",
                        background:
                          index === currentStep ? hsl(t.primary) : hsl(t.muted),
                        transition: "background-color 0.3s ease-in-out",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "8px",
              }}
            >
              {isContextualHelp ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSkip}
                  style={{ width: "100%" }}
                >
                  Got it!
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkip}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <SkipForward style={{ height: "12px", width: "12px" }} />
                    Skip
                  </Button>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <ChevronLeft style={{ height: "12px", width: "12px" }} />
                      Back
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleNext}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {currentStep === steps.length - 1 ? "Finish" : "Next"}
                      {currentStep !== steps.length - 1 && (
                        <ChevronRight
                          style={{ height: "12px", width: "12px" }}
                        />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
