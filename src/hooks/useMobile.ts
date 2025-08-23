import * as React from "react";

export function useIsMobile(breakpoint = 768, heightThreshold = 1024) {
  const getInitial = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    const userAgent = navigator.userAgent || "";
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);

    const isMobileWidth = window.matchMedia(
      `(max-width: ${breakpoint - 1}px)`
    ).matches;
    const isMobileHeight = window.innerHeight <= heightThreshold;

    return isMobileDevice || (isMobileWidth && isMobileHeight);
  };

  const [isMobile, setIsMobile] = React.useState<boolean>(getInitial);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined")
      return;

    const mqlWidth = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const onChange = () => {
      const userAgent = navigator.userAgent || "";
      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);

      const isMobileWidth = mqlWidth.matches;
      const isMobileHeight = window.innerHeight <= heightThreshold;

      setIsMobile(isMobileDevice || (isMobileWidth && isMobileHeight));
    };

    mqlWidth.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);

    return () => {
      mqlWidth.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, [breakpoint, heightThreshold]);

  return isMobile;
}
