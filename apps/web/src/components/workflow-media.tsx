"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const chapters = [
  {
    id: "flujo-encontrar",
    label: "Encuentra",
    src: "/campus/sala-azul-editada.webp",
    alt: "Puestos de trabajo en la sala de formación azul",
  },
  {
    id: "flujo-coordinar",
    label: "Coordina",
    src: "/campus/zona-reunion-editada.webp",
    alt: "Mesas y sillones del espacio de reunión",
  },
  {
    id: "flujo-reportar",
    label: "Reporta",
    src: "/campus/sala-colaborativa-editada.webp",
    alt: "Mesa y pantalla de la sala colaborativa",
  },
  {
    id: "flujo-revisar",
    label: "Revisa",
    src: "/campus/zona-reunion-editada.webp",
    alt: "Zona de reunión para trabajar en equipo",
  },
];
export function WorkflowMedia() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            const index = chapters.findIndex(
              (chapter) => chapter.id === entry.target.id,
            );
            if (index >= 0) setActive(index);
          }
      },
      { rootMargin: "-12% 0px -48% 0px", threshold: 0 },
    );
    for (const chapter of chapters) {
      const element = document.getElementById(chapter.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);
  return (
    <div className="workflow-media">
      <div className="workflow-frames">
        {chapters.map((chapter, index) => (
          <Image
            key={chapter.id}
            className={active === index ? "is-current" : ""}
            aria-hidden={active !== index}
            src={chapter.src}
            alt={chapter.alt}
            width={1600}
            height={1200}
            sizes="(max-width:800px) 100vw,40vw"
          />
        ))}
      </div>
      <nav className="workflow-stops" aria-label="Recorrido de una solicitud">
        {chapters.map((chapter, index) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            aria-current={active === index ? "step" : undefined}
          >
            {chapter.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
