"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

/** Pointer perspective on the supplied 2D artwork; no camera or 3D model. */
export function RobotCompanion({
  variant = "portrait",
}: {
  variant?: "portrait" | "full";
}) {
  const art = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    let frame = 0;
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      art.current?.style.removeProperty("transform");
    };
    const move = (event: PointerEvent) => {
      if (media.matches || !fine.matches || event.pointerType === "touch")
        return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!art.current) return;
        const bounds = art.current.getBoundingClientRect();
        const x = Math.max(
          -1,
          Math.min(
            1,
            (event.clientX - bounds.left - bounds.width / 2) /
              (window.innerWidth / 2),
          ),
        );
        const y = Math.max(
          -1,
          Math.min(
            1,
            (event.clientY - bounds.top - bounds.height / 2) /
              (window.innerHeight / 2),
          ),
        );
        art.current.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 7}deg) translate3d(${x * 10}px,${y * 8}px,0)`;
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", reset);
    document.addEventListener("pointerleave", reset);
    media.addEventListener("change", reset);
    fine.addEventListener("change", reset);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", reset);
      document.removeEventListener("pointerleave", reset);
      media.removeEventListener("change", reset);
      fine.removeEventListener("change", reset);
    };
  }, []);
  return (
    <div className={`robot-companion robot-${variant}`}>
      <div className="robot-artwork" ref={art}>
        <Image
          src={
            variant === "full"
              ? "/brand/campus-robot-full.webp"
              : "/brand/campus-robot-login.webp"
          }
          width={840}
          height={variant === "full" ? 1260 : 840}
          sizes="(max-width: 640px) 140px, 440px"
          alt={
            variant === "full"
              ? "Robot astronauta CampusFlow de cuerpo completo, ilustración con IA"
              : "Robot astronauta con una sonrisa azul, referencia de Campuslands"
          }
        />
      </div>
      <span className="robot-caption">Un campus mejor conectado.</span>
    </div>
  );
}
