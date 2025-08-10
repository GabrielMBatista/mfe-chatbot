// ───────────────────────────────────────────────
// 🔗 Shell
// ───────────────────────────────────────────────
declare module "shell/Error";
declare module "shell/Providers";
declare module "shell/I18nProvider";
declare module "chat-store" {
  type Message = { role: "user" | "assistant"; text: string };
  export function useChatStore(): {
    conversationId: string;
    messages: Message[];
    start: () => void;
    append: (m: Message) => void;
    hydrate: (id: string) => void;
  };
}

// ───────────────────────────────────────────────
// 🔗 Remotes: Dashboard
// ───────────────────────────────────────────────
declare module "Dashboard/Dashboard";
declare module "Dashboard/App";
