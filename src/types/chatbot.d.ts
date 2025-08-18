declare module "Chatbot/GabsIAWidget" {
  import type React from "react";

  export type ButtonAction = { label: string; anchorId: string };
  export type BotResponse = { reply: string; actions?: ButtonAction[] };
  export interface TourStep {
    target: string;
    content: React.ReactNode;
    placement?: "top" | "bottom" | "left" | "right" | "center";
  }
  export interface TourState {
    run: boolean;
    steps: TourStep[];
  }

  export type DockPos = Partial<{
    top: number;
    left: number;
    right: number;
    bottom: number;
  }>;

  export type GabsIAWidgetProps = {
    tourEnabled?: boolean;
    fixedPosition?: DockPos;
    initialMessage?: {
      question: string;
      answer: string;
      owner: "gone";
    };
  };

  export interface HistoryPair {
    index: number;
    question: string;
    answer: string;
    userTimestamp: number;
    agentTimestamp: number;
  }
  export interface CustomTourProps {
    steps: TourStep[];
    isRunning: boolean;
    onComplete: () => void;
    onSkip: () => void;
    specificStep?: number; // Index of specific step to show
    isContextualHelp?: boolean; // Whether this is contextual help mode
  }

  export const TYPES_VERSION: string;

  const Component: React.ComponentType<GabsIAWidgetProps>;
  export default Component;

  export function reopenGabsIAWidget(): void;
  export function pinGabsIAWidgetAt(position: DockPos): void;
  export function unpinGabsIAWidget(): void;
}

// Tipagem dos eventos globais usados pelo Shell e pelo Widget.
declare global {
  interface WindowEventMap {
    // Shell pode disparar: new CustomEvent("pinGabs", { detail: { top, left, right, bottom } })
    pinGabs: CustomEvent<import("Chatbot/GabsIAWidget").DockPos>;
    // Shell pode disparar: new Event("unpinGabs")
    unpinGabs: Event;
  }
}
