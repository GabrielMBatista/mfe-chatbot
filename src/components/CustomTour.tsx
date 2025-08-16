import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface TourStep {
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface CustomTourProps {
  steps: TourStep[];
  isRunning: boolean;
  onComplete: () => void;
  onSkip: () => void;
  specificStep?: number; // Index of specific step to show
  isContextualHelp?: boolean; // Whether this is contextual help mode
}

export const CustomTour: React.FC<CustomTourProps> = ({
  steps,
  isRunning,
  onComplete,
  onSkip,
  specificStep,
  isContextualHelp = false,
}) => {
  const [currentStep, setCurrentStep] = useState(specificStep ?? 0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback((targetElement: Element, placement?: string) => {
    const rect = targetElement.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;
    
    setTargetRect(rect);
    
    let x = 0;
    let y = 0;
    
    if (placement === 'center') {
      x = window.innerWidth / 2 - tooltipSize.width / 2;
      y = window.innerHeight / 2 - tooltipSize.height / 2;
    } else {
      // Calculate initial position based on placement
      switch (placement) {
        case 'top':
          x = rect.left + scrollX + rect.width / 2 - tooltipSize.width / 2;
          y = rect.top + scrollY - tooltipSize.height - 15;
          break;
        case 'bottom':
          x = rect.left + scrollX + rect.width / 2 - tooltipSize.width / 2;
          y = rect.bottom + scrollY + 15;
          break;
        case 'left':
          x = rect.left + scrollX - tooltipSize.width - 15;
          y = rect.top + scrollY + rect.height / 2 - tooltipSize.height / 2;
          break;
        case 'right':
          x = rect.right + scrollX + 15;
          y = rect.top + scrollY + rect.height / 2 - tooltipSize.height / 2;
          break;
        default:
          // Default to bottom
          x = rect.left + scrollX + rect.width / 2 - tooltipSize.width / 2;
          y = rect.bottom + scrollY + 15;
      }
      
      // Adjust if tooltip goes outside viewport boundaries
      const margin = 20;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Horizontal adjustments
      if (x < margin) {
        x = margin;
      } else if (x + tooltipSize.width > viewportWidth - margin) {
        x = viewportWidth - tooltipSize.width - margin;
      }
      
      // Vertical adjustments
      if (y < margin + scrollY) {
        // If tooltip goes above viewport, place it below the target
        y = rect.bottom + scrollY + 15;
      } else if (y + tooltipSize.height > viewportHeight + scrollY - margin) {
        // If tooltip goes below viewport, place it above the target
        y = rect.top + scrollY - tooltipSize.height - 15;
        
        // If still doesn't fit above, place it in the center
        if (y < margin + scrollY) {
          y = rect.top + scrollY + rect.height / 2 - tooltipSize.height / 2;
        }
      }
    }
    
    setTooltipPosition({ x, y });
  }, [tooltipSize]);

  // Update tooltip size when it renders
  useEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      setTooltipSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [currentStep, isRunning]);

  // Recalculate position on resize
  useEffect(() => {
    const handleResize = () => {
      if (!isRunning || !steps[currentStep]) return;
      
      const targetSelector = steps[currentStep].target;
      const targetElement = document.querySelector(targetSelector);
      
      if (targetElement) {
        calculatePosition(targetElement, steps[currentStep].placement);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep, isRunning, steps, calculatePosition]);

  useEffect(() => {
    if (!isRunning || !steps[currentStep]) return;

    const targetSelector = steps[currentStep].target;
    const targetElement = document.querySelector(targetSelector);
    
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        calculatePosition(targetElement, steps[currentStep].placement);
      }, 100);
    }
  }, [currentStep, isRunning, steps, calculatePosition]);

  // Reset current step when specificStep changes
  useEffect(() => {
    if (specificStep !== undefined) {
      setCurrentStep(specificStep);
    }
  }, [specificStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isRunning || !steps[currentStep]) return null;

  const currentStepData = steps[currentStep];
  const isCenter = currentStepData.placement === 'center';

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-40"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Spotlight with improved positioning */}
      {!isCenter && targetRect && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            border: '3px solid hsl(var(--primary))',
            borderRadius: '12px',
            boxShadow: `
              0 0 0 4px hsl(var(--primary) / 0.2),
              0 0 0 9999px rgba(0, 0, 0, 0.4)
            `,
            animation: 'pulse 2s infinite',
          }}
        />
      )}

      {/* Tooltip with improved positioning */}
      <Card
        ref={tooltipRef}
        className="fixed z-50 bg-card border shadow-strong max-w-sm"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: isCenter ? 'translate(-50%, -50%)' : undefined,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Close button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {currentStepData.content}
            </div>

            {/* Progress - only show for full tour */}
            {!isContextualHelp && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{currentStep + 1} of {steps.length}</span>
                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {isContextualHelp ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSkip}
                  className="w-full"
                >
                  Got it!
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkip}
                    className="gap-1"
                  >
                    <SkipForward className="h-3 w-3" />
                    Skip
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Back
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleNext}
                      className="gap-1"
                    >
                      {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                      {currentStep !== steps.length - 1 && (
                        <ChevronRight className="h-3 w-3" />
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
