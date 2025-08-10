declare module "Chatbot/GabsIAWidget" {
  import type React from "react";

  export type ButtonAction = { label: string; anchorId: string };
  export type BotResponse = { reply: string; actions?: ButtonAction[] };
  export type TourStep = { selector: string; message: string; action: string };

  export type DockPos = Partial<{
    top: number;
    left: number;
    right: number;
    bottom: number;
  }>;

  export type GabsIAWidgetProps = {
    tourEnabled?: boolean;
    fixedPosition?: DockPos;
  };

  export const TYPES_VERSION: string;

  const Component: React.ComponentType<GabsIAWidgetProps>;
  export default Component;

  export function reopenGabsIAWidget(): void;
  export function pinGabsIAWidgetAt(position: DockPos): void;
  export function unpinGabsIAWidget(): void;
}
