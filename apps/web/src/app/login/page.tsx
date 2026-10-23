import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { RobotCompanion } from "@/components/robot-companion";
export default function Login() {
  return (
    <main id="contenido" className="auth-page">
      <div className="auth-aside">
        <Brand />
        <div className="auth-copy">
          <h1>
            Tu campus.
            <br />
            Más conectado.
          </h1>
          <p>
            Reserva, coordina y resuelve.
            <br />
            Cada operación tiene su lugar.
          </p>
        </div>
        <div className="auth-campus-scene auth-robot-stage">
          <span className="auth-orbit-label">Nos vemos en el campus.</span>
          <RobotCompanion variant="full" />
        </div>
        <div className="auth-module-strip">
          <span>
            <Box size={16} /> Recursos
          </span>
          <span>
            <CalendarDays size={16} /> Espacios
          </span>
          <span>
            <MessageSquare size={16} /> Incidencias
          </span>
        </div>
        <div className="auth-aside-bottom">
          <span>Todo empieza con una solicitud.</span>
          <p>
            Encuentra un recurso. Coordina un espacio. Haz visible lo que
            necesita atención.
          </p>
          <Link className="text-link" href="/#flujo">
            Así funciona CampusFlow <ArrowUpRight size={16} />
          </Link>
        </div>
        <p className="auth-trust">
          <ShieldCheck size={18} /> Acceso seguro para tu comunidad.
        </p>
      </div>
      <div className="auth-main">
        <div className="auth-access-header">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <Link href="/" className="text-link">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </div>
        <div className="auth-box">
          <h2>Qué bueno verte.</h2>
          <p>
            Ingresa con tu cuenta habilitada para consultar tus solicitudes.
          </p>
          <LoginForm />
          <p className="auth-help">
            ¿Necesitas acceso? Contacta al administrador del campus.
          </p>
          <div className="auth-next">
            <h3>Al entrar, todo tiene contexto.</h3>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Encuentra tu recurso</strong>
                  <p>Consulta equipos y espacios registrados.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Sigue tu solicitud</strong>
                  <p>Préstamos, reportes y conversación en su lugar.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Trabaja con tu perfil</strong>
                  <p>Las acciones disponibles dependen de tu rol.</p>
                </div>
              </li>
            </ol>
            <Link href="/#flujo" className="text-link">
              Conoce el recorrido <ArrowUpRight size={16} />
            </Link>
          </div>
          <details className="auth-access-help">
            <summary>¿Qué puedo hacer con mi cuenta?</summary>
            <p>
              Comunidad consulta y gestiona sus solicitudes. Operación atiende
              reportes y recursos. Administración también revisa auditoría. Los
              permisos se verifican en el servidor.
            </p>
          </details>
        </div>
      </div>
    </main>
  );
}
