import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  CalendarDays,
  CircleDot,
  Command,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const modules = [
  {
    number: "01",
    icon: CalendarDays,
    title: "El espacio para tu próxima idea.",
    description:
      "Consulta capacidades y solicita una reserva. Cada horario se valida antes de confirmarse.",
    label: "Espacios y aulas",
  },
  {
    number: "02",
    icon: Boxes,
    title: "Los recursos, donde se necesitan.",
    description:
      "Un inventario conectado con los préstamos y devoluciones. Disponibilidad respaldada por datos.",
    label: "Recursos tecnológicos",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Cada incidencia tiene un camino.",
    description:
      "Reporta lo que ocurre. La IA ayuda a priorizar y dirigir la atención al área correspondiente.",
    label: "Triaje inteligente",
  },
];

export default function Home() {
  return (
    <>
      <header className="site-header wrap">
        <Link href="/" className="brand" aria-label="CampusFlow, inicio">
          <Command size={27} strokeWidth={2.5} />
          campus<span>flow</span>
          <span className="brand-dot" />
        </Link>
        <nav aria-label="Principal" className="desktop-nav">
          <a href="#solucion">La solución</a>
          <a href="#flujo">Cómo funciona</a>
          <a href="#equipo">El equipo</a>
        </nav>
        <Link className="button button-small button-outline" href="/login">
          Ingresar <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="contenido">
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-dot" /> PENSADO PARA CAMPUSLANDS
            </p>
            <h1>
              Menos cruces.
              <br />
              Más espacio
              <br />
              para <span className="serif">crear.</span>
              <span className="title-dot" />
            </h1>
            <p className="hero-description">
              Un campus que fluye empieza con decisiones claras. Conecta tus
              espacios, recursos e incidencias en un solo lugar.
            </p>
            <div className="hero-actions">
              <Link href="/portal" className="button button-dark">
                Explorar el portal <ArrowUpRight size={19} />
              </Link>
              <a href="#solucion" className="text-link">
                Conocer la solución <ArrowDown size={16} />
              </a>
            </div>
            <div className="hero-note">
              <ShieldCheck size={17} />
              <span>
                Datos oficiales. Validaciones reales. IA con propósito.
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Ilustración conceptual de espacios conectados; no representa disponibilidad en vivo"
            role="img"
          >
            <div className="art-grid" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="art-heading">
              <CircleDot size={15} /> EL CAMPUS, CONECTADO <span>↗</span>
            </div>
            <div className="floating-label label-one">
              <span className="tiny-square" /> Espacios para conectar
            </div>
            <div className="isometric-campus">
              <div className="building b-one">
                <Layers3 size={38} strokeWidth={1} />
              </div>
              <div className="building b-two">
                <BookOpen size={33} strokeWidth={1} />
              </div>
              <div className="building b-three">
                <Boxes size={36} strokeWidth={1} />
              </div>
              <div className="building b-four">
                <Command size={40} strokeWidth={1.5} />
              </div>
              <div className="campus-path" />
            </div>
            <div className="floating-label label-two">
              <Sparkles size={16} /> Ideas que encuentran su lugar
            </div>
            <div className="art-footer">
              <span>ESPACIOS / RECURSOS / PERSONAS</span>
              <span>01 — 03</span>
            </div>
          </div>
        </section>
        <div className="principles-strip">
          <div className="wrap principles">
            <span>UNA SOLA PLATAFORMA.</span>
            <p>
              Coordinar <span>↗</span>
            </p>
            <p>
              Resolver <span>↗</span>
            </p>
            <p>
              Seguir creando <span>↗</span>
            </p>
          </div>
        </div>
        <section id="solucion" className="section wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TODO EN SU LUGAR</p>
              <h2>
                La operación se simplifica.
                <br />
                <span className="serif">El campus avanza.</span>
              </h2>
            </div>
            <p>
              Tres herramientas conectadas para que las tareas de todos los días
              no detengan lo que viene después.
            </p>
          </div>
          <div className="module-grid">
            {modules.map(
              ({ number, icon: Icon, title, description, label }) => (
                <article className="module-card" key={number}>
                  <div className="module-top">
                    <span>{number}</span>
                    <Icon size={26} strokeWidth={1.5} />
                  </div>
                  <p className="module-label">{label}</p>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <Link href="/portal" className="module-link">
                    Ir al portal <ArrowUpRight size={18} />
                  </Link>
                </article>
              ),
            )}
          </div>
        </section>
        <section id="flujo" className="workflow wrap">
          <div>
            <p className="eyebrow">DE LA CONSULTA AL SEGUIMIENTO</p>
            <h2>
              Una solicitud.
              <br />
              <span className="serif">Un camino claro.</span>
            </h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Consulta y solicita</h3>
                <p>Encuentra el espacio o recurso que necesitas.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Valida y confirma</h3>
                <p>Capacidad, horarios y estados antes de cada operación.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Mantén el seguimiento</h3>
                <p>Consulta tus solicitudes y reporta incidencias.</p>
              </div>
            </li>
          </ol>
        </section>
        <section className="closing wrap">
          <p className="eyebrow">MENOS FRICCIÓN. MÁS POSIBILIDADES.</p>
          <h2>
            Tu próxima idea
            <br />
            merece <span className="serif">su espacio.</span>
          </h2>
          <Link href="/portal" className="button button-dark">
            Entrar a CampusFlow <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="wrap footer" id="equipo">
        <Link href="/" className="brand">
          <Command size={23} />
          campus<span>flow</span>
        </Link>
        <p>Construido por Leonardo, Samuel, Tomas y Deimer.</p>
        <span>Campuslands · 2026</span>
      </footer>
    </>
  );
}
