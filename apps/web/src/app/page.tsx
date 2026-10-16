import {
  ArrowDown,
  ArrowRight,
  Box,
  CalendarDays,
  Circle,
  Grid2X2,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { LandingMotion } from "@/components/landing-motion";
import { RagExplainer } from "@/components/rag-explainer";

const spaces = [
  { name: "Auditorio", capacity: 100 },
  { name: "Cosmos", capacity: 25 },
  { name: "Apolo", capacity: 34 },
];
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
            <span>Una vista de tu próximo espacio de trabajo</span>
            <span>Vista de presentación</span>
          </div>
          <div className="product-preview" id="espacios">
            <aside className="preview-sidebar">
              <strong>CampusFlow</strong>
              <div>
                <span>
                  <LayoutDashboard size={18} />
                  Resumen
                </span>
                <span className="selected">
                  <Grid2X2 size={18} />
                  Espacios
                </span>
                <span>
                  <CalendarDays size={18} />
                  Reservas
                </span>
                <span>
                  <Box size={18} />
                  Recursos
                </span>
                <span>
                  <TriangleAlert size={18} />
                  Incidencias
                </span>
              </div>
              <small>Todo en un mismo flujo.</small>
            </aside>
            <div className="preview-content">
              <div className="section-title">
                <div>
                  <h2>Espacios del campus</h2>
                  <p>El lugar adecuado para tu próxima idea.</p>
                </div>
                <Link href="/portal" className="text-link">
                  Ver espacios <ArrowRight size={16} />
                </Link>
              </div>
              <div className="space-rows">
                {spaces.map((space) => (
                  <div className="space-row" key={space.name}>
                    <div className="space-icon">
                      <Grid2X2 size={24} />
                    </div>
                    <div className="space-name">
                      <h3>{space.name}</h3>
                      <span>
                        <Users size={15} /> {space.capacity} personas
                      </span>
                    </div>
                    <span className="status-badge">
                      <Circle size={10} /> Estado por verificar
                    </span>
                    <Link
                      className="icon-button"
                      href="/portal"
                      aria-label={`Consultar ${space.name}`}
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ))}
              </div>
              <p className="preview-disclaimer">
                Capacidades del catálogo de trabajo. La disponibilidad se
                consulta dentro del sistema.
              </p>
            </div>
          </div>
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
