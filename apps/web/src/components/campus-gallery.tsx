"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { RobotCompanion } from "./robot-companion";

const rooms = [
  {
    src: "/campus/sala-azul-editada.webp",
    title: "Espacio para concentrarse.",
    description:
      "Puestos de trabajo y una pantalla para acompañar la formación.",
    alt: "Sala de formación con pared azul, puestos de trabajo y pantalla",
  },
  {
    src: "/campus/zona-reunion-editada.webp",
    title: "Lugar para encontrarse.",
    description: "Mesas y zonas de conversación para trabajar en equipo.",
    alt: "Zona de reunión del campus con mesas, sillones y suelo de madera",
  },
  {
    src: "/campus/sala-colaborativa-editada.webp",
    title: "Ideas sobre la mesa.",
    description: "Una mesa compartida y una pantalla para construir juntos.",
    alt: "Sala de colaboración con bancos verdes, mesa y pantalla",
  },
];
export function CampusGallery() {
  const [index, setIndex] = useState(1);
  const touchStart = useRef<number | null>(null);
  const select = (next: number) =>
    setIndex((next + rooms.length) % rooms.length);
  return (
    <section
      className="campus-gallery campus-carousel"
      aria-label="Fotografías del campus"
      aria-roledescription="carrusel"
    >
      <div className="campus-carousel-stage">
        <div
          className="campus-photo-deck"
          onTouchStart={(event) => {
            touchStart.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (touchStart.current !== null) {
              const distance =
                event.changedTouches[0].clientX - touchStart.current;
              if (Math.abs(distance) > 50)
                select(index + (distance < 0 ? 1 : -1));
            }
            touchStart.current = null;
          }}
        >
          {rooms.map((room, position) => (
            <button
              type="button"
              key={room.src}
              className="campus-photo-card"
              data-active={index === position}
              aria-pressed={index === position}
              aria-label={`Mostrar fotografía: ${room.title}`}
              onClick={() => select(position)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  select(index + (event.key === "ArrowRight" ? 1 : -1));
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  select(0);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  select(rooms.length - 1);
                }
              }}
            >
              <Image
                src={room.src}
                alt={room.alt}
                width={1086}
                height={1448}
                sizes="(max-width: 700px) 90vw, (max-width: 1100px) 35vw, 30vw"
              />
              <span className="campus-photo-label">
                {["Formación", "Encuentro", "Colaboración"][position]}
              </span>
            </button>
          ))}
        </div>
        <div className="campus-gallery-host">
          <span className="gallery-host-note">
            Nos vemos
            <br />
            en el campus.
          </span>
          <RobotCompanion variant="full" />
        </div>
      </div>
      <div className="gallery-copy" aria-live="polite" aria-atomic="true">
        <h3>{rooms[index].title}</h3>
        <p>{rooms[index].description}</p>
        <span className="gallery-provenance">
          Fotografías del campus · edición con IA
        </span>
      </div>
      <div className="gallery-controls">
        <button
          type="button"
          className="icon-button"
          aria-label="Ver espacio anterior"
          onClick={() => select(index - 1)}
        >
          <ArrowLeft size={20} />
        </button>
        <span>
          {index + 1} / {rooms.length}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Ver siguiente espacio"
          onClick={() => select(index + 1)}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}
