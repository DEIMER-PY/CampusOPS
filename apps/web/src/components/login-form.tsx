"use client";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const configured = Boolean(url && key);
  return (
    <form
      className="login-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!url || !key || busy) return;
        setBusy(true);
        setMessage("");
        const form = new FormData(event.currentTarget);
        try {
          const client = createBrowserClient(url, key);
          const { error } = await client.auth.signInWithPassword({
            email: String(form.get("email")),
            password: String(form.get("password")),
          });
          if (error) {
            setMessage(
              "No pudimos iniciar sesión. Revisa tus credenciales e inténtalo de nuevo.",
            );
            return;
          }
          router.replace("/portal");
          router.refresh();
        } catch {
          setMessage("No fue posible conectar. Inténtalo nuevamente.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="email">Correo electrónico</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="tu@correo.com"
        required
        disabled={!configured || busy}
      />
      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        disabled={!configured || busy}
      />
      {!configured ? (
        <p className="notice" role="status">
          El acceso está pendiente de conectar con Supabase. Aún no se reciben
          credenciales.
        </p>
      ) : null}
      <p className="form-message" aria-live="polite">
        {message}
      </p>
      <button
        className="button button-dark"
        type="submit"
        disabled={!configured || busy}
      >
        {busy ? "Ingresando…" : "Ingresar a mi cuenta"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
