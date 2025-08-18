import { useState, useEffect } from "react";

export type ButtonAction = { label: string; anchorId: string };
export type BotResponse = { reply: string; actions?: ButtonAction[] };
export type HistoryEntry = {
  question: string;
  answer: string;
  owner: "user" | "gone";
};

export function useGabsIA() {
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<Record<string, BotResponse>>({});
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const savedHistory = localStorage.getItem("gabs_chat_history");
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch {
      return [];
    }
  });
  const base =
    process.env.NEXT_PUBLIC_CHATBOT_ORIGIN || "http://localhost:3001";

  useEffect(() => {
    const loadResponses = async () => {
      try {
        const res = await fetch(`${base}/responses.json`);
        const json = await res.json();
        const { tourSteps: _ignore, ...bot } = json || {};
        setResponses(bot);
      } catch (e) {
        console.error("[GabsIA] Falha ao carregar responses.json", e);
      }
    };
    loadResponses();
  }, []);

  const askGabs = async (
    message: string,
    history: HistoryEntry[] = []
  ): Promise<BotResponse> => {
    setLoading(true);

    const anchor = Object.keys(responses).find((key) =>
      message.toLowerCase().includes(key)
    );

    if (anchor) {
      const response = responses[anchor];
      setHistory((prev) => {
        const updatedHistory = prev.some(
          (entry) =>
            entry.question === message &&
            entry.answer === response.reply &&
            entry.owner === "gone"
        )
          ? prev
          : [
              ...prev,
              {
                question: message,
                answer: response.reply,
                owner: "gone" as const,
              },
            ];
        localStorage.setItem(
          "gabs_chat_history",
          JSON.stringify(updatedHistory)
        );
        return updatedHistory;
      });
      setLoading(false);
      return response;
    }

    try {
      const result = await fetch(`${base}/api/gabsia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      const data = await result.json();
      setHistory((prev) => {
        const updatedHistory = prev.some(
          (entry) =>
            entry.question === message &&
            entry.answer === data.reply &&
            entry.owner === "gone"
        )
          ? prev
          : [
              ...prev,
              { question: message, answer: data.reply, owner: "gone" as const },
            ];
        localStorage.setItem(
          "gabs_chat_history",
          JSON.stringify(updatedHistory)
        );
        return updatedHistory;
      });
      setLoading(false);
      return data;
    } catch (e) {
      console.error("[GabsIA] Erro ao chamar API:", e);
      setLoading(false);
      return {
        reply:
          "Houve um erro ao buscar a resposta. Tente novamente mais tarde.",
      };
    }
  };

  return { askGabs, loading, responses, history };
}
