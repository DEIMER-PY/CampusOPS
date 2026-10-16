import { redirect } from "next/navigation";
import { serverAuth } from "@/lib/supabase/server";
import { Workspace } from "./workspace";

export async function PortalView({
  administrative = false,
}: {
  administrative?: boolean;
}) {
  const client = await serverAuth();
  if (!client)
    return <Workspace configured={false} administrative={administrative} />;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const {
    data: { session },
  } = await client.auth.getSession();
  let profile: { role: string } | undefined;
  let message = "";
  try {
    const response = await fetch(
      `${process.env.BACKEND_INTERNAL_URL || process.env.API_URL || "http://127.0.0.1:4000"}/api/me`,
      {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (response.ok) profile = (await response.json()).data;
    else
      message =
        response.status === 403
          ? "Tu cuenta necesita un perfil autorizado. Contacta al administrador."
          : "No pudimos validar tu acceso. Actualiza o vuelve a ingresar.";
  } catch {
    message = "La API no está disponible. Actualiza en unos segundos.";
  }
  if (
    administrative &&
    profile &&
    !["ADMIN", "OPERATOR"].includes(profile.role)
  )
    redirect("/portal");
  return (
    <Workspace
      configured={Boolean(profile)}
      initialRole={profile?.role}
      administrative={administrative}
      connectionMessage={message}
    />
  );
}
