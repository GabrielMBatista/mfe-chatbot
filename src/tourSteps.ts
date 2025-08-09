export type TourStep = {
  target?: string;
  content: string;
  action?: "openChat";
};

export const tourSteps: TourStep[] = [
  {
    target: ".gabs-avatar",
    content: "Clique no assistente para interagir com o portfólio.",
  },
  {
    content: "Agora você pode conversar com o G•One.",
    action: "openChat",
  },
];

export default tourSteps;
