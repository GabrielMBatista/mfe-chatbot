import React from "react";
import { CustomTour } from "@/components/CustomTour";
import { useTourController } from "@/hooks/useTourController";
import { DockPos, TourStep } from "Chatbot/GabsIAWidget";
import { HelpCircle } from "lucide-react";
import { useGabsIAWidget } from "@/hooks/useGabsIAWidget";

export interface GabsTourWidgetProps {
  fixedTourSteps?: TourStep[];
  onNavigate?: (route: string) => void;
  initialStep?: number;
  fixedPosition?: DockPos;
  stylePosition?: React.CSSProperties;
}

const GabsTourWidget: React.FC<GabsTourWidgetProps> = ({
  fixedTourSteps,
  onNavigate,
  initialStep = 0,
  fixedPosition,
}) => {
  const stepsToUse =
    fixedTourSteps && fixedTourSteps.length > 0 ? fixedTourSteps : [];

  const {
    tourState,
    currentStep,
    handleTourComplete,
    handleNextStep,
    handlePrevStep,
    startFixedTour,
  } = useTourController({ fixedTourSteps: stepsToUse, onNavigate });

  // Estado para fixedPosition
  const [position, setPosition] = React.useState<DockPos | undefined>(
    fixedPosition
  );

  React.useEffect(() => {
    const updatePosition = () => {
      setPosition({ ...fixedPosition });
    };
    window.addEventListener("orientationchange", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("orientationchange", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [fixedPosition]);

  const widgetStyles: React.CSSProperties = {
    position: "fixed",
    top: position?.top || "auto",
    left: position?.left || "auto",
    zIndex: 90,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    paddingRight: "env(safe-area-inset-right)",
    paddingBottom: "env(safe-area-inset-bottom)",
  };

  const handleStartTour = async () => {
    startFixedTour(initialStep);
  };

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
      <div style={widgetStyles}>
        <HelpCircle
          size={32}
          color="#fff"
          data-gabs="help-btn"
          style={{
            cursor: "pointer",
            marginRight: 8,
            boxSizing: "border-box",
            maxWidth: "48px",
            maxHeight: "48px",
          }}
          aria-label="Iniciar tour"
          onClick={handleStartTour}
        />
      </div>
    </>
  );
};

export default GabsTourWidget;
