import { useState, useEffect } from "react";

export type ButtonAction = { label: string; anchorId: string };
export type BotResponse = { reply: string; actions?: ButtonAction[] };

export function useGabsIA() {
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<Record<string, BotResponse>>({});
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
    conversationId?: string
  ): Promise<BotResponse> => {
    setLoading(true);

    const anchor = Object.keys(responses).find((key) =>
      message.toLowerCase().includes(key)
    );

    if (anchor) {
      setLoading(false);
      return responses[anchor];
    }

    try {
      const result = await fetch(`${base}/api/gabsia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message }),
      });

      const data = await result.json();
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

  return { askGabs, loading, responses };
}
