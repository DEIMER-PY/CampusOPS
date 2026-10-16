"use client";
import Lenis from "lenis";
import { useEffect } from "react";
import "lenis/dist/lenis.css";

export function LandingMotion() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    const configure = () => {
      lenis?.destroy();
      lenis = media.matches
        ? undefined
        : new Lenis({ autoRaf: true, anchors: true, duration: 1.05 });
    };
    configure();
    media.addEventListener("change", configure);
    const stage = document.querySelector<HTMLElement>(".dashboard-preview");
    const onScroll = () => {
      if (!stage || media.matches) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / 600));
      stage.style.setProperty("--preview-tilt", `${2.2 * (1 - progress)}deg`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      lenis?.destroy();
      media.removeEventListener("change", configure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return null;
}
