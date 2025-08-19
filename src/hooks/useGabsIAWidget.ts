import { useEffect, useRef, useState } from "react";
import { useGabsIA } from "@/hooks/useGabsIA";
import { DockPos, GabsIAWidgetProps, HistoryPair } from "Chatbot/GabsIAWidget";

export const TYPES_VERSION = "1.0.0";

declare global {
  interface Window {
    reopenGabsIAWidget?: () => void;
  }
}

const localStorageKey = "gabs_disabled";
const positionStorageKey = "gabs_position";
const tourStorageKey = "gabs_tour_skipped";
const base = process.env.NEXT_PUBLIC_CHATBOT_ORIGIN || "http://localhost:3001";

const ASSETS = {
  anchor: `${base}/widget-anchor.lottie`,
  loading: `${base}/Loading.lottie`,
};

export function useGabsIAWidget({
  fixedPosition,
  initialMessage = {
    question: "",
    answer:
      "Olá! Eu sou o G•One, assistente oficial do portfólio de Gabriel Marques. Posso te ajudar a entender cada área do site, explicar decisões técnicas ou apresentar os projetos do Gabriel com clareza e profundidade. Dica: utilize os botões de tour (ícone de interrogação) para navegar por explicações guiadas das principais áreas do portfólio.  Também é possível clicar em áreas marcadas com data-gabs para explicações rápidas. Como posso te ajudar hoje?",
    owner: "gone",
  },
}: GabsIAWidgetProps & {
  fixedPosition?: DockPos;
  initialMessage?: { question: string; answer: string; owner: "gone" };
}) {
  const {
    askGabs,
    loading,
    responses,
  }: {
    askGabs: any;
    loading: boolean;
    responses: Record<string, any>;
  } = useGabsIA();

  const [history, setHistory] = useState<HistoryPair[]>(() => {
    const savedHistory =
      typeof window !== "undefined"
        ? localStorage.getItem("gabs_chat_history")
        : null;
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
    if (initialMessage && initialMessage.answer) {
      return [
        {
          index: 0,
          question: initialMessage.question,
          answer: initialMessage.answer,
          userTimestamp: Date.now(),
          agentTimestamp: Date.now(),
        },
      ];
    }
    return [];
  });
  const [disabled, setDisabled] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dockPos, setDockPos] = useState<DockPos>({});
  const widgetRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<number>(0);
  const dragOffset = useRef({ x: 0, y: 0 });
  const latestPosRef = useRef<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const [position, setPosition] = useState(() => ({
    top: typeof window !== "undefined" ? window.innerHeight / 3 - 32 : 300,
    left: typeof window !== "undefined" ? window.innerWidth / 3 - 32 : 300,
  }));

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const reopenGabsIAWidget = (
    setHistory: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(localStorageKey);
      const savedHistory = localStorage.getItem("gabs_chat_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {}
    window.dispatchEvent(new Event("enableGabs"));
    window.dispatchEvent(new Event("openChat"));
  };

  const pinGabsIAWidgetAt = (position: DockPos) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("pinGabs", { detail: position } as any)
    );
  };

  const unpinGabsIAWidget = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("unpinGabs"));
  };

  const sendQuestion = async () => {
    if (!userMessage.trim()) return;
    const userTimestamp = Date.now();
    const question = userMessage;
    setUserMessage("");
    setHistory((prev) => {
      // Garante que o índice seja sempre o último + 1, ignorando pares inválidos
      const validHistory = prev.filter((h) => h.question && h.answer);
      const nextIndex =
        validHistory.length > 0
          ? validHistory[validHistory.length - 1].index + 1
          : 2;
      return [
        ...prev,
        {
          index: nextIndex,
          question,
          answer: "",
          userTimestamp,
          agentTimestamp: 0,
        },
      ];
    });
    try {
      // Envia o histórico válido junto com a pergunta
      const validHistory = history.filter((h) => h.question && h.answer);
      const data = await askGabs(question, validHistory);
      const agentTimestamp = Date.now();
      setHistory((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.answer === "" && last.question === question) {
          updated[updated.length - 1] = {
            ...last,
            answer: data.reply,
            agentTimestamp,
          };
        }
        localStorage.setItem(
          "gabs_chat_history",
          JSON.stringify(updated.filter((h) => h.question && h.answer))
        );
        return updated;
      });
    } catch {
      setHistory((prev) => {
        const agentTimestamp = Date.now();
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.answer === "" && last.question === question) {
          updated[updated.length - 1] = {
            ...last,
            answer: "Erro ao se comunicar com a IA.",
            agentTimestamp,
          };
        }
        localStorage.setItem(
          "gabs_chat_history",
          JSON.stringify(updated.filter((h) => h.question && h.answer))
        );
        return updated;
      });
    }
  };

  const stylePosition: DockPos = pinned
    ? fixedPosition && Object.keys(fixedPosition || {}).length
      ? fixedPosition
      : dockPos
    : { top: position.top, left: position.left };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const clampPosition = (x: number, y: number) => {
    const sz = isMobile ? 64 : 54;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clampedX = Math.min(Math.max(x, margin), vw - sz - margin);
    const clampedY = Math.min(Math.max(y, margin), vh - sz - margin);
    return { left: clampedX, top: clampedY };
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(positionStorageKey);
      if (raw) {
        const p = JSON.parse(raw) as { left?: number; top?: number };
        if (typeof p.left === "number" && typeof p.top === "number") {
          const clamped = clampPosition(p.left, p.top);
          setPosition({ top: clamped.top, left: clamped.left });
        }
      }
    } catch {}
  }, [isMobile]);

  useEffect(() => {
    const handler = () => {
      if (pinned) return;
      setPosition((prev) => clampPosition(prev.left, prev.top));
    };
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, [pinned, isMobile]);

  useEffect(() => {
    const handleOpenChat = () => {
      if (disabled) return;
      setContextMessage(null);
      setAiReply(null);
      setShowInput(true);
    };
    window.addEventListener("openChat", handleOpenChat as any);
    return () => window.removeEventListener("openChat", handleOpenChat as any);
  }, [disabled]);

  useEffect(() => {
    const handleEnable = () => setDisabled(false);
    window.addEventListener("enableGabs", handleEnable as any);
    return () => window.removeEventListener("enableGabs", handleEnable as any);
  }, []);

  useEffect(() => {
    if (disabled) {
      setPinned(true);
      if (fixedPosition && Object.keys(fixedPosition || {}).length) {
        setDockPos(fixedPosition);
      }
    } else {
      setPinned(false);
    }
  }, [disabled]);

  useEffect(() => {
    const onPin = (e: Event) => {
      const detail = (e as CustomEvent<DockPos>).detail || {};
      if (disabled && detail && Object.keys(detail).length) setDockPos(detail);
    };
    const onUnpin = () => {};
    window.addEventListener("pinGabs", onPin as any);
    window.addEventListener("unpinGabs", onUnpin as any);
    return () => {
      window.removeEventListener("pinGabs", onPin as any);
      window.removeEventListener("unpinGabs", onUnpin as any);
    };
  }, []);

  useEffect(() => {
    window.reopenGabsIAWidget = () => {
      reopenGabsIAWidget(setHistory);
    };
    return () => {
      delete window.reopenGabsIAWidget;
    };
  }, []);

  useEffect(() => {
    const adjustInitialPosition = () => {
      setPosition((prev) => clampPosition(prev.left, prev.top));
    };
    adjustInitialPosition();

    window.addEventListener("resize", adjustInitialPosition);

    return () => {
      window.removeEventListener("resize", adjustInitialPosition);
    };
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem("gabs_chat_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      setHistory([
        {
          index: 1,
          question: "",
          answer: initialMessage.answer,
          userTimestamp: Date.now(),
          agentTimestamp: Date.now(),
        },
      ]);
      try {
        localStorage.setItem(
          "gabs_chat_history",
          JSON.stringify([
            {
              index: 1,
              question: "",
              answer: initialMessage.answer,
              userTimestamp: Date.now(),
              agentTimestamp: Date.now(),
            },
          ])
        );
      } catch (e) {
        console.error("Erro ao salvar histórico inicial no localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    const savedDisabled = localStorage.getItem(localStorageKey) === "true";
    if (savedDisabled) {
      setDisabled(true);
      setPinned(true);
      if (fixedPosition && Object.keys(fixedPosition || {}).length) {
        setDockPos(fixedPosition);
      }
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const onmousemove = (e: MouseEvent): void => {
    const { left, top } = clampPosition(
      e.clientX - dragOffset.current.x,
      e.clientY - dragOffset.current.y
    );
    setPosition({ left, top });
    latestPosRef.current = { left, top };
  };

  const onmouseup = (): void => {
    if (!pinned) {
      try {
        localStorage.setItem(
          positionStorageKey,
          JSON.stringify(latestPosRef.current)
        );
      } catch {}
    }
    setTimeout(() => setIsDragging(false), 100);
    window.removeEventListener("mousemove", onmousemove);
    window.removeEventListener("mouseup", onmouseup);
  };

  const ontouchmove = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    const { left, top } = clampPosition(
      touch.clientX - dragOffset.current.x,
      touch.clientY - dragOffset.current.y
    );
    setPosition({ left, top });
    latestPosRef.current = { left, top };
  };

  const ontouchend = (): void => {
    if (!pinned) {
      try {
        localStorage.setItem(
          positionStorageKey,
          JSON.stringify(latestPosRef.current)
        );
      } catch {}
    }
    setTimeout(() => setIsDragging(false), 100);
    window.removeEventListener("touchmove", ontouchmove);
    window.removeEventListener("touchend", ontouchend);
    window.removeEventListener("touchcancel", ontouchend);
  };

  useEffect(() => {
    const startMouseDrag = (e: MouseEvent) => {
      if (pinned) return;
      const rect = avatarRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      window.addEventListener("mousemove", onmousemove);
      window.addEventListener("mouseup", onmouseup);
    };

    const startTouchDrag = (e: TouchEvent) => {
      if (pinned) return;
      const rect = avatarRef.current?.getBoundingClientRect();
      const touch = e.touches[0];
      if (!rect || !touch) return;
      dragOffset.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      setIsDragging(true);
      window.addEventListener("touchmove", ontouchmove, { passive: false });
      window.addEventListener("touchend", ontouchend);
      window.addEventListener("touchcancel", ontouchend);
    };

    const avatarElement = avatarRef.current;
    avatarElement?.addEventListener("mousedown", startMouseDrag);
    avatarElement?.addEventListener("touchstart", startTouchDrag, {
      passive: false,
    });

    return () => {
      avatarElement?.removeEventListener("mousedown", startMouseDrag);
      avatarElement?.removeEventListener("touchstart", startTouchDrag);
    };
  }, [pinned, isMobile, clampPosition]);

  return {
    history,
    setHistory,
    disabled,
    setDisabled,
    contextMessage,
    setContextMessage,
    userMessage,
    setUserMessage,
    aiReply,
    setAiReply,
    showInput,
    setShowInput,
    isDragging,
    setIsDragging,
    reduceMotion,
    setReduceMotion,
    isMobile,
    setIsMobile,
    pinned,
    setPinned,
    dockPos,
    setDockPos,
    widgetRef,
    avatarRef,
    inputRef,
    lastTapRef,
    dragOffset,
    latestPosRef,
    position,
    setPosition,
    chatContainerRef,
    reopenGabsIAWidget,
    pinGabsIAWidgetAt,
    unpinGabsIAWidget,
    askGabs,
    loading,
    responses,
    sendQuestion,
    stylePosition,
    localStorageKey,
    ASSETS,
    onmousemove,
    onmouseup,
    ontouchmove,
    ontouchend,
  };
}
