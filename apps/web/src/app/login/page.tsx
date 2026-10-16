import { ArrowLeft, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
export default function Login() {
  return (
    <main id="contenido" className="auth-page">
      <div className="auth-aside">
        <Brand />
        <div className="auth-copy">
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
        <figure className="auth-art">
          <Image
            className="auth-robot"
            src="/brand/campus-robot-login.webp"
            width={840}
            height={840}
            sizes="(max-width: 640px) 128px, (max-width: 1150px) 400px, 460px"
            preload
            alt="Robot astronauta con una sonrisa azul, referencia de Campuslands"
          />
        </figure>
        <p className="auth-trust">
          <ShieldCheck size={18} /> Acceso seguro para tu comunidad.
        </p>
      </div>
      <div className="auth-main">
        <Link href="/" className="text-link">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
        <div className="auth-box">
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
