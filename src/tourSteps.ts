export type TourStep = {
  target?: string;
  content: string;
  action?: "click" | "openChat";
};

export const tourSteps: TourStep[] = [
  // Intro (sem alvo específico)
  { content: "Sou o G•One, seu assistente interativo neste portfólio." },
  {
    content:
      "🖱️ Clique em qualquer elemento interativo para saber mais sobre ele — eu destacarei o item e explicarei como foi feito.",
  },
  {
    content:
      "❓ Clique duas vezes em mim para fazer uma pergunta livre sobre o Gabriel ou seus projetos.",
  },
  { content: "👋 Você pode me mover pela tela e me ocultar quando quiser." },

  // Passos guiados
  {
    target: ".gabs-avatar",
    content: "Clique no assistente para interagir com o portfólio.",
    action: "click",
  },
  {
    content: "Agora você pode conversar com o G•One.",
    action: "openChat",
  },
];

export default tourSteps;
