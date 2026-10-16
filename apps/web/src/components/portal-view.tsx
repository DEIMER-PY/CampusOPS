import {
  ArrowUpRight,
  CalendarDays,
  Command,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { serverAuth } from "@/lib/supabase/server";

export async function PortalView({
  administrative = false,
}: {
  administrative?: boolean;
}) {
  const client = await serverAuth();
  let state =
    "El portal está pendiente de conectar con Supabase y la base de datos.";
  let ready = false;
  let role = "";
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login");
    const {
      data: { session },
    } = await client.auth.getSession();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000"}/api/me`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        },
      );
      if (response.ok) {
        const profile = await response.json();
        role = profile.data.role;
        if (administrative && !["ADMIN", "OPERATOR"].includes(role))
          redirect("/portal");
        ready = true;
        state =
          "Tu cuenta está conectada. Las operaciones se habilitan conforme se integran los módulos.";
      } else
        state =
          response.status === 403
            ? "Tu cuenta necesita un perfil autorizado. Contacta al administrador."
            : "No pudimos validar tu acceso. Inténtalo nuevamente.";
    } catch (error) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT")
        throw error;
      state =
        "El servicio no está disponible en este momento. Tu sesión permanece protegida.";
    }
  }
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <Link href="/" className="brand">
          <Command size={25} />
          campus<span>flow</span>
        </Link>
        <nav aria-label="Portal">
          <Link href="/portal">
            <CalendarDays size={18} /> Mi portal
          </Link>
          <Link href="/admin">
            <ShieldCheck size={18} /> Administración
          </Link>
          <Link href="/login">
            <LogIn size={18} /> Acceso
          </Link>
        </nav>
        <p>Campuslands · CampusFlow</p>
      </aside>
      <main id="contenido" className="portal-main">
        <div className="portal-top">
          <span>{administrative ? "Administración" : "Mi campus"}</span>
          <span className="role-pill">
            {ready ? role : "Conexión pendiente"}
          </span>
        </div>
        <p className="eyebrow">UN LUGAR PARA COORDINAR</p>
        <h1>
          {administrative
            ? "Tu campus, en perspectiva."
            : "Tu próxima idea empieza aquí."}
        </h1>
        <p className="portal-intro">
          Espacios, recursos y seguimiento en una experiencia conectada.
        </p>
        <section className="connection-card">
          <ShieldCheck size={30} />
          <div>
            <h2>
              {ready ? "Acceso verificado" : "Estamos preparando tu espacio"}
            </h2>
            <p>{state}</p>
          </div>
        </section>
        <section className="portal-module">
          <span className="eyebrow">ESPACIOS Y RESERVAS</span>
          <h2>El lugar adecuado para lo que viene.</h2>
          <p>
            La disponibilidad se consultará desde la base de datos. Este inicio
            no muestra reservas, equipos ni indicadores de ejemplo.
          </p>
          <Link href="/" className="text-link">
            Conocer CampusFlow <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
    </div>
  );
}
