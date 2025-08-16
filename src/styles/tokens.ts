export type Tokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  primaryGlow: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  radius: string;
  gradientHero: string;
  gradientCard: string;
  gradientAccent: string;
  shadowSoft: string;
  shadowMedium: string;
  shadowStrong: string;
  transitionSmooth: string;
  transitionBounce: string;
  sidebarBackground?: string;
  sidebarForeground?: string;
  sidebarPrimary?: string;
  sidebarPrimaryForeground?: string;
  sidebarAccent?: string;
  sidebarAccentForeground?: string;
  sidebarBorder?: string;
  sidebarRing?: string;
};

export const tokensLight: Tokens = {
  background: "0 0% 98%",
  foreground: "225 15% 15%",
  card: "0 0% 100%",
  cardForeground: "225 15% 15%",
  popover: "0 0% 100%",
  popoverForeground: "225 15% 15%",
  primary: "8 86% 65%",
  primaryForeground: "0 0% 100%",
  primaryGlow: "8 86% 75%",
  secondary: "220 14% 96%",
  secondaryForeground: "225 15% 15%",
  muted: "220 14% 95%",
  mutedForeground: "215 16% 47%",
  accent: "12 100% 70%",
  accentForeground: "0 0% 100%",
  success: "142 71% 45%",
  successForeground: "0 0% 100%",
  warning: "38 92% 50%",
  warningForeground: "0 0% 100%",
  destructive: "0 84% 60%",
  destructiveForeground: "0 0% 100%",
  border: "220 13% 91%",
  input: "220 13% 91%",
  ring: "8 86% 65%",
  radius: "0.75rem",
  gradientHero: "linear-gradient(135deg, hsl(8 86% 65%), hsl(12 100% 70%))",
  gradientCard: "linear-gradient(135deg, hsl(0 0% 100%), hsl(220 14% 98%))",
  gradientAccent: "linear-gradient(135deg, hsl(8 86% 65%), hsl(25 95% 68%))",
  shadowSoft: "0 2px 8px -2px hsl(8 86% 65% / 0.1)",
  shadowMedium: "0 8px 25px -5px hsl(8 86% 65% / 0.15)",
  shadowStrong: "0 20px 40px -12px hsl(8 86% 65% / 0.25)",
  transitionSmooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  transitionBounce: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  sidebarBackground: "0 0% 98%",
  sidebarForeground: "240 5.3% 26.1%",
  sidebarPrimary: "240 5.9% 10%",
  sidebarPrimaryForeground: "0 0% 98%",
  sidebarAccent: "240 4.8% 95.9%",
  sidebarAccentForeground: "240 5.9% 10%",
  sidebarBorder: "220 13% 91%",
  sidebarRing: "217.2 91.2% 59.8%",
};

export const tokensDark: Tokens = {
  background: "225 15% 8%",
  foreground: "220 14% 95%",
  card: "225 15% 10%",
  cardForeground: "220 14% 95%",
  popover: "225 15% 10%",
  popoverForeground: "220 14% 95%",
  primary: "8 86% 65%",
  primaryForeground: "0 0% 100%",
  primaryGlow: "8 86% 75%",
  secondary: "215 25% 15%",
  secondaryForeground: "220 14% 95%",
  muted: "215 25% 15%",
  mutedForeground: "217 10% 65%",
  accent: "12 100% 70%",
  accentForeground: "0 0% 100%",
  success: "142 71% 45%",
  successForeground: "0 0% 100%",
  warning: "38 92% 50%",
  warningForeground: "0 0% 100%",
  destructive: "0 84% 60%",
  destructiveForeground: "0 0% 100%",
  border: "215 25% 20%",
  input: "215 25% 20%",
  ring: "8 86% 65%",
  radius: "0.75rem",
  gradientHero: "linear-gradient(135deg, hsl(8 86% 55%), hsl(12 100% 60%))",
  gradientCard: "linear-gradient(135deg, hsl(225 15% 10%), hsl(215 25% 12%))",
  gradientAccent: "linear-gradient(135deg, hsl(8 86% 55%), hsl(25 95% 58%))",
  shadowSoft: "0 2px 8px -2px hsl(0 0% 0% / 0.3)",
  shadowMedium: "0 8px 25px -5px hsl(0 0% 0% / 0.4)",
  shadowStrong: "0 20px 40px -12px hsl(0 0% 0% / 0.6)",
  transitionSmooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  transitionBounce: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  sidebarBackground: "240 5.9% 10%",
  sidebarForeground: "240 4.8% 95.9%",
  sidebarPrimary: "224.3 76.3% 48%",
  sidebarPrimaryForeground: "0 0% 100%",
  sidebarAccent: "240 3.7% 15.9%",
  sidebarAccentForeground: "240 4.8% 95.9%",
  sidebarBorder: "240 3.7% 15.9%",
  sidebarRing: "217.2 91.2% 59.8%",
};

export const hsl = (triplet: string, alpha?: number) =>
  alpha == null ? `hsl(${triplet})` : `hsl(${triplet} / ${alpha})`;

export const injectGlobalStyles = () => {
  const globalStyles = `
    body {
      margin: 0;
      font-family: Arial, sans-serif;
    }
    .widget-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .tour-welcome h1 {
      font-size: 2rem;
      font-weight: bold;
    }
    .tour-stats h2,
    .tour-features h2,
    .tour-actions h2 {
      font-size: 1.5rem;
      font-weight: 600;
    }
    .tour-stats .card,
    .tour-features .card,
    .tour-actions .button {
      border-radius: 12px;
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease-in-out;
    }
    .tour-stats .card:hover,
    .tour-features .card:hover,
    .tour-actions .button:hover {
      box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.2);
      transform: scale(1.05);
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
    .button.hero {
      background: linear-gradient(135deg, hsl(8 86% 65%), hsl(12 100% 70%));
      color: #fff;
      box-shadow: 0 4px 15px -3px hsl(8 86% 65% / 0.3);
    }
    .button.hero:hover {
      box-shadow: 0 6px 20px -3px hsl(8 86% 65% / 0.4);
      transform: scale(1.05);
    }
    .button.accent {
      background: hsl(12 100% 70%);
      color: #fff;
    }
    .button.accent:hover {
      background: hsl(12 100% 60%);
    }
    .button.outline {
      background: transparent;
      border: 1px solid hsl(220 13% 91%);
      color: hsl(225 15% 15%);
    }
    .button.outline:hover {
      background: hsl(220 13% 91%);
    }
    .button.secondary {
      background: hsl(220 14% 96%);
      color: hsl(225 15% 15%);
    }
    .button.secondary:hover {
      background: hsl(220 14% 90%);
    }
  `;
  const styleElement = document.createElement("style");
  styleElement.textContent = globalStyles;
  document.head.appendChild(styleElement);
};
