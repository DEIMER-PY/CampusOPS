import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { database } from "./db.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !process.env.DATABASE_URL) {
    res.status(503).json({
      error: {
        code: "AUTH_NOT_CONFIGURED",
        message: "Autenticación pendiente de configurar.",
      },
    });
    return;
  }
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Inicia sesión para continuar.",
      },
    });
    return;
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Sesión inválida o vencida.",
      },
    });
    return;
  }
  let profile = await database().profile.findUnique({
    where: { id: data.user.id },
  });
  if (!profile) {
    res.status(403).json({
      error: {
        code: "PROFILE_REQUIRED",
        message: "Solicita la activación de tu perfil.",
      },
    });
    return;
  }
  const email = data.user.email;
  const name =
    (data.user.user_metadata?.full_name as string) ||
    (data.user.user_metadata?.name as string) ||
    email?.split("@")[0] ||
    "Usuario";
  if (!profile.name || !profile.email) {
    profile = await database().profile.update({
      where: { id: profile.id },
      data: {
        name: profile.name || name,
        email: profile.email || email,
      },
    });
  }
  res.locals.actor = profile;
  next();
}
