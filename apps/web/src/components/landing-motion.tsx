"use client";
import Lenis from "lenis";
import { useEffect } from "react";
import "lenis/dist/lenis.css";

export function LandingMotion() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const photograph = document.querySelector<HTMLElement>(
      ".campus-hero-photo img",
    );
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const update = () => {
      frame = 0;
      if (media.matches || !photograph) return;
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / window.innerHeight),
      );
      photograph.style.transform = `scale(${1.035 + progress * 0.035}) translateY(${progress * 18}px)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const configure = () => {
      lenis?.destroy();
      observer?.disconnect();
      elements.forEach((el) => {
        el.classList.remove("reveal-enter");
      });
      photograph?.style.removeProperty("transform");
      if (media.matches) return;
      lenis = new Lenis({
        autoRaf: true,
        anchors: true,
        duration: 0.85,
        virtualScroll: ({ deltaX, deltaY }) => {
          if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) return false;
          if (lenis && Math.abs(window.scrollY - lenis.animatedScroll) > 8)
            lenis.scrollTo(window.scrollY, { immediate: true });
          return true;
        },
      });
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("reveal-enter");
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.08 },
      );
      for (const element of elements) {
        observer.observe(element);
      }
      update();
    };
    configure();
    media.addEventListener("change", configure);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      lenis?.destroy();
      observer?.disconnect();
      cancelAnimationFrame(frame);
      media.removeEventListener("change", configure);
      window.removeEventListener("scroll", onScroll);
      elements.forEach((el) => {
        el.classList.remove("reveal-enter");
      });
      photograph?.style.removeProperty("transform");
    };
  }, []);
  return null;
}
