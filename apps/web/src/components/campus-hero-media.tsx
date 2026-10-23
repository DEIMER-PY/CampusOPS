"use client";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const scenes = [
  {
    name: "Formación",
    src: "/campus/sala-azul-editada.webp",
    title: "Un lugar para avanzar.",
    alt: "Sala de formación del campus con pared azul y puestos de trabajo",
  },
  {
    name: "Encuentro",
    src: "/campus/zona-reunion-editada.webp",
    title: "El equipo empieza aquí.",
    alt: "Zona de reunión con mesas y sillones",
  },
  {
    name: "Colaboración",
    src: "/campus/sala-colaborativa-editada.webp",
    title: "Más espacio para las ideas.",
    alt: "Sala colaborativa con mesa y bancos verdes",
  },
];
export function CampusHeroMedia() {
  const [selected, setSelected] = useState(0);
  const scene = scenes[selected];
  return (
    <figure className="campus-hero-photo hero-explorer">
      <div className="hero-media-heading">
        <span>Campuslands / Por dentro</span>
        <ArrowDownRight size={22} />
      </div>
      <div
        className="hero-photo-frame"
        onPointerMove={(event) => {
          if (event.pointerType === "touch") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty(
            "--hero-x",
            `${((event.clientX - bounds.left) / bounds.width - 0.5) * 5}deg`,
          );
          event.currentTarget.style.setProperty(
            "--hero-y",
            `${((event.clientY - bounds.top) / bounds.height - 0.5) * -5}deg`,
          );
        }}
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--hero-x", "0deg");
          event.currentTarget.style.setProperty("--hero-y", "0deg");
        }}
      >
        <Image
          className="hero-primary-image"
          src={scene.src}
          alt={scene.alt}
          width={1448}
          height={1086}
          sizes="(max-width:800px) 100vw, 55vw"
          preload
        />
        <a href="#espacios" className="hero-photo-caption" aria-live="polite">
          {scene.title}
          <ArrowUpRight size={22} />
        </a>
      </div>
      <figcaption>
        <fieldset aria-label="Explorar imágenes del campus">
          {scenes.map((item, index) => (
            <button
              type="button"
              key={item.name}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              {item.name}
            </button>
          ))}
        </fieldset>
        <span>Fotos aportadas · edición con IA</span>
      </figcaption>
    </figure>
  );
}
