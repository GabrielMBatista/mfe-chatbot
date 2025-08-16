import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";

interface TourStep {
  target: string;
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

interface CustomTourProps {
  steps: TourStep[];
  isRunning: boolean;
  onComplete: () => void;
  onSkip: () => void;
  specificStep?: number; // Index of specific step to show
  isContextualHelp?: boolean; // Whether this is contextual help mode
}

type Tokens = {
  primary: string; // hsl triplet
  card: string; // hsl triplet
  border: string; // hsl triplet
  shadowStrong: string; // full box-shadow
  muted: string; // hsl triplet
  mutedForeground: string; // hsl triplet
};

const tokensLight: Tokens = {
  primary: "8 86% 65%",
  card: "0 0% 100%",
  border: "220 13% 91%",
  shadowStrong: "0 20px 40px -12px hsl(8 86% 65% / 0.25)",
  muted: "220 14% 95%",
  mutedForeground: "215 16% 47%",
};

const tokensDark: Tokens = {
  primary: "8 86% 65%",
  card: "225 15% 10%",
  border: "215 25% 20%",
  shadowStrong: "0 20px 40px -12px hsl(0 0% 0% / 0.6)",
  muted: "215 25% 15%",
  mutedForeground: "217 10% 65%",
};

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

  useEffect(() => {
    const styles = `
      .custom-tour-tooltip {
        position: fixed;
        z-index: 50;
        max-width: 24rem;
        max-height: 80vh;
        overflow-y: auto;
        border-radius: 12px;
        transition: all 0.3s ease-in-out;
      }
      .custom-tour-overlay {
        position: fixed;
        z-index: 40;
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
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;

      setTargetRect(rect);

      let x = 0;
      let y = 0;

      if (placement === "center") {
        x = window.innerWidth / 2 - tooltipSize.width / 2;
        y = window.innerHeight / 2 - tooltipSize.height / 2;
      } else {
        switch (placement) {
          case "top":
            x = rect.left + scrollX + rect.width / 2 - tooltipSize.width / 2;
            y = rect.top + scrollY - tooltipSize.height - 15;
            break;
          case "bottom":
            x = rect.left + scrollX + rect.width / 2 - tooltipSize.width / 2;
            y = rect.bottom + scrollY + 15;
            break;
          case "left":
            x = rect.left + scrollX - tooltipSize.width - 15;
            y = rect.top + scrollY + rect.height / 2 - tooltipSize.height / 2;
            break;
          case "right":
            x = rect.right + scrollX + 15;
            y = rect.top + scrollY + rect.height / 2 - tooltipSize.height / 2;
            break;
          default:
            x = rect.left + scrollX + rect.width / 2 - tooltipSize.width / 2;
            y = rect.bottom + scrollY + 15;
        }

        const margin = 20;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (x < margin) x = margin;
        else if (x + tooltipSize.width > viewportWidth - margin) {
          x = viewportWidth - tooltipSize.width - margin;
        }

        if (y < margin + scrollY) {
          y = rect.bottom + scrollY + 15;
        } else if (y + tooltipSize.height > viewportHeight + scrollY - margin) {
          y = rect.top + scrollY - tooltipSize.height - 15;
          if (y < margin + scrollY) {
            y = rect.top + scrollY + rect.height / 2 - tooltipSize.height / 2;
          }
        }
      }

      setTooltipPosition({ x, y });
    },
    [tooltipSize]
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
            zIndex: 50,
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
          zIndex: 50,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: isCenter ? "translate(-50%, -50%)" : undefined,
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
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
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
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
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
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <ChevronLeft style={{ height: "12px", width: "12px" }} />
                      Back
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleNext}
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      {currentStep === steps.length - 1 ? "Finish" : "Next"}
                      {currentStep !== steps.length - 1 && (
                        <ChevronRight style={{ height: "12px", width: "12px" }} />
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
