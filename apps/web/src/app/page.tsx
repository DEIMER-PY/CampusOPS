import { ArrowDown, ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";

import Link from "next/link";
import { Brand } from "@/components/brand";
import { CampusGallery } from "@/components/campus-gallery";
import { CampusHeroMedia } from "@/components/campus-hero-media";
import { DecisionJourney } from "@/components/decision-journey";
import { LandingMotion } from "@/components/landing-motion";
import { RagExplainer } from "@/components/rag-explainer";
import { RobotCompanion } from "@/components/robot-companion";
import { WorkflowMedia } from "@/components/workflow-media";

export default function Home() {
  return (
    <div className="campus-site">
      <LandingMotion />
      <header className="site-header wrap">
        <Brand />
        <nav aria-label="Principal">
          <a href="#plataforma">Plataforma</a>
          <a href="#espacios">El campus</a>
          <a href="#flujo">Cómo funciona</a>
          <a href="#rag">RAG documental</a>
        </nav>
        <Link href="/login" className="button button-light">
          Ingresar <ArrowUpRight size={18} />
        </Link>
      </header>
      <main id="contenido">
        <section className="campus-hero wrap" id="plataforma">
          <div className="campus-hero-copy">
            <h1>
              El campus,
              <br />
              en orden.
            </h1>
            <p>
              Espacios, recursos e incidencias de Campuslands. Todo conectado,
              de la solicitud a la solución.
            </p>
            <Link href="/portal" className="button button-primary">
              Entrar a CampusFlow <ArrowUpRight size={20} />
            </Link>
            <a className="hero-explore" href="#espacios">
              Conoce tu próximo espacio <ArrowDown size={18} />
            </a>
          </div>
          <CampusHeroMedia />
        </section>
        <section className="campus-intro wrap" data-reveal>
          <h2>
            Tu campus.
            <br />
            Un mismo flujo.
          </h2>
          <div>
            <p>
              Una sala para encontrarse. Un recurso para avanzar. Una incidencia
              que necesita atención.
            </p>
            <p>
              CampusFlow conecta esas decisiones y conserva el contexto de cada
              operación. La IA propone; las reglas validan y el equipo decide.
            </p>
            <a href="#flujo" className="text-link">
              Así funciona <ArrowRight size={18} />
            </a>
          </div>
        </section>
        <section className="campus-spaces wrap" id="espacios" data-reveal>
          <div className="editorial-heading">
            <h2>
              El lugar también
              <br />
              hace la diferencia.
            </h2>
            <p>
              Explora las fotografías del campus. Dentro del portal puedes
              consultar el catálogo, aforo y estado antes de solicitar un
              horario.
            </p>
          </div>
          <CampusGallery />
        </section>
        <section className="campus-workflow wrap" id="flujo">
          <div className="workflow-sticky" data-reveal>
            <h2>
              De necesitarlo
              <br />a resolverlo.
            </h2>
            <p>
              Un recorrido con contexto, estados claros y decisiones verificadas
              por el servidor.
            </p>
            <Link href="/portal" className="text-link">
              Abrir el portal <ArrowUpRight size={18} />
            </Link>
            <WorkflowMedia />
          </div>
          <div className="workflow-chapters">
            <article id="flujo-encontrar" data-reveal>
              <h3>Encuentra lo que necesitas.</h3>
              <p>
                Consulta espacios y equipos registrados. El estado del catálogo
                te orienta; el servidor comprueba cada solicitud antes de
                confirmarla.
              </p>
            </article>
            <article id="flujo-coordinar" data-reveal>
              <h3>Coordina el préstamo.</h3>
              <p>
                Solicita un recurso disponible y sigue su recorrido hasta la
                devolución. Un equipo no puede tener dos préstamos activos.
              </p>
            </article>
            <article id="flujo-reportar" data-reveal>
              <h3>Haz visible el problema.</h3>
              <p>
                Guarda una incidencia, adjunta evidencia y conserva la
                conversación en el mismo reporte. Si el análisis falla, el
                reporte permanece guardado.
              </p>
            </article>
            <article id="flujo-revisar" data-reveal>
              <h3>La última palabra es humana.</h3>
              <p>
                Groq propone categoría, prioridad y área, junto con una
                explicación. El operador revisa y decide el siguiente paso.
              </p>
            </article>
          </div>
        </section>
        <DecisionJourney />
        <RagExplainer />
        <section className="campus-closing wrap" data-reveal>
          <h2>
            Lo que sigue,
            <br />
            en su lugar.
          </h2>
          <div>
            <p>
              Consulta, coordina y da seguimiento desde tu cuenta de CampusFlow.
            </p>
            <Link href="/login" className="button button-primary">
              Ingresar al sistema <ArrowUpRight size={20} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="campus-footer wrap campus-footer-expanded">
        <div className="footer-about">
          <Brand />
          <p>
            Un lugar para coordinar los recursos, los espacios y las incidencias
            de tu campus.
          </p>
          <p>Construido por Leonardo, Samuel, Tomas y Deimer.</p>
        </div>
        <nav aria-label="Explorar CampusFlow">
          <h3>Explora</h3>
          <a href="#espacios">El campus</a>
          <a href="#flujo">Cómo funciona</a>
          <a href="#rag">Arquitectura RAG</a>
          <Link href="/login">Acceder al portal</Link>
        </nav>
        <div className="footer-context">
          <h3>Hecho para tu comunidad</h3>
          <p>La IA acompaña. Las reglas validan. Las personas deciden.</p>
          <a
            href="https://campuslands.com/camper"
            target="_blank"
            rel="noreferrer"
          >
            Conoce Campuslands <ArrowUpRight size={18} />
          </a>
          <Link href="/portal">
            Recursos, espacios y reportes <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="footer-mascot">
          <RobotCompanion />
        </div>
        <span className="footer-wordmark" aria-hidden="true">
          CampusFlow
        </span>
      </footer>
    </div>
  );
}
