import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Loader2,
} from "lucide-react";
import { Tokens, tokensDark, tokensLight } from "@/styles/tokens";
import { CustomTourProps } from "Chatbot/GabsIAWidget";

const hsl = (v: string, a?: number) =>
  a == null ? `hsl(${v})` : `hsl(${v} / ${a})`;

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

function isElementVisible(rect: DOMRect | null) {
  if (!rect) return false;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < vh &&
    rect.left < vw &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function scrollTargetAndCardIntoView(targetRect: DOMRect, tooltipH: number) {
  const margin = 16;
  const viewportHeight = window.innerHeight;
  let scrollY = window.scrollY;

  const spaceAbove = targetRect.top - margin;
  const spaceBelow = viewportHeight - targetRect.bottom - margin;

  if (spaceBelow >= tooltipH + margin) {
    const cardBottom = targetRect.bottom + tooltipH + margin;
    if (cardBottom > viewportHeight) {
      scrollY += cardBottom - viewportHeight;
      window.scrollTo({ top: scrollY, behavior: "smooth" });
    } else if (targetRect.bottom < margin) {
      scrollY += targetRect.bottom - margin;
      window.scrollTo({ top: scrollY, behavior: "smooth" });
    }
  } else if (spaceAbove >= tooltipH + margin) {
    const cardTop = targetRect.top - tooltipH - margin;
    if (cardTop < 0) {
      scrollY += cardTop;
      window.scrollTo({ top: scrollY, behavior: "smooth" });
    } else if (targetRect.top > viewportHeight - margin) {
      scrollY += targetRect.top - (viewportHeight - margin);
      window.scrollTo({ top: scrollY, behavior: "smooth" });
    }
  } else {
    const targetCenter = targetRect.top + targetRect.height / 2;
    let desiredTop = targetCenter - tooltipH / 2;
    if (
      desiredTop < targetRect.bottom + margin &&
      desiredTop + tooltipH > targetRect.top - margin
    ) {
      if (targetRect.bottom + tooltipH + margin < viewportHeight) {
        desiredTop = targetRect.bottom + margin;
      } else if (targetRect.top - tooltipH - margin > 0) {
        desiredTop = targetRect.top - tooltipH - margin;
      }
    }
    window.scrollTo({
      top: window.scrollY + desiredTop - margin,
      behavior: "smooth",
    });
  }
}

export const CustomTour: React.FC<
  CustomTourProps & {
    onNextStep?: (currentStep: number) => void;
    onPrevStep?: (currentStep: number) => void;
  }
> = ({
  steps,
  isRunning,
  onComplete,
  onSkip,
  specificStep,
  isContextualHelp = false,
  onNextStep,
  onPrevStep,
}) => {
  const t = useLocalTokens();
  const [currentStep, setCurrentStep] = useState(specificStep ?? 0);

  useEffect(() => {
    if (specificStep !== undefined) {
      setCurrentStep(specificStep);
    }
  }, [specificStep]);

  useEffect(() => {
    if (isRunning && specificStep === undefined) {
      setCurrentStep(0);
    }
  }, [isRunning, specificStep]);

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

  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(
    (targetElement: Element, placement?: string) => {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);

      const margin = 20;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipW = tooltipSize.width;
      const tooltipH = tooltipSize.height;

      let x = rect.left + rect.width / 2 - tooltipW / 2;
      let y;

      if (rect.bottom + tooltipH + margin <= viewportHeight) {
        y = rect.bottom + margin;
      } else if (rect.top - tooltipH - margin >= 0) {
        y = rect.top - tooltipH - margin;
      } else {
        if (rect.top < viewportHeight / 2) {
          y = Math.min(
            rect.bottom + margin,
            viewportHeight - tooltipH - margin
          );
        } else {
          y = Math.max(rect.top - tooltipH - margin, margin);
        }
      }

      if (x < margin) x = margin;
      else if (x + tooltipW > viewportWidth - margin) {
        x = viewportWidth - tooltipW - margin;
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

  useEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      setTooltipSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [currentStep, isRunning]);

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

  useEffect(() => {
    if (!isRunning || !steps[currentStep]) return;
    const targetSelector = steps[currentStep].target;
    const targetElement = document.querySelector(targetSelector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const tooltipH = tooltipSize.height || 200;
      scrollTargetAndCardIntoView(rect, tooltipH);
      setTimeout(() => {
        calculatePosition(targetElement, steps[currentStep].placement);
      }, 100);
    }
  }, [currentStep, isRunning, steps, calculatePosition, tooltipSize.height]);

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
        onSkip();
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
    if (currentStep < steps.length - 1) {
      if (onNextStep) {
        onNextStep(currentStep);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      if (onPrevStep) {
        onPrevStep(currentStep);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSkip = () => onSkip();

  const [loadingStep, setLoadingStep] = useState(false);

  useEffect(() => {
    if (!isRunning || !steps[currentStep]) return;
    if (steps[currentStep].route) {
      setLoadingStep(true);
      const selector = steps[currentStep].target;
      let timeoutId: any;
      const checkTarget = () => {
        if (document.querySelector(selector)) {
          setLoadingStep(false);
          clearTimeout(timeoutId);
        }
      };
      timeoutId = setTimeout(() => setLoadingStep(false), 2500);
      const intervalId = setInterval(checkTarget, 120);
      checkTarget();
      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    } else {
      setLoadingStep(false);
    }
  }, [currentStep, isRunning, steps]);

  const renderOverlay = () => {
    if (!isRunning || !steps[currentStep]) return null;
    return (
      <div
        className="custom-tour-overlay"
        style={{
          pointerEvents: "none",
          background: "rgba(0,0,0,0.5)",
          zIndex: 98,
        }}
      />
    );
  };

  const showHighlight = targetRect && isElementVisible(targetRect);

  if (!isRunning || !steps[currentStep]) return null;

  const currentStepData = steps[currentStep];
  const isCenter = currentStepData.placement === "center";
  const total = Math.max(steps.length, 1);
  const clampedStep = Math.min(Math.max(currentStep, 0), total - 1);
  const percent = ((clampedStep + 1) / total) * 100;

  return (
    <>
      {renderOverlay()}

      {!isCenter && showHighlight && (
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

      <Card
        ref={tooltipRef}
        style={{
          position: "fixed",
          zIndex: 99,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: targetRect ? undefined : "translate(-50%, -50%)",
          maxWidth: "24rem",
          width: "auto",
          maxHeight: "80vh",
          overflow: "hidden",
          background: `linear-gradient(145deg, ${hsl(t.card)}, ${hsl(t.muted)})`,
          border: `1px solid ${hsl(t.border)}`,
          boxShadow: `0 12px 36px -8px ${hsl(t.primary, 0.25)}, 0 2px 12px -6px rgba(0,0,0,.25)`,
          borderRadius: "12px",
          transition:
            "transform .2s ease, box-shadow .2s ease, opacity .2s ease",
          opacity: 1,
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "auto 0 100% 0",
            margin: "0 auto",
            width: 12,
            height: 12,
            borderLeft: `1px solid ${hsl(t.border)}`,
            borderTop: `1px solid ${hsl(t.border)}`,
            background: hsl(t.card),
            transform: "rotate(45deg)",
            boxShadow: "0 -6px 18px -8px rgba(0,0,0,.25)",
          }}
        />

        <CardContent style={{ padding: "1.5rem", overflowY: "auto" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                aria-label="Fechar"
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "9999px",
                  color: hsl(t.mutedForeground),
                  transition:
                    "background-color .18s ease, transform .12s ease, box-shadow .18s ease, color .18s ease",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hsl(t.primary, 0.12);
                  e.currentTarget.style.color = hsl(t.accentForeground);
                  e.currentTarget.style.transform = "scale(1.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = hsl(t.mutedForeground);
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${hsl(t.accent, 0.35)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <X style={{ height: "16px", width: "16px" }} />
              </Button>
            </div>

            {loadingStep && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 60,
                }}
              >
                <Loader2
                  size={32}
                  className="animate-spin"
                  color={hsl(t.primary)}
                />
              </div>
            )}

            {!loadingStep && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  color: hsl(t.foreground),
                  lineHeight: 1.6,
                }}
              >
                {currentStepData.content}
              </div>
            )}

            {total === 1 && (
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percent)}
                aria-label="Progresso"
                style={{
                  position: "relative",
                  height: 8,
                  borderRadius: 9999,
                  background: `linear-gradient(0deg, ${hsl(t.muted)} 0%, ${hsl(
                    t.muted
                  )} 100%)`,
                  overflow: "hidden",
                  margin: "12px 0 0 0",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "repeating-linear-gradient(45deg, rgba(0,0,0,.05) 0 6px, rgba(0,0,0,.02) 6px 12px)",
                    opacity: 0.4,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    height: "100%",
                    width: `${percent}%`,
                    background: `linear-gradient(90deg, ${hsl(
                      t.primary
                    )}, ${hsl(t.accent)})`,
                    boxShadow: `inset 0 0 12px rgba(255,255,255,.25)`,
                    transition: "width .45s cubic-bezier(.22,.8,.36,1)",
                    willChange: "width",
                  }}
                />
              </div>
            )}

            {!isContextualHelp && total > 1 && (
              <div
                role="group"
                aria-label="Progresso do passo a passo"
                style={{
                  display: "grid",
                  gap: 8,
                  fontSize: 14,
                  color: hsl(t.mutedForeground),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    aria-live="polite"
                    style={{
                      fontWeight: 500,
                      color: hsl(t.foreground),
                      letterSpacing: 0.2,
                    }}
                  >
                    {clampedStep + 1} de {total}
                  </span>

                  <div style={{ display: "flex", gap: 6 }}>
                    {Array.from({ length: total }).map((_, index) => {
                      const isActive = index === clampedStep;
                      return (
                        <div
                          key={index}
                          aria-current={isActive ? "step" : undefined}
                          title={`Etapa ${index + 1}`}
                          style={{
                            position: "relative",
                            height: 10,
                            width: isActive ? 18 : 10,
                            borderRadius: 9999,
                            background: isActive
                              ? `linear-gradient(90deg, ${hsl(
                                  t.primary
                                )}, ${hsl(t.primaryForeground)})`
                              : hsl(t.muted),
                            boxShadow: isActive
                              ? `0 0 0 4px ${hsl(t.muted)}`
                              : "none",
                            transition:
                              "width .28s ease, background-color .28s ease, box-shadow .28s ease, transform .18s ease",
                            transform: isActive ? "translateY(-1px)" : "none",
                            cursor: "default",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                  aria-label="Progresso"
                  style={{
                    position: "relative",
                    height: 6,
                    borderRadius: 9999,
                    background: `linear-gradient(0deg, ${hsl(t.muted)} 0%, ${hsl(
                      t.muted
                    )} 100%)`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "repeating-linear-gradient(45deg, rgba(0,0,0,.05) 0 6px, rgba(0,0,0,.02) 6px 12px)",
                      opacity: 0.4,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      height: "100%",
                      width: `${percent}%`,
                      background: `linear-gradient(90deg, ${hsl(
                        t.primary
                      )}, ${hsl(t.accent)})`,
                      boxShadow: `inset 0 0 12px rgba(255,255,255,.25)`,
                      transition: "width .45s cubic-bezier(.22,.8,.36,1)",
                      willChange: "width",
                    }}
                  />
                </div>

                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  Etapa {clampedStep + 1} em andamento
                </span>
              </div>
            )}

            <div
              aria-hidden
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${hsl(
                  t.border
                )}, transparent)`,
                marginTop: 4,
              }}
            />

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
              ) : total === 1 ? (
                <div style={{ width: "100%" }} />
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
                      disabled={clampedStep === 0}
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
                      {clampedStep === total - 1 ? "Finish" : "Next"}
                      {clampedStep !== total - 1 && (
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
