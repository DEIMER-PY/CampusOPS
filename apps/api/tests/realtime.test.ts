import assert from "node:assert/strict";
import test from "node:test";

// Logic unit tests for realtime channels and messaging permissions
function canUserPostInChannel(
  role: string,
  channelSlug: string,
  isBroadcastOnly: boolean,
): boolean {
  if (isBroadcastOnly || channelSlug === "avisos-generales") {
    return role === "ADMIN";
  }
  return true;
}

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
    canUserPostInChannel("CLONAI", "avisos-generales", true),
    false,
    "CLONAI no debe poder publicar en avisos-generales",
  );

  assert.equal(
    canUserPostInChannel("FORMACION", "avisos-generales", true),
    false,
    "FORMACION no debe poder emitir en avisos-generales",
  );

  assert.equal(
    canUserPostInChannel("ADMIN", "avisos-generales", true),
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
      canUserPostInChannel("CLONAI", slug, false),
      true,
      `CLONAI debe poder interactuar en #${slug}`,
    );
    assert.equal(
      canUserPostInChannel("FULL_SERVICE", slug, false),
      true,
      `FULL_SERVICE debe poder interactuar en #${slug}`,
    );
    assert.equal(
      canUserPostInChannel("FORMACION", slug, false),
      true,
      `FORMACION debe poder interactuar en #${slug}`,
    );
  }
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
