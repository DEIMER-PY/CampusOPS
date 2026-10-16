import {
  ArrowDown,
  ArrowRight,
  Box,
  CalendarDays,
  Grid2X2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { LandingMotion } from "@/components/landing-motion";
import { RagExplainer } from "@/components/rag-explainer";

export default function Home() {
  return (
    <>
      <LandingMotion />
      <header className="site-header wrap">
        <Brand />
        <nav aria-label="Principal">
          <a href="#plataforma">Plataforma</a>
          <a href="#espacios">Espacios</a>
          <a href="#flujo">Cómo funciona</a>
          <a href="#rag">RAG documental</a>
        </nav>
        <Link href="/login" className="button button-light">
          Ingresar <ArrowRight size={16} />
        </Link>
      </header>
      <main id="contenido">
        <section className="landing-hero wrap" id="plataforma">
          <h1>
            El campus,
            <br className="mobile-break" /> <span>en orden.</span>
          </h1>
          <p>
            Reserva espacios. Coordina recursos.
            <br className="mobile-break" /> Resuelve incidencias.
          </p>
          <div className="hero-actions">
            <Link href="/portal" className="button button-primary">
              Explorar el portal <ArrowRight size={19} />
            </Link>
            <a href="#flujo" className="button button-outline">
              Conocer la plataforma <ArrowDown size={17} />
            </a>
          </div>
          <div className="preview-caption">
            <span>El dashboard completo, desde el primer vistazo</span>
            <span>Captura de demostración · 16 oct. 2026</span>
          </div>
          <figure className="dashboard-preview" id="espacios">
            <Link href="/portal" aria-label="Abrir el dashboard de CampusFlow">
              <Image
                src="/images/dashboard-overview.webp"
                alt="Captura completa del dashboard CampusFlow: navegación, seguimiento de incidencias, disponibilidad de espacios y recursos e historial reciente."
                width={1425}
                height={1087}
                sizes="(max-width: 640px) 100vw, (max-width: 1440px) 94vw, 1320px"
              />
            </Link>
            <figcaption>
              <span>
                Vista del entorno de pruebas. Los datos de esta imagen no se
                actualizan en vivo.
              </span>
              <Link href="/portal">
                Entrar al sistema <ArrowRight size={15} />
              </Link>
            </figcaption>
          </figure>
        </section>
        <section className="workflow wrap" id="flujo">
          <div className="workflow-heading">
            <h2>
              Una solicitud.
              <br />
              <span>Un recorrido claro.</span>
            </h2>
            <p>
              Del primer clic al seguimiento, cada operación tiene un lugar y
              cada incidencia, un camino.
            </p>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <h3>Encuentra tu espacio</h3>
                <p>
                  Consulta aforo y estado. Solicita un horario; el sistema
                  valida los cruces antes de confirmar.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Coordina lo que necesitas</h3>
                <p>
                  Solicita recursos registrados y conserva el seguimiento hasta
                  su devolución.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Reporta. Prioriza. Resuelve.</h3>
                <p>
                  La IA propone categoría, prioridad y área de atención. El
                  equipo revisa y lleva el caso a su resolución.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="ai-feature wrap">
          <div className="ai-feature-copy">
            <Sparkles size={32} />
            <h2>
              Menos tiempo clasificando.
              <br />
              <span>Más tiempo resolviendo.</span>
            </h2>
            <p>
              Describe qué ocurre. CampusFlow organiza el reporte con Groq y
              deja una explicación que puedes revisar. Cada resultado conserva
              su modelo y fecha de análisis.
            </p>
            <Link href="/portal" className="button button-primary">
              Reportar una incidencia <ArrowRight size={17} />
            </Link>
            <small>
              <ShieldCheck size={16} /> Sugerencias de IA con revisión humana.
            </small>
          </div>
          <div className="report-demo">
            <div className="demo-top">
              <TriangleAlert size={19} />
              <span>Un reporte, de principio a fin</span>
            </div>
            <div className="report-line">
              <span>Tu descripción</span>
              <p>Qué ocurre, dónde sucede y cómo afecta la actividad.</p>
            </div>
            <ArrowDown size={20} className="demo-arrow" />
            <div className="report-line">
              <span>Análisis estructurado</span>
              <div className="tag-group">
                <span>Categoría</span>
                <span>Prioridad</span>
                <span>Área sugerida</span>
              </div>
              <p>Una explicación para entender la propuesta.</p>
            </div>
            <div className="demo-bottom">
              <span>Guardado → Analizado → Atendido</span>
            </div>
          </div>
        </section>
        <RagExplainer />
        <section className="closing wrap">
          <h2>
            Tu campus.
            <br />
            <span>Todo en su lugar.</span>
          </h2>
          <Link href="/portal" className="button button-light">
            Entrar a CampusFlow <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="footer wrap">
        <Brand />
        <p>Construido por Leonardo, Samuel, Tomas y Deimer.</p>
        <a
          href="https://campuslands.com/camper"
          target="_blank"
          rel="noreferrer"
        >
          Conoce Campuslands <ArrowRight size={14} />
        </a>
      </footer>
    </>
  );
}
