import { ArrowUpRight, FileText, ShieldCheck } from "lucide-react";
import { RagArchitecture } from "./rag-architecture";

export function RagExplainer() {
  return (
    <section className="rag-section wrap" id="rag" aria-labelledby="rag-title">
      <div className="rag-heading">
        <div>
          <h2 id="rag-title">
            Respuestas
            <br />
            <span>con fuentes.</span>
          </h2>
          <p>
            Así conectaremos documentos autorizados con respuestas que puedas
            comprobar.
          </p>
        </div>
        <span className="status-badge">RAG · En preparación</span>
      </div>
      <RagArchitecture />
      <a
        className="text-link rag-static-link"
        href="/images/rag-campusflow.webp"
        target="_blank"
        rel="noreferrer"
      >
        Consultar el diagrama estático <ArrowUpRight size={16} />
      </a>
      <div className="rag-detail">
        <div>
          <FileText size={24} />
          <h3>Primero, las fuentes</h3>
          <p>
            PDF y Excel con procedencia, versión y permisos. Conservaremos la
            página, hoja o fila de cada fragmento. Los documentos simulados se
            identificarán como demostración.
          </p>
        </div>
        <div>
          <ShieldCheck size={24} />
          <h3>Después, la evidencia</h3>
          <p>
            La pregunta buscará fragmentos autorizados antes de generar una
            respuesta. Si no hay evidencia suficiente, el asistente lo indicará.
            Los recursos y horarios se seguirán validando en PostgreSQL.
          </p>
        </div>
      </div>
      <details className="rag-reading">
        <summary>Leer el recorrido del diagrama</summary>
        <ol>
          <li>
            Un operador carga un PDF o Excel autorizado. Se valida el archivo y
            se registra su versión.
          </li>
          <li>
            El contenido se divide en fragmentos con su página, hoja o fila. Un
            proveedor de embeddings, todavía por definir, permitirá indexarlos.
          </li>
          <li>
            El sistema verifica los permisos del usuario antes de recuperar los
            fragmentos que responden a su pregunta.
          </li>
          <li>
            El modelo genera una respuesta con ese contexto y muestra las
            referencias. El contenido del documento no otorga permisos ni
            ejecuta acciones.
          </li>
        </ol>
      </details>
      <p className="rag-status">
        Hoy funciona el triaje de incidencias con Groq. La carga de archivos, el
        índice vectorial y el chat RAG todavía están pendientes de implementar.
      </p>
    </section>
  );
}
