import { ArrowLeft, Command, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
export default function Login() {
  return (
    <main id="contenido" className="auth-page">
      <div className="auth-aside">
        <Link href="/" className="brand">
          <Command size={28} />
          campus<span>flow</span>
        </Link>
        <div>
          <p className="eyebrow">BIENVENIDO A TU CAMPUS</p>
          <h1>
            Todo empieza
            <br />
            con una buena
            <br />
            <span className="serif">conexión.</span>
          </h1>
          <p>
            Tu espacio para consultar, coordinar
            <br />y seguir avanzando.
          </p>
        </div>
        <p className="auth-trust">
          <ShieldCheck size={18} /> Acceso seguro para tu comunidad.
        </p>
      </div>
      <div className="auth-main">
        <Link href="/" className="text-link">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
        <div className="auth-box">
          <p className="eyebrow">TU CUENTA CAMPUSFLOW</p>
          <h2>Qué bueno verte.</h2>
          <p>
            Ingresa con tu cuenta habilitada para consultar tus solicitudes.
          </p>
          <LoginForm />
          <p className="auth-help">
            ¿Necesitas acceso? Contacta al administrador del campus.
          </p>
        </div>
      </div>
    </main>
  );
}
