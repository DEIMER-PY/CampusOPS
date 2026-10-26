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
  const profile = await database().profile.findUnique({
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
  res.locals.actor = profile;
  next();
}

import type { Role } from "./generated/prisma/client.js";

// Canonical representative profile IDs created for each campus area
export const OFFICIAL_REPRESENTATIVE_IDS = new Set<string>([
  "c4100000-0000-4000-8000-000000000001", // Carlos Gómez (Formación)
  "00000000-0000-4000-8000-00000000cf01", // Carlos Gómez (Formación alt)
  "c4100000-0000-4000-8000-000000000002", // Ana Martínez (Coworking)
  "c4100000-0000-4000-8000-000000000003", // Laura Rincón (Marketing)
  "c4100000-0000-4000-8000-000000000004", // David Torres (Soporte)
  "c4100000-0000-4000-8000-000000000005", // Marta Sánchez (Full Service)
  "c4100000-0000-4000-8000-000000000006", // Felipe Morales (ClonAI)
]);

export function isGeneralAdmin(role: Role | string): boolean {
  return role === "ADMIN";
}

export function isChannelRepresentative(user: {
  id: string;
  role: Role | string;
}): boolean {
  return isGeneralAdmin(user.role) || OFFICIAL_REPRESENTATIVE_IDS.has(user.id);
}

export function canWriteInChannel(
  role: Role | string,
  channelSlug: string,
): boolean {
  if (channelSlug === "avisos-generales") {
    return isGeneralAdmin(role);
  }
  return true;
}

export function canSendUrgentInChannel(
  user: { id: string; role: Role | string },
  channelSlug: string,
): boolean {
  if (isGeneralAdmin(user.role)) return true;
  if (!isChannelRepresentative(user)) return false;

  const areaChannelMap: Record<string, string[]> = {
    formacion: ["FORMACION"],
    "co-working": ["COWORKING"],
    "marketing-alianzas": ["MARKETING"],
    "soporte-tecnico": ["SOPORTE"],
    "full-service": ["FULL_SERVICE"],
    clonai: ["CLONAI"],
  };

  const allowedRoles = areaChannelMap[channelSlug];
  return Boolean(allowedRoles?.includes(user.role));
}

export function canManageOperations(role: Role | string): boolean {
  return ["ADMIN", "OPERATOR", "FULL_SERVICE", "SOPORTE"].includes(role);
}

export function canViewAllIncidents(role: Role | string): boolean {
  return ["ADMIN", "OPERATOR", "SOPORTE"].includes(role);
}

export function canViewAllLoans(role: Role | string): boolean {
  return ["ADMIN", "OPERATOR", "FULL_SERVICE", "SOPORTE"].includes(role);
}

export function canViewAllReservations(role: Role | string): boolean {
  return ["ADMIN", "OPERATOR", "FULL_SERVICE"].includes(role);
}
