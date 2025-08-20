import { useState, useEffect, useCallback } from "react";
import { TourStep } from "Chatbot/GabsIAWidget";

export function useTourController({
  fixedTourSteps,
  onNavigate,
}: {
  fixedTourSteps?: TourStep[];
  onNavigate?: (route: string) => void;
}) {
  const [tourState, setTourState] = useState<{
    run: boolean;
    steps: TourStep[];
  }>({
    run: false,
    steps: [],
  });
  const [currentStep, setCurrentStep] = useState(0);

  const defaultFixedSteps: TourStep[] = [];

  const POLLING_TIMEOUT_MS = 2000;
  const POLLING_INTERVAL_MS = 120;

  const TOUR_STEP_STORAGE_KEY = "gabs-guided-tour-step";

  useEffect(() => {
    if (tourState.run && tourState.steps.length > 0) {
      try {
        localStorage.setItem(TOUR_STEP_STORAGE_KEY, String(currentStep));
      } catch {}
    } else {
      try {
        localStorage.removeItem(TOUR_STEP_STORAGE_KEY);
      } catch {}
    }
  }, [currentStep, tourState.run, tourState.steps.length]);

  const goToStepWithRoute = useCallback(
    async (stepIndex: number, stepsArr: TourStep[]) => {
      const step = stepsArr[stepIndex];
      if (step && step.route && typeof onNavigate === "function") {
        onNavigate(step.route);
        const targetSelector = stepsArr[stepIndex]?.target;
        let el: Element | null = null;
        const startTime = Date.now();
        let found = false;
        while (Date.now() - startTime < POLLING_TIMEOUT_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, POLLING_INTERVAL_MS)
          );
          el = targetSelector ? document.querySelector(targetSelector) : null;
          if (el) {
            found = true;
            break;
          }
        }
        if (!found) {
          let nextValidStep = stepIndex + 1;
          while (
            nextValidStep < stepsArr.length &&
            !stepsArr[nextValidStep]?.target
          ) {
            nextValidStep++;
          }
          if (
            nextValidStep < stepsArr.length &&
            stepsArr[nextValidStep]?.target
          ) {
            setCurrentStep(nextValidStep);
            setTourState((prev) => ({
              ...prev,
              steps: stepsArr,
              run: true,
            }));
            return;
          } else {
            setTourState((prev) => ({
              ...prev,
              run: false,
              steps: stepsArr,
            }));
            return;
          }
        }
      }
      setTourState((prev) => ({
        ...prev,
        steps: stepsArr,
        run: true,
      }));
    },
    [onNavigate]
  );

  const startDynamicTour = useCallback((gabsValue: string) => {
    const dynamicSteps: TourStep[] = [
      {
        target: `[data-gabs="${gabsValue}"]`,
        content: `Detalhes do item: ${gabsValue}`,
      },
    ];
    setTourState((prev) => ({
      ...prev,
      run: true,
      steps: dynamicSteps,
    }));
  }, []);

  const handleTourComplete = useCallback(
    () => setTourState((prev) => ({ ...prev, run: false })),
    []
  );

  const handleNextStep = useCallback(
    async (stepIndex: number) => {
      const stepsArr =
        tourState.steps && tourState.steps.length > 0
          ? tourState.steps
          : fixedTourSteps && fixedTourSteps.length > 0
            ? fixedTourSteps
            : defaultFixedSteps;

      const nextStep = stepIndex + 1;
      const nextRoute = stepsArr[nextStep]?.route;
      const currentRoute =
        typeof window !== "undefined" ? window.location.pathname : "";

      if (
        nextRoute &&
        nextRoute !== currentRoute &&
        typeof onNavigate === "function"
      ) {
        onNavigate(nextRoute);
        const targetSelector = stepsArr[nextStep]?.target;
        let el: Element | null = null;
        const startTime = Date.now();
        let found = false;
        while (Date.now() - startTime < POLLING_TIMEOUT_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, POLLING_INTERVAL_MS)
          );
          el = targetSelector ? document.querySelector(targetSelector) : null;
          if (el) {
            found = true;
            break;
          }
        }
        setCurrentStep(nextStep);
      } else {
        setCurrentStep(nextStep);
      }
      setTourState((prev) => ({
        ...prev,
        run: true,
        steps: stepsArr,
      }));
    },
    [tourState.steps, fixedTourSteps, onNavigate]
  );

  const handlePrevStep = useCallback(
    async (stepIndex: number) => {
      const stepsArr =
        tourState.steps && tourState.steps.length > 0
          ? tourState.steps
          : fixedTourSteps && fixedTourSteps.length > 0
            ? fixedTourSteps
            : defaultFixedSteps;

      const prevStep = stepIndex - 1;
      if (prevStep < 0) return;
      const prevRoute = stepsArr[prevStep]?.route;
      const currentRoute =
        typeof window !== "undefined" ? window.location.pathname : "";

      if (
        prevRoute &&
        prevRoute !== currentRoute &&
        typeof onNavigate === "function"
      ) {
        onNavigate(prevRoute);
        const targetSelector = stepsArr[prevStep]?.target;
        let el: Element | null = null;
        const startTime = Date.now();
        let found = false;
        while (Date.now() - startTime < POLLING_TIMEOUT_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, POLLING_INTERVAL_MS)
          );
          el = targetSelector ? document.querySelector(targetSelector) : null;
          if (el) {
            found = true;
            break;
          }
        }
        setCurrentStep(prevStep);
      } else {
        setCurrentStep(prevStep);
      }
      setTourState((prev) => ({
        ...prev,
        run: true,
        steps: stepsArr,
      }));
    },
    [tourState.steps, fixedTourSteps, onNavigate]
  );

  const startFixedTour = useCallback(async () => {
    const stepsArr =
      fixedTourSteps && fixedTourSteps.length > 0
        ? fixedTourSteps
        : defaultFixedSteps;
    let initialStep = 0;
    try {
      const savedStep = localStorage.getItem(TOUR_STEP_STORAGE_KEY);
      if (savedStep) {
        const idx = parseInt(savedStep, 10);
        if (!isNaN(idx) && idx >= 0 && idx < stepsArr.length) {
          initialStep = idx;
        }
      }
    } catch {}
    setCurrentStep(initialStep);
    if (stepsArr[initialStep]?.route) {
      await goToStepWithRoute(initialStep, stepsArr);
    } else {
      setTourState((prev) => ({
        ...prev,
        run: true,
        steps: stepsArr,
      }));
    }
  }, [fixedTourSteps, goToStepWithRoute]);

  const getDynamicTourFromStorage = () => {
    try {
      return localStorage.getItem("gabs-dynamic-tour") === "true";
    } catch {
      return false;
    }
  };
  const [dynamicTourEnabled, setDynamicTourEnabledState] = useState(
    getDynamicTourFromStorage()
  );

  const setDynamicTourEnabled = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setDynamicTourEnabledState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          if (next) {
            localStorage.setItem("gabs-dynamic-tour", "true");
          } else {
            localStorage.removeItem("gabs-dynamic-tour");
          }
        } catch {}
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const syncDynamicTour = () => {
      setDynamicTourEnabledState(getDynamicTourFromStorage());
    };
    window.addEventListener("popstate", syncDynamicTour);
    window.addEventListener("pushstate", syncDynamicTour);
    window.addEventListener("replaceState", syncDynamicTour);
    return () => {
      window.removeEventListener("popstate", syncDynamicTour);
      window.removeEventListener("pushstate", syncDynamicTour);
      window.removeEventListener("replaceState", syncDynamicTour);
    };
  }, []);

  useEffect(() => {
    let lastGabsClicked: string | null = null;
    let lastClickTime = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (!dynamicTourEnabled) return;
      const target = (e.target as HTMLElement)?.closest("[data-gabs]");
      if (!target) return;
      if (target.hasAttribute("disabled")) return;
      const gabsValue = target.getAttribute("data-gabs");
      if (!gabsValue) return;
      const htmlTarget = target as HTMLElement;
      const tag = htmlTarget.tagName;
      const typeAttr = htmlTarget.getAttribute("type")?.toLowerCase();
      const isSubmit =
        tag === "BUTTON" &&
        (typeAttr === "submit" ||
          // @ts-ignore
          (htmlTarget as any).type === "submit");
      const isLink =
        tag === "A" &&
        htmlTarget.hasAttribute("href") &&
        !htmlTarget.hasAttribute("target");
      const isInputSubmit =
        tag === "INPUT" &&
        (typeAttr === "submit" ||
          // @ts-ignore
          (htmlTarget as any).type === "submit");
      const shouldBlock = isSubmit || isLink || isInputSubmit;
      const now = Date.now();
      if (
        shouldBlock &&
        (lastGabsClicked !== gabsValue || now - lastClickTime > 2000)
      ) {
        startDynamicTour(gabsValue);
        lastGabsClicked = gabsValue;
        lastClickTime = now;
        e.preventDefault();
        e.stopPropagation();
        if (isLink) {
          const originalHref = htmlTarget.getAttribute("href");
          htmlTarget.setAttribute(
            "data-gabs-original-href",
            originalHref || ""
          );
          htmlTarget.removeAttribute("href");
          setTimeout(() => {
            if (htmlTarget.getAttribute("data-gabs-original-href")) {
              htmlTarget.setAttribute(
                "href",
                htmlTarget.getAttribute("data-gabs-original-href") || ""
              );
              htmlTarget.removeAttribute("data-gabs-original-href");
            }
          }, 2000);
        }
        return;
      }
      if (!shouldBlock) {
        if (lastGabsClicked !== gabsValue || now - lastClickTime > 2000) {
          startDynamicTour(gabsValue);
          lastGabsClicked = gabsValue;
          lastClickTime = now;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        lastGabsClicked = null;
        lastClickTime = 0;
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [dynamicTourEnabled, startDynamicTour]);

  useEffect(() => {
    const selector = "[data-gabs]";
    const styleId = "gabs-dynamic-tour-style";
    let styleEl: HTMLStyleElement | null = null;
    if (dynamicTourEnabled) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        ${selector} {
          outline: 2px dashed #28a745 !important;
          outline-offset: 2px !important;
          transition: outline 0.2s;
        }
        ${selector}:hover {
          background: rgba(40,167,69,0.08);
        }
      `;
      document.head.appendChild(styleEl);
    } else {
      styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (styleEl) styleEl.remove();
    }
    return () => {
      styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (styleEl) styleEl.remove();
    };
  }, [dynamicTourEnabled]);

  return {
    tourState,
    setTourState,
    dynamicTourEnabled,
    setDynamicTourEnabled,
    currentStep,
    setCurrentStep,
    goToStepWithRoute,
    startDynamicTour,
    handleTourComplete,
    handleNextStep,
    handlePrevStep,
    startFixedTour,
  };
}
