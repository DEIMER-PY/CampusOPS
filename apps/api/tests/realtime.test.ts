import assert from "node:assert/strict";
import test from "node:test";
import { canSendUrgentInChannel, canWriteInChannel } from "../src/auth.js";

function parseMentions(content: string) {
  const spaces = Array.from(
    content.matchAll(/@espacio:([a-zA-Z0-9_-]+)/g),
    (m) => m[1],
  );
  const resources = Array.from(
    content.matchAll(/@equipo:([a-zA-Z0-9_-]+)/g),
    (m) => m[1],
  );
  const users = Array.from(content.matchAll(/@usuario:([^,;.!?\n@]+)/g), (m) =>
    m[1].trim(),
  );

  return {
    spaces: spaces.length ? spaces : undefined,
    resources: resources.length ? resources : undefined,
    users: users.length ? users : undefined,
  };
}

function validateMessagePayload(payload: {
  channelSlug?: string;
  content?: string;
  priority?: string;
}) {
  if (!payload.channelSlug || typeof payload.channelSlug !== "string") {
    return { valid: false, error: "Canal inválido o no especificado." };
  }
  if (
    !payload.content ||
    typeof payload.content !== "string" ||
    !payload.content.trim()
  ) {
    return {
      valid: false,
      error: "El contenido del mensaje no puede estar vacío.",
    };
  }
  if (payload.content.length > 2000) {
    return {
      valid: false,
      error: "El mensaje no puede exceder los 2000 caracteres.",
    };
  }
  if (payload.priority && !["NORMAL", "URGENT"].includes(payload.priority)) {
    return { valid: false, error: "Prioridad de mensaje no reconocida." };
  }
  return { valid: true };
}

test("avisos-generales: solo ADMIN puede emitir comunicados oficiales", () => {
  assert.equal(
    canWriteInChannel("CLONAI", "avisos-generales"),
    false,
    "CLONAI no debe poder publicar en avisos-generales",
  );

  assert.equal(
    canWriteInChannel("FORMACION", "avisos-generales"),
    false,
    "FORMACION no debe poder emitir en avisos-generales",
  );

  assert.equal(
    canWriteInChannel("ADMIN", "avisos-generales"),
    true,
    "ADMIN debe poder emitir en avisos-generales",
  );
});

test("canales operativos: cualquier área puede interactuar y solicitar recursos", () => {
  const areaChannels = [
    "formacion",
    "co-working",
    "marketing-alianzas",
    "soporte-tecnico",
    "full-service",
    "clonai",
  ];
  for (const slug of areaChannels) {
    assert.equal(
      canWriteInChannel("CLONAI", slug),
      true,
      `CLONAI debe poder interactuar en #${slug}`,
    );
    assert.equal(
      canWriteInChannel("FULL_SERVICE", slug),
      true,
      `FULL_SERVICE debe poder interactuar en #${slug}`,
    );
    assert.equal(
      canWriteInChannel("FORMACION", slug),
      true,
      `FORMACION debe poder interactuar en #${slug}`,
    );
  }
});

test("prioridad URGENT: representantes solo pueden emitir en su respectiva área, ADMIN en todas", () => {
  const davidSoporteId = "c4100000-0000-4000-8000-000000000004";
  const carlosFormacionId = "c4100000-0000-4000-8000-000000000001";
  const regularUserId = "00000000-9999-4000-8000-000000000001";

  // David (Soporte) puede enviar urgente en soporte-tecnico
  assert.equal(
    canSendUrgentInChannel(
      { id: davidSoporteId, role: "SOPORTE" },
      "soporte-tecnico",
    ),
    true,
    "Representante de Soporte debe poder emitir URGENT en soporte-tecnico",
  );

  // David (Soporte) NO puede enviar urgente en formacion
  assert.equal(
    canSendUrgentInChannel(
      { id: davidSoporteId, role: "SOPORTE" },
      "formacion",
    ),
    false,
    "Representante de Soporte no debe poder emitir URGENT en canal ajeno",
  );

  // Carlos (Formación) puede enviar urgente en formacion
  assert.equal(
    canSendUrgentInChannel(
      { id: carlosFormacionId, role: "FORMACION" },
      "formacion",
    ),
    true,
    "Representante de Formación debe poder emitir URGENT en formacion",
  );

  // Usuario normal no representante no puede emitir urgente
  assert.equal(
    canSendUrgentInChannel(
      { id: regularUserId, role: "FORMACION" },
      "formacion",
    ),
    false,
    "Usuario común no debe poder emitir URGENT",
  );

  // ADMIN puede emitir urgente en cualquier canal
  assert.equal(
    canSendUrgentInChannel(
      { id: regularUserId, role: "ADMIN" },
      "avisos-generales",
    ),
    true,
    "ADMIN debe poder emitir URGENT en avisos-generales",
  );
  assert.equal(
    canSendUrgentInChannel(
      { id: regularUserId, role: "ADMIN" },
      "soporte-tecnico",
    ),
    true,
    "ADMIN debe poder emitir URGENT en soporte-tecnico",
  );
});

test("menciones inteligentes: extrae correctamente miembros, espacios y equipos del texto", () => {
  const text =
    "Hola @usuario:David Torres, por favor verificar si @espacio:Apolo tiene disponible el equipo @equipo:231321 para la sesión.";
  const result = parseMentions(text);

  assert.deepEqual(result.users, ["David Torres"]);
  assert.deepEqual(result.spaces, ["Apolo"]);
  assert.deepEqual(result.resources, ["231321"]);
});

test("validación de payload: rechaza mensajes vacíos o con prioridad desconocida", () => {
  assert.equal(
    validateMessagePayload({ channelSlug: "formacion", content: "   " }).valid,
    false,
  );
  assert.equal(
    validateMessagePayload({
      channelSlug: "clonai",
      content: "Hola campus",
      priority: "SUPER_URGENT",
    }).valid,
    false,
  );
  assert.equal(
    validateMessagePayload({
      channelSlug: "full-service",
      content: "Requerimos apoyo en Skilab",
      priority: "URGENT",
    }).valid,
    true,
  );
});
