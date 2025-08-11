import { useEffect, useRef, useState } from "react";
import { useGabsIA } from "@/hooks/useGabsIA";
import guidedSteps from "@/tourSteps"; // Importar guidedSteps

export const TYPES_VERSION = "1.0.0";

declare global {
  interface Window {
    reopenGabsIAWidget?: () => void;
  }
}

export type DockPos = Partial<{
  top: number | string;
  left: number | string;
  right: number | string;
  bottom: number | string;
}>;

export type GabsIAWidgetProps = {
  tourEnabled?: boolean;
  fixedPosition?: DockPos;
};

const localStorageKey = "gabs_disabled";
const positionStorageKey = "gabs_position";
const tourStorageKey = "gabs_tour_skipped";
const base = process.env.NEXT_PUBLIC_CHATBOT_ORIGIN || "http://localhost:3001";

const ASSETS = {
  anchor: `${base}/widget-anchor.lottie`,
  loading: `${base}/Loading.lottie`,
};

export function useGabsIAWidget(fixedPosition?: DockPos) {
  const {
    askGabs,
    loading,
    responses,
  }: {
    askGabs: any;
    loading: boolean;
    responses: Record<string, any>;
  } = useGabsIA();

  const [history, setHistory] = useState<
    {
      question: string;
      answer: string;
      owner: "user" | "gone";
      actions?: { label: string; anchorId: string }[];
    }[]
  >([]);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [tourSkipped, setTourSkipped] = useState(false);
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
  const [highlightTarget, setHighlightTarget] = useState<HTMLElement | null>(
    null
  );
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [dataGabsModal, setDataGabsModal] = useState<{
    position: { top: number; left: number; width: number; height: number };
    content: string;
  } | null>(null);

  const enableHighlightMode = () => {
    setHighlightMode(true);
    localStorage.setItem("data-gabs", "true");
    setShowWelcomeModal(false);
  };

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
    handleKeywordDetection(userMessage);
    setHistory((prev) => [
      ...prev,
      { question: userMessage, answer: "", owner: "user" },
    ]);
    try {
      const data = await askGabs(userMessage);
      setHistory((prev) => {
        const updatedHistory = prev.some(
          (entry) =>
            entry.question === userMessage &&
            entry.answer === data.reply &&
            entry.owner === "gone"
        )
          ? prev
          : [
              ...prev,
              {
                question: userMessage,
                answer: data.reply,
                owner: "gone" as "gone",
              },
            ];
        localStorage.setItem(
          "gabs_chat_history",
          JSON.stringify(updatedHistory)
        );
        return updatedHistory;
      });
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          question: userMessage,
          answer: "Erro ao se comunicar com a IA.",
          owner: "gone" as "gone",
        },
      ]);
    } finally {
      setUserMessage("");
    }
  };

  const stylePosition: DockPos = pinned
    ? fixedPosition && Object.keys(fixedPosition || {}).length
      ? fixedPosition
      : dockPos
    : { top: position.top, left: position.left };

  const startTour = () => {
    if (!guidedSteps.length) return;
    setTourActive(true);
    setTourIndex(0);
    runTourStep(0);
  };

  const handleKeywordDetection = (message: string) => {
    const keywords = ["tour", "sugestões", "guia", "ajuda", "contato", "sobre"];
    const lowerMessage = message.toLowerCase();
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      if (
        ["tour", "sugestões", "guia", "ajuda"].some((kw) =>
          lowerMessage.includes(kw)
        )
      ) {
        setShowWelcomeModal(true);
      } else if (lowerMessage.includes("contato")) {
        window.location.href = "/contato";
      } else if (lowerMessage.includes("sobre")) {
        window.location.href = "/sobre";
      }
    }
  };

  const runTourStep = (index: number) => {
    const step = guidedSteps[index];
    if (!step) {
      setTourActive(false);
      setContextMessage(null);
      return;
    }
    const el = step.target
      ? (document.querySelector(step.target) as HTMLElement | null)
      : null;
    if (el) {
      highlightElement(el);
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 80,
        left: rect.left + window.scrollX - 80,
      });
      if (step.action === "click") {
        (el as HTMLElement).click();
      }
    }
    setContextMessage(step.content);
    setAiReply(null);
    setShowInput(false);
    if (step.action === "openChat") {
      window.dispatchEvent(new Event("openChat"));
    }
  };

  const highlightElement = (el: HTMLElement) => {
    setHighlightTarget(el);
    el.style.outline = "2px solid #0028af";
    el.style.transition = "outline 0.3s";
    setTimeout(() => {
      el.style.outline = "";
      setHighlightTarget(null);
    }, 2000);
  };

  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved !== "true") {
      setDisabled(false);
      setShowInput(true);

      const firstAccess = localStorage.getItem("gabs_first_access");
      if (!firstAccess) {
        setShowWelcomeModal(true);
        localStorage.setItem("gabs_first_access", "true");
      }
    } else {
      setDisabled(true);
    }
    const skipped = localStorage.getItem(tourStorageKey);
    if (skipped === "true") setTourSkipped(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-gabs]");
      if (!el) return;
      const id = el.getAttribute("data-gabs");
      if (id) {
        const rect = el.getBoundingClientRect();
        const modalWidth = Math.min(window.innerWidth * 0.9, 400);
        const modalHeight = Math.min(window.innerHeight * 0.8, 300);
        const modalPosition = {
          top: Math.min(rect.bottom + 8, window.innerHeight - modalHeight - 16),
          left: Math.min(rect.left, window.innerWidth - modalWidth - 16),
          width: modalWidth,
          height: modalHeight,
        };
        askGabs(id)
          .then((response: { reply: string }) => {
            setDataGabsModal({
              position: modalPosition,
              content: response.reply,
            });
          })
          .catch(() => {
            setDataGabsModal({
              position: modalPosition,
              content: "Não consegui obter informações sobre este item.",
            });
          });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [askGabs]);

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
      setContextMessage(null);
      setAiReply(null);
      setShowInput(true);
    };
    window.addEventListener("openChat", handleOpenChat as any);
    return () => window.removeEventListener("openChat", handleOpenChat as any);
  }, []);

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
  }, [disabled, fixedPosition]);

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
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (highlightMode) {
      const elements = document.querySelectorAll("[data-gabs]");
      elements.forEach((el) => {
        (el as HTMLElement).style.outline = "2px dashed #0028af";
        (el as HTMLElement).style.transition = "outline 0.3s";
      });
      return () => {
        elements.forEach((el) => {
          (el as HTMLElement).style.outline = "";
        });
      };
    }
  }, [highlightMode]);

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
    tourIndex,
    setTourIndex,
    tourActive,
    setTourActive,
    tourSkipped,
    setTourSkipped,
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
    highlightTarget,
    setHighlightTarget,
    widgetRef,
    avatarRef,
    inputRef,
    lastTapRef,
    dragOffset,
    latestPosRef,
    position,
    setPosition,
    chatContainerRef,
    showWelcomeModal,
    setShowWelcomeModal,
    highlightMode,
    setHighlightMode,
    dataGabsModal,
    setDataGabsModal,
    enableHighlightMode,
    reopenGabsIAWidget,
    pinGabsIAWidgetAt,
    unpinGabsIAWidget,
    askGabs,
    loading,
    responses,
    sendQuestion,
    stylePosition,
    startTour,
    handleKeywordDetection,
    runTourStep,
    localStorageKey,
    ASSETS,
    onmousemove,
    onmouseup,
    ontouchmove,
    ontouchend,
  };
}
