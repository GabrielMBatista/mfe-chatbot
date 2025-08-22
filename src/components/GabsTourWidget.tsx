import React from "react";
import { CustomTour } from "@/components/CustomTour";
import { useTourController } from "@/hooks/useTourController";
import { TourStep } from "Chatbot/GabsIAWidget";
import { HelpCircle } from "lucide-react";

export interface GabsTourWidgetProps {
  fixedTourSteps?: TourStep[];
  onNavigate?: (route: string) => void;
  initialStep?: number;
}

const GabsTourWidget: React.FC<GabsTourWidgetProps> = ({
  fixedTourSteps,
  onNavigate,
  initialStep = 0,
}) => {
  const {
    tourState,
    currentStep,
    handleTourComplete,
    handleNextStep,
    handlePrevStep,
    startFixedTour,
  } = useTourController({ fixedTourSteps, onNavigate });

  React.useEffect(() => {
    startFixedTour(initialStep);
    // eslint-disable-next-line
  }, [initialStep, startFixedTour]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 0,
        right: 0,
        zIndex: 100,
        width: "100vw",
        maxWidth: "100vw",
        pointerEvents: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 12,
      }}
    >
      <HelpCircle
        size={32}
        color="#0028af"
        style={{ cursor: "pointer", marginRight: 8 }}
        aria-label="Iniciar tour"
        onClick={() => startFixedTour(0)}
      />
      <CustomTour
        steps={tourState.steps}
        isRunning={tourState.run}
        onComplete={handleTourComplete}
        onSkip={handleTourComplete}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
        specificStep={currentStep}
      />
    </div>
  );
};

export default GabsTourWidget;
