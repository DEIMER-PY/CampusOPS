// Pruebas del motor de reglas del flujo n8n: extrae el código real del workflow y lo ejecuta.
// Sin red, sin Gemini ni base de datos: solo la lógica determinista. Ejecutar: node --test tests/n8n
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const workflow = JSON.parse(
  readFileSync(
    new URL("../../docs/n8n/campusflow-orquestador.json", import.meta.url),
    "utf8",
  ),
);
const codigo = (nombre) =>
  workflow.nodes.find((n) => n.name === nombre).parameters.jsCode;

function ejecutar(nombre, { entrada, estado, ia }) {
  const nodos = { "Normalizar Entrada": entrada, "Leer Estado": { estado } };
  const $ = (n) => ({ first: () => ({ json: nodos[n] }) });
  const $input = { first: () => ({ json: ia }) };
  if (nombre === "Motor de Reglas") {
    // Igual que en n8n: antes del motor corre el clasificador de reglas fijas.
    nodos["Clasificar Mensaje"] = new Function(
      "$",
      "$input",
      codigo("Clasificar Mensaje"),
    )($, $input)[0].json;
  }
  return new Function("$", "$input", codigo(nombre))($, $input)[0].json;
}
const normalizar = (body) =>
  new Function("$input", codigo("Normalizar Entrada"))({
    first: () => ({ json: { body } }),
  })[0].json;

const SALAS = [
  ["Auditorio", 100],
  ["Spooki", 38],
  ["Apolo", 34],
  ["Artemis", 32],
  ["Cosmos", 25],
  ["Skilab", 20],
  ["Blanca", 12],
  ["Azul", 10],
  ["Amarillas", 6],
  ["Azules", 6],
  ["Verdes", 6],
];
const sala = (nombre, capacidad, estado = "DISPONIBLE") => ({
  nombre,
  capacidad,
  estado,
});
const rooms = (cambios = {}) => SALAS.map(([n, c]) => sala(n, c, cambios[n]));
const iso = (h) => new Date(`2026-10-16T${h}:00-05:00`).toISOString();
const reserva = (id, salaN, ocupante, ini, fin, asistentes, creada) => ({
  id,
  sala: salaN,
  ocupante,
  rol: "DOCENTE",
  inicio: iso(ini),
  fin: iso(fin),
  asistentes,
  created_at: iso(creada),
  nota: null,
  reubicado_desde: null,
});
const estado = (bookings = [], cambios) => ({
  now: iso("08:00"),
  rooms: rooms(cambios),
  bookings,
});
const entrada = (extra = {}) => ({
  canal: "frontend",
  valido: true,
  reporte: "x",
  usuario: "Prof. Leonardo",
  rol: "DOCENTE",
  salaActual: null,
  asistentes: null,
  horaInicio: null,
  horaFinSolicitada: null,
  replyTo: null,
  ...extra,
});
const gemini = (j) => ({
  candidates: [{ content: { parts: [{ text: JSON.stringify(j) }] } }],
  modelVersion: "gemini-test",
});
const sinIncidencia = {
  existe: false,
  descripcion: null,
  prioridad: "NONE",
  areaResponsable: null,
  inhabilitaSala: false,
};
const ia = (intencion, extra = {}) =>
  gemini({
    intencion,
    sala: null,
    horaInicio: null,
    horaFin: null,
    asistentes: null,
    incidencia: sinIncidencia,
    ...extra,
  });
const motor = (caso) => ejecutar("Motor de Reglas", caso);

test("R1 aforo: 11 personas en Azul (10) se rechaza y sugiere alternativas", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: ia("RESERVA", {
      sala: "Azul",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 11,
    }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "SOLICITUD_RECHAZADA");
  assert.equal(r.decisionIA.tipoAlerta, "WARNING");
  assert.equal(r.plan.ops.length, 0);
  assert.match(r.decisionIA.explicacion, /admite 10/);
});

test("R1 aforo: 10 personas en Azul se confirma", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: ia("RESERVA", {
      sala: "Azul",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 10,
    }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "RESERVA_CREADA");
  assert.equal(r.plan.ops[0].op, "insert");
  assert.equal(r.plan.ops[0].inicio, iso("10:00"));
});

test("R2 solape: se rechaza el cruce y el intervalo contiguo es válido", () => {
  const e = estado([
    reserva("a", "Cosmos", "Ana", "10:00", "11:00", 20, "07:00"),
  ]);
  const cruce = motor({
    entrada: entrada(),
    estado: e,
    ia: ia("RESERVA", {
      sala: "Cosmos",
      horaInicio: "10:30",
      horaFin: "11:30",
      asistentes: 10,
    }),
  });
  assert.equal(cruce.decisionIA.accionEjecutada, "SOLICITUD_RECHAZADA");
  assert.equal(cruce.plan.ops.length, 0);
  const contiguo = motor({
    entrada: entrada(),
    estado: e,
    ia: ia("RESERVA", {
      sala: "Cosmos",
      horaInicio: "11:00",
      horaFin: "12:00",
      asistentes: 10,
    }),
  });
  assert.equal(contiguo.decisionIA.accionEjecutada, "RESERVA_CREADA");
});

test("R3 mantenimiento: no se asigna una sala inhabilitada", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado([], { Cosmos: "MANTENIMIENTO" }),
    ia: ia("RESERVA", {
      sala: "Cosmos",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 10,
    }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "SOLICITUD_RECHAZADA");
  assert.match(r.decisionIA.explicacion, /mantenimiento/);
});

test("sin sala indicada se recomienda la de menor aforo suficiente", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: ia("RESERVA", {
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 11,
    }),
  });
  assert.equal(r.plan.ops[0].sala, "Blanca");
});

test("R4 FIFO: la extensión desplaza a quien llegó después y lo reubica", () => {
  const e = estado([
    reserva("leo", "Cosmos", "Prof. Leonardo", "10:00", "11:00", 25, "07:00"),
    reserva(
      "com",
      "Cosmos",
      "Reunión Comercial",
      "11:00",
      "12:30",
      20,
      "07:30",
    ),
  ]);
  const r = motor({
    entrada: entrada({
      salaActual: "Cosmos",
      horaInicio: "10:00",
      horaFinSolicitada: "11:30",
    }),
    estado: e,
    ia: ia("EXTENSION", { sala: "Cosmos" }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "REUBICACION_AUTOMATICA");
  assert.deepEqual(
    r.plan.ops.map((o) => o.op),
    ["move", "extend"],
  );
  assert.equal(r.plan.ops[0].sala, "Skilab");
  assert.equal(r.plan.ops[1].fin, iso("11:30"));
});

test("R4 FIFO: no se desplaza a quien reservó antes", () => {
  const e = estado([
    reserva("leo", "Cosmos", "Prof. Leonardo", "10:00", "11:00", 25, "07:30"),
    reserva(
      "com",
      "Cosmos",
      "Reunión Comercial",
      "11:00",
      "12:30",
      20,
      "07:00",
    ),
  ]);
  const r = motor({
    entrada: entrada({ salaActual: "Cosmos", horaFinSolicitada: "11:30" }),
    estado: e,
    ia: ia("EXTENSION", { sala: "Cosmos" }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "SOLICITUD_RECHAZADA");
  assert.equal(r.plan.ops.length, 0);
});

test("extensión sin sala alternativa se rechaza sin cambios", () => {
  const ocupadas = SALAS.filter(([n, c]) => n !== "Cosmos" && c >= 20).map(
    ([n], i) => reserva(`o${i}`, n, `Grupo ${i}`, "11:00", "12:30", 5, "06:00"),
  );
  const e = estado([
    reserva("leo", "Cosmos", "Prof. Leonardo", "10:00", "11:00", 25, "07:00"),
    reserva(
      "com",
      "Cosmos",
      "Reunión Comercial",
      "11:00",
      "12:30",
      20,
      "07:30",
    ),
    ...ocupadas,
  ]);
  const r = motor({
    entrada: entrada({ salaActual: "Cosmos", horaFinSolicitada: "11:30" }),
    estado: e,
    ia: ia("EXTENSION", { sala: "Cosmos" }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "SOLICITUD_RECHAZADA");
  assert.equal(r.plan.ops.length, 0);
});

test("R5 incidencia crítica inhabilita la sala y reubica sus reservas", () => {
  const e = estado([
    reserva("a", "Cosmos", "Ana", "10:00", "11:00", 18, "07:00"),
  ]);
  const incidencia = {
    existe: true,
    descripcion: "Inundación en el aula",
    prioridad: "CRITICAL",
    areaResponsable: "INFRAESTRUCTURA",
    inhabilitaSala: true,
  };
  const r = motor({
    entrada: entrada({
      salaActual: "Cosmos",
      reporte: "Hay una inundación en Cosmos y no se puede usar la sala",
    }),
    estado: e,
    ia: ia("INCIDENCIA", { sala: "Cosmos", incidencia }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "SALA_EN_MANTENIMIENTO");
  assert.deepEqual(
    r.plan.ops.map((o) => o.op),
    ["room_state", "incident", "move"],
  );
  assert.equal(r.plan.ops[2].sala, "Skilab");
  assert.equal(r.incidenciaDetectada.prioridad, "CRITICAL");
});

test("incidencia leve solo se registra", () => {
  const incidencia = {
    existe: true,
    descripcion: "Marcador gastado",
    prioridad: "LOW",
    areaResponsable: "ASEO",
    inhabilitaSala: false,
  };
  const r = motor({
    entrada: entrada({ reporte: "El marcador de la sala Apolo está gastado" }),
    estado: estado(),
    ia: ia("INCIDENCIA", { sala: "Apolo", incidencia }),
  });
  assert.deepEqual(
    r.plan.ops.map((o) => o.op),
    ["incident"],
  );
});

test("falla de Gemini: error explícito, 503 y ningún cambio (nunca respuesta inventada)", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: { error: { message: "503" } },
  });
  assert.equal(r.httpStatus, 503);
  assert.equal(r.decisionIA.tipoAlerta, "ERROR");
  assert.equal(r.plan.ops.length, 0);
});

test("respuesta de IA fuera del esquema se rechaza", () => {
  for (const mala of [
    { intencion: "BORRAR_TODO" },
    { intencion: "RESERVA", sala: "Sala Inventada", incidencia: sinIncidencia },
    { intencion: "RESERVA", horaInicio: "25:99", incidencia: sinIncidencia },
  ]) {
    const r = motor({ entrada: entrada(), estado: estado(), ia: gemini(mala) });
    assert.equal(r.httpStatus, 503, JSON.stringify(mala));
    assert.equal(r.plan.ops.length, 0);
  }
});

test("Normalizar: valida el contrato del frontend", () => {
  assert.equal(
    normalizar({ reporte: "hola", usuario: "Ana", rol: "DOCENTE" }).valido,
    true,
  );
  const malo = normalizar({
    reporte: "",
    usuario: "Ana",
    rol: "ROOT",
    asistentes: -1,
    horaInicio: "9:00",
  });
  assert.equal(malo.valido, false);
  assert.deepEqual(malo.errores.map((x) => x.campo).sort(), [
    "asistentes",
    "horaInicio",
    "reporte",
    "rol",
  ]);
});

test("Normalizar: WhatsApp ignora mensajes propios y vacíos", () => {
  const evo = (key, message) => ({
    event: "messages.upsert",
    data: { key, message, pushName: "Ana" },
  });
  assert.equal(
    normalizar(
      evo(
        { fromMe: true, remoteJid: "57300@s.whatsapp.net" },
        { conversation: "hola" },
      ),
    ).valido,
    false,
  );
  assert.equal(
    normalizar(evo({ fromMe: false, remoteJid: "57300@s.whatsapp.net" }, {}))
      .valido,
    false,
  );
  const ok = normalizar(
    evo(
      { fromMe: false, remoteJid: "57300@s.whatsapp.net" },
      { conversation: "¿Qué salas hay libres?" },
    ),
  );
  assert.equal(ok.valido, true);
  assert.equal(ok.replyTo, "57300");
});

test("Construir Respuesta: devuelve las 11 salas con REUBICADO_IA", () => {
  const motorOut = motor({
    entrada: entrada({
      salaActual: "Cosmos",
      horaInicio: "10:00",
      horaFinSolicitada: "11:30",
    }),
    estado: estado([
      reserva("leo", "Cosmos", "Prof. Leonardo", "10:00", "11:00", 25, "07:00"),
      reserva(
        "com",
        "Cosmos",
        "Reunión Comercial",
        "11:00",
        "12:30",
        20,
        "07:30",
      ),
    ]),
    ia: ia("EXTENSION", { sala: "Cosmos" }),
  });
  const final = estado([
    {
      ...reserva(
        "leo",
        "Cosmos",
        "Prof. Leonardo",
        "10:00",
        "11:30",
        25,
        "07:00",
      ),
      nota: "Horario extendido por orden de llegada",
    },
    {
      ...reserva(
        "com",
        "Skilab",
        "Reunión Comercial",
        "11:00",
        "12:30",
        20,
        "07:30",
      ),
      reubicado_desde: "Cosmos",
      nota: "Reubicado por IA desde Cosmos",
    },
  ]);
  const nodos = {
    "Motor de Reglas": motorOut,
    "Leer Estado Final": { estado: final },
  };
  const $ = (n) => ({
    first: () => {
      if (!nodos[n]) throw new Error("no ejecutado");
      return { json: nodos[n] };
    },
  });
  const r = new Function("$", codigo("Construir Respuesta"))($)[0].json;
  assert.equal(r.respuesta.salas.length, 11);
  const skilab = r.respuesta.salas.find((s) => s.nombre === "Skilab");
  assert.equal(skilab.estado, "REUBICADO_IA");
  assert.equal(skilab.horario, "11:00 - 12:30");
  assert.equal(
    r.respuesta.salas.find((s) => s.nombre === "Cosmos").horario,
    "10:00 - 11:30",
  );
  assert.equal(r.httpStatus, 200);
});

test("sala sin habilitar (DESHABILITADA) no se reserva y se muestra como MANTENIMIENTO", () => {
  const e = estado([], { Cosmos: "DESHABILITADA" });
  const r = motor({
    entrada: entrada(),
    estado: e,
    ia: ia("RESERVA", {
      sala: "Cosmos",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 10,
    }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "SOLICITUD_RECHAZADA");
  assert.equal(r.plan.ops.length, 0);
  const nodos = { "Motor de Reglas": r, "Leer Estado Final": { estado: e } };
  const $ = (n) => ({
    first: () => {
      if (!nodos[n]) throw new Error("no ejecutado");
      return { json: nodos[n] };
    },
  });
  const resp = new Function("$", codigo("Construir Respuesta"))($)[0].json;
  const cosmos = resp.respuesta.salas.find((s) => s.nombre === "Cosmos");
  assert.equal(cosmos.estado, "MANTENIMIENTO");
  assert.equal(cosmos.nota, "Sin habilitar por el operador");
});

test("Gemini con cercas de código sigue siendo válido (se extrae el JSON)", () => {
  const cuerpo = JSON.stringify({
    intencion: "CONSULTA",
    sala: null,
    horaInicio: null,
    horaFin: null,
    asistentes: null,
    incidencia: sinIncidencia,
  });
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: {
      candidates: [
        { content: { parts: [{ text: "```json\n" + cuerpo + "\n```" }] } },
      ],
    },
  });
  assert.equal(r.httpStatus, 200);
  assert.equal(r.decisionIA.titulo, "Salas disponibles");
});

test("Gemini truncado: error explícito con finishReason y sin cambios", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: {
      candidates: [
        {
          finishReason: "MAX_TOKENS",
          content: { parts: [{ text: '{"intencion":"RESER' }] },
        },
      ],
    },
  });
  assert.equal(r.httpStatus, 503);
  assert.match(r.decisionIA.explicacion, /MAX_TOKENS/);
  assert.equal(r.plan.ops.length, 0);
});

test("fecha del pedido: la reserva se arma para ese día y no para hoy", () => {
  const r = motor({
    entrada: entrada({ fecha: "2026-10-20" }),
    estado: estado(),
    ia: ia("RESERVA", {
      sala: "Cosmos",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 10,
    }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "RESERVA_CREADA");
  assert.equal(
    r.plan.ops[0].inicio,
    new Date("2026-10-20T10:00:00-05:00").toISOString(),
  );
  assert.equal(r.ejecucion, "APLICADA");
});

test("modo PROPUESTA: calcula la decisión pero no genera operaciones de escritura", () => {
  const r = motor({
    entrada: entrada({ modo: "PROPUESTA" }),
    estado: estado(),
    ia: ia("RESERVA", {
      sala: "Cosmos",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 10,
    }),
  });
  assert.deepEqual(r.plan.ops, []);
  assert.equal(r.propuesta.length, 1);
  assert.equal(r.ejecucion, "NO_APLICADA");
  assert.match(r.decisionIA.titulo, /^Propuesta/);
  assert.equal(r.decisionIA.accionEjecutada, "PROPUESTA_RESERVA_CREADA");
});

test("Normalizar: valida fecha y modo del adaptador de Express", () => {
  const ok = normalizar({
    reporte: "hola",
    usuario: "Ana",
    rol: "DOCENTE",
    fecha: "2026-10-20",
    modo: "PROPUESTA",
    zonaHoraria: "America/Bogota",
  });
  assert.equal(ok.valido, true);
  assert.equal(ok.fecha, "2026-10-20");
  assert.equal(ok.modo, "PROPUESTA");
  const malo = normalizar({
    reporte: "hola",
    usuario: "Ana",
    rol: "DOCENTE",
    fecha: "20/10/2026",
    modo: "BORRAR",
  });
  assert.deepEqual(malo.errores.map((x) => x.campo).sort(), ["fecha", "modo"]);
  assert.equal(
    normalizar({ reporte: "hola", usuario: "Ana", rol: "DOCENTE" }).modo,
    "EJECUCION",
  );
});

test("si Gemini omite horas y asistentes, se leen del texto original", () => {
  const r = motor({
    entrada: entrada({
      reporte: "Reserva la sala Azul hoy de 3 a 5 pm, somos dos personas",
    }),
    estado: estado(),
    ia: ia("RESERVA", { sala: "Azul" }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "RESERVA_CREADA");
  assert.equal(r.plan.ops[0].inicio, iso("15:00"));
  assert.equal(r.plan.ops[0].fin, iso("17:00"));
  assert.equal(r.plan.ops[0].asistentes, 2);
});

test("sin datos en ningún lado: pide exactamente lo que falta", () => {
  const r = motor({
    entrada: entrada({ reporte: "Quiero reservar la sala Azul" }),
    estado: estado(),
    ia: ia("RESERVA", { sala: "Azul" }),
  });
  assert.equal(r.plan.ops.length, 0);
  assert.match(
    r.decisionIA.explicacion,
    /hora de inicio, la hora de fin y el número de asistentes/,
  );
});

test("el error de Gemini informa la causa sin deformar el texto", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: { error: { message: "You exceeded your current quota   status" } },
  });
  assert.equal(r.httpStatus, 503);
  assert.match(
    r.decisionIA.explicacion,
    /You exceeded your current quota status/,
  );
});

test("WhatsApp: responde al teléfono real si hay, o al JID completo si solo hay LID", () => {
  const evo = (key) => ({
    event: "messages.upsert",
    data: { key: { fromMe: false, ...key }, message: { conversation: "hola" } },
  });
  assert.equal(
    normalizar(evo({ remoteJid: "57300@s.whatsapp.net" })).replyTo,
    "57300",
  );
  assert.equal(
    normalizar(
      evo({ remoteJid: "119@lid", remoteJidAlt: "57311@s.whatsapp.net" }),
    ).replyTo,
    "57311",
  );
  assert.equal(normalizar(evo({ remoteJid: "119@lid" })).replyTo, "119@lid");
});

test("CONSULTA de una sala ocupada: dice quién la tiene, cuándo y qué hay libre", () => {
  const e = estado([
    reserva("a", "Azul", "Tomas", "15:00", "17:00", 2, "07:00"),
  ]);
  const r = motor({
    entrada: entrada(),
    estado: e,
    ia: ia("CONSULTA", { sala: "Azul", horaInicio: "15:00", horaFin: "17:00" }),
  });
  assert.equal(r.decisionIA.titulo, "Azul está ocupada");
  assert.match(
    r.decisionIA.explicacion,
    /reservada hoy por Tomas de 15:00 a 17:00/,
  );
  assert.match(r.decisionIA.explicacion, /Libres en ese horario/);
  assert.equal(r.plan.ops.length, 0);
});

test("CONSULTA de una sala libre responde que está libre en ese horario", () => {
  const r = motor({
    entrada: entrada(),
    estado: estado(),
    ia: ia("CONSULTA", { sala: "Azul", horaInicio: "15:00", horaFin: "17:00" }),
  });
  assert.equal(r.decisionIA.titulo, "Azul está libre");
  assert.match(r.decisionIA.explicacion, /libre hoy entre 15:00 - 17:00/);
});

test("CONSULTA de una sala sin horario muestra su agenda del día; en mantenimiento lo indica", () => {
  const e = estado([
    reserva("a", "Cosmos", "Ana", "10:00", "11:00", 10, "07:00"),
    reserva("b", "Cosmos", "Beto", "12:00", "13:00", 10, "07:30"),
  ]);
  const agenda = motor({
    entrada: entrada(),
    estado: e,
    ia: ia("CONSULTA", { sala: "Cosmos" }),
  });
  assert.equal(agenda.decisionIA.titulo, "Agenda de Cosmos");
  assert.match(
    agenda.decisionIA.explicacion,
    /10:00-11:00 Ana; 12:00-13:00 Beto/,
  );
  const mant = motor({
    entrada: entrada(),
    estado: estado([], { Cosmos: "MANTENIMIENTO" }),
    ia: ia("CONSULTA", { sala: "Cosmos" }),
  });
  assert.match(mant.decisionIA.explicacion, /en mantenimiento/);
});

const reservarCosmos = (reporte, extra = {}, estadoBase = estado()) =>
  motor({
    entrada: entrada({ reporte }),
    estado: estadoBase,
    ia: ia("RESERVA", {
      sala: "Cosmos",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 10,
      ...extra,
    }),
  });

test("«mañana» en el texto mueve la reserva al día siguiente y el mensaje lo dice", () => {
  const r = reservarCosmos(
    "Reserva Cosmos para mañana de 10 a 11 para 10 personas",
  );
  assert.equal(
    r.plan.ops[0].inicio,
    new Date("2026-10-17T10:00:00-05:00").toISOString(),
  );
  assert.match(r.decisionIA.explicacion, /el 17\/10/);
  const pasado = reservarCosmos(
    "Reserva Cosmos pasado mañana de 10 a 11 para 10 personas",
  );
  assert.equal(
    pasado.plan.ops[0].inicio,
    new Date("2026-10-18T10:00:00-05:00").toISOString(),
  );
});

test("«de la mañana» es am, no el día siguiente", () => {
  const r = reservarCosmos(
    "Reserva Cosmos hoy de 6 a 8 de la mañana para 10 personas",
    {
      horaInicio: "06:00",
      horaFin: "08:00",
    },
  );
  assert.equal(r.plan.ops[0].inicio, iso("06:00"));
  assert.match(r.decisionIA.explicacion, /hoy/);
});

test("usa la fecha interpretada por la IA y rechaza fechas pasadas", () => {
  const futura = reservarCosmos(
    "Reserva Cosmos el lunes de 10 a 11 para 10 personas",
    {
      fecha: "2026-10-19",
    },
  );
  assert.equal(
    futura.plan.ops[0].inicio,
    new Date("2026-10-19T10:00:00-05:00").toISOString(),
  );
  const pasada = reservarCosmos(
    "Reserva Cosmos el 10 de octubre de 10 a 11 para 10",
    {
      fecha: "2026-10-10",
    },
  );
  assert.equal(pasada.decisionIA.titulo, "Fecha pasada");
  assert.equal(pasada.plan.ops.length, 0);
  const rota = reservarCosmos("Reserva Cosmos", { fecha: "20/10" });
  assert.equal(rota.httpStatus, 503);
});

test("consultar «mañana» no usa las reservas de hoy", () => {
  const hoyOcupado = estado([
    reserva("a", "Azul", "Tomas", "15:00", "17:00", 2, "07:00"),
  ]);
  const r = motor({
    entrada: entrada({
      reporte: "mira si la sala azul está libre mañana de 3 a 5",
    }),
    estado: hoyOcupado,
    ia: ia("CONSULTA", { sala: "Azul", horaInicio: "15:00", horaFin: "17:00" }),
  });
  assert.equal(r.decisionIA.titulo, "Azul está libre");
  assert.match(r.decisionIA.explicacion, /el 17\/10/);
});

test("consultar otro día sin hora: pide el horario en vez de usar la hora actual", () => {
  const r = motor({
    entrada: entrada({ reporte: "y para mañana" }),
    estado: estado(),
    ia: ia("CONSULTA"),
  });
  assert.equal(r.decisionIA.titulo, "Indica el horario");
  assert.match(r.decisionIA.explicacion, /el 17\/10/);
  assert.equal(r.plan.ops.length, 0);
  // Hoy sin hora sigue usando la ventana de la próxima hora.
  const hoy = motor({
    entrada: entrada({ reporte: "qué hay libre" }),
    estado: estado(),
    ia: ia("CONSULTA"),
  });
  assert.equal(hoy.decisionIA.titulo, "Salas disponibles");
});

test("la lista de salas libres dice también cuáles están ocupadas y aclara Azul frente a Azules", () => {
  const e = estado(
    [
      reserva("a", "Azul", "Tomas", "14:00", "15:00", 3, "07:00"),
      reserva("b", "Apolo", "Software", "14:00", "17:00", 34, "06:00"),
    ],
    { Verdes: "MANTENIMIENTO" },
  );
  const r = motor({
    entrada: entrada({
      reporte: "dime que salones estan disponibles de las 2 a las 3",
    }),
    estado: e,
    ia: ia("CONSULTA", { horaInicio: "14:00", horaFin: "15:00" }),
  });
  const texto = r.decisionIA.explicacion;
  assert.doesNotMatch(texto.split("Ocupadas")[0], /Azul \(10\)/);
  assert.match(texto, /Azules \(6\)/);
  assert.match(texto, /Ocupadas en ese horario: Apolo, Azul\./);
  assert.match(texto, /Fuera de servicio: Verdes\./);
  assert.match(texto, /Azul y Azules son salas distintas/);
});

const charla = (reporte, iaResp, extra = {}, est = estado()) =>
  motor({
    entrada: entrada({ reporte, usuario: "Tomas Esteban Gonzalez", ...extra }),
    estado: est,
    ia: iaResp,
  });
const incidenciaInventada = ia("INCIDENCIA", {
  incidencia: {
    existe: true,
    descripcion: "hola",
    prioridad: "LOW",
    areaResponsable: "ADMINISTRATIVA",
    inhabilitaSala: false,
  },
});

test("«hola» se saluda aunque Gemini invente una incidencia; no registra nada", () => {
  const r = charla("hola", incidenciaInventada);
  assert.equal(r.decisionIA.titulo, "¡Hola, Tomas Esteban Gonzalez!");
  assert.match(r.decisionIA.explicacion, /asistente de agenda de CampusFlow/);
  assert.match(r.decisionIA.explicacion, /Responde con un número/);
  assert.match(r.decisionIA.explicacion, /1️⃣ Reservar una sala/);
  assert.equal(r.plan.ops.length, 0);
  assert.equal(r.incidenciaDetectada.existe, false);
  assert.equal(r.ejecucion, "SIN_CAMBIOS");
});

test("un saludo se contesta incluso si Gemini falla (no se llama a la IA para saludar)", () => {
  const r = charla("Buenos días", { error: { message: "503" } });
  assert.equal(r.httpStatus, 200);
  assert.match(r.decisionIA.titulo, /^¡Hola,/);
  assert.equal(r.interpretacionIA.modelo, null);
});

test("«quién soy» dice nombre, tipo de solicitante, que no está verificado y sus reservas", () => {
  const e = estado([
    reserva(
      "a",
      "Azul",
      "Tomas Esteban Gonzalez",
      "14:00",
      "15:00",
      3,
      "07:00",
    ),
  ]);
  const r = charla("quien soy", ia("CONSULTA"), { rol: "DOCENTE" }, e);
  assert.equal(r.decisionIA.titulo, "Tu perfil");
  assert.match(
    r.decisionIA.explicacion,
    /Te veo como Tomas Esteban Gonzalez, solicitante docente/,
  );
  assert.match(r.decisionIA.explicacion, /no está verificado/);
  assert.match(r.decisionIA.explicacion, /Azul hoy de 14:00 a 15:00/);
  const sin = charla("¿quién soy?", ia("CONSULTA"));
  assert.match(sin.decisionIA.explicacion, /No tienes reservas próximas/);
});

test("ayuda, «quién eres» y gracias tienen respuesta propia", () => {
  assert.equal(
    charla("ayuda", ia("CONSULTA")).decisionIA.titulo,
    "Cómo puedo ayudarte",
  );
  assert.equal(
    charla("quién eres?", ia("CONSULTA")).decisionIA.titulo,
    "Soy el asistente de agenda de CampusFlow",
  );
  assert.equal(
    charla("gracias", ia("CONSULTA")).decisionIA.titulo,
    "¡Con gusto!",
  );
});

test("un mensaje sin relación que Gemini marca CONVERSACION recibe la guía de ayuda", () => {
  const r = charla("cuéntame un chiste de gatos", ia("CONVERSACION"));
  assert.equal(r.decisionIA.titulo, "Cómo puedo ayudarte");
  assert.match(r.decisionIA.explicacion, /No tengo claro qué necesitas/);
});

test("saludo con una solicitud real NO es solo conversación: se procesa la reserva", () => {
  const r = charla(
    "hola, reserva la sala Azul hoy de 3 a 5 pm para 2 personas",
    ia("RESERVA", {
      sala: "Azul",
      horaInicio: "15:00",
      horaFin: "17:00",
      asistentes: 2,
    }),
  );
  assert.equal(r.decisionIA.accionEjecutada, "RESERVA_CREADA");
});

test("una «incidencia» sobre un mensaje mínimo se trata como conversación", () => {
  const r = charla("hola?", incidenciaInventada);
  assert.equal(r.plan.ops.length, 0);
  assert.match(r.decisionIA.titulo, /^¡Hola,/);
  const corto = charla("jj", incidenciaInventada);
  assert.equal(corto.plan.ops.length, 0);
  assert.equal(corto.decisionIA.titulo, "Cómo puedo ayudarte");
});

const emergencia = (reporte, iaResp) =>
  motor({
    entrada: entrada({ reporte, usuario: "Emi" }),
    estado: estado(),
    ia: iaResp,
  });
const asepsia = ia("INCIDENCIA", {
  incidencia: {
    existe: true,
    descripcion: "silla sucia",
    prioridad: "CRITICAL",
    areaResponsable: "ASEO",
    inhabilitaSala: false,
  },
});

test("violencia en el texto: se registra CRÍTICO para Seguridad (no Aseo) y se orienta a llamar al 123", () => {
  const r = emergencia(
    "me cagué en una silla y el profe mató un compañero",
    asepsia,
  );
  const incidente = r.plan.ops.find((o) => o.op === "incident");
  assert.equal(incidente.prioridad, "CRITICAL");
  assert.equal(incidente.area, "SEGURIDAD");
  assert.equal(r.decisionIA.titulo, "Aviso de seguridad registrado");
  assert.equal(r.decisionIA.tipoAlerta, "WARNING");
  assert.match(r.decisionIA.explicacion, /123/);
  assert.match(r.decisionIA.explicacion, /no es un canal de emergencias/);
  assert.equal(r.incidenciaDetectada.areaResponsable, "SEGURIDAD");
});

test("la emergencia se atiende aunque Gemini falle o la tome por conversación", () => {
  const caida = emergencia("hay un herido en el auditorio, mucha sangre", {
    error: { message: "503" },
  });
  assert.equal(caida.httpStatus, 200);
  assert.equal(
    caida.plan.ops.find((o) => o.op === "incident").area,
    "SEGURIDAD",
  );
  const charla = emergencia(
    "hola, me hicieron una amenaza",
    ia("CONVERSACION"),
  );
  assert.equal(
    charla.plan.ops.find((o) => o.op === "incident").prioridad,
    "CRITICAL",
  );
});

test("riesgo para la salud mental: Bienestar y mensaje de acompañamiento", () => {
  const r = emergencia("hola, no quiero vivir más", ia("CONSULTA"));
  assert.equal(r.plan.ops.find((o) => o.op === "incident").area, "BIENESTAR");
  assert.match(r.decisionIA.explicacion, /Lamento que estés pasando por esto/);
  assert.match(r.decisionIA.explicacion, /123/);
});

test("fuego o humo en una sala: Seguridad y la sala se nombra desde el texto", () => {
  const r = emergencia("sale humo del salón Cosmos", ia("CONSULTA"));
  const incidente = r.plan.ops.find((o) => o.op === "incident");
  assert.equal(incidente.area, "SEGURIDAD");
  assert.equal(incidente.sala, "Cosmos");
});

test("un daño normal no dispara la guía de emergencia y el mensaje repite lo entendido", () => {
  const r = motor({
    entrada: entrada({ reporte: "El proyector de la sala Skilab no funciona" }),
    estado: estado(),
    ia: ia("INCIDENCIA", {
      sala: "Skilab",
      incidencia: {
        existe: true,
        descripcion: "El proyector de Skilab no funciona",
        prioridad: "LOW",
        areaResponsable: "TECNOLOGIA",
        inhabilitaSala: false,
      },
    }),
  });
  assert.equal(r.decisionIA.titulo, "Incidencia registrada");
  assert.doesNotMatch(r.decisionIA.explicacion, /123/);
  assert.match(
    r.decisionIA.explicacion,
    /«El proyector de Skilab no funciona»/,
  );
  assert.match(r.decisionIA.explicacion, /área Tecnología/);
});

test("palabras parecidas sin riesgo real (mate, matemáticas) no activan la emergencia", () => {
  const r = emergencia(
    "quiero reservar para la clase de matemáticas con mate",
    ia("CONSULTA"),
  );
  assert.equal(r.plan.ops.length, 0);
});

test("bromas, insultos y mensajes sin relación: «no corresponde a este chat» y no se registra nada", () => {
  for (const [texto, respuestaIA] of [
    ["me cagué en una silla", asepsia],
    ["eres un idiota", ia("CONSULTA")],
    ["hola marica", ia("CONVERSACION")],
    ["cuéntame un chiste de gatos", ia("FUERA_DE_ALCANCE")],
  ]) {
    const r = emergencia(texto, respuestaIA);
    assert.equal(r.decisionIA.titulo, "Mensaje fuera de este chat", texto);
    assert.match(r.decisionIA.explicacion, /no corresponde a este chat/);
    assert.equal(r.plan.ops.length, 0, texto);
    assert.equal(r.incidenciaDetectada.existe, false);
  }
});

test("una vulgaridad dentro de una solicitud real de salas no la bloquea", () => {
  const r = motor({
    entrada: entrada({
      reporte: "puta, necesito la sala Azul hoy de 3 a 5 pm para 2 personas",
    }),
    estado: estado(),
    ia: ia("RESERVA", {
      sala: "Azul",
      horaInicio: "15:00",
      horaFin: "17:00",
      asistentes: 2,
    }),
  });
  assert.equal(r.decisionIA.accionEjecutada, "RESERVA_CREADA");
});

test("si además hay violencia, gana la emergencia y se aclara que el chat no es canal de emergencias", () => {
  const r = emergencia(
    "me cagué en una silla y el profe mató un compañero",
    ia("FUERA_DE_ALCANCE"),
  );
  assert.equal(r.decisionIA.titulo, "Aviso de seguridad registrado");
  assert.match(
    r.decisionIA.explicacion,
    /Este chat es solo para gestionar salas/,
  );
  assert.equal(r.plan.ops.find((o) => o.op === "incident").area, "SEGURIDAD");
});

const clasificar = (reporte, estadoBase = estado()) =>
  new Function("$", codigo("Clasificar Mensaje"))((n) => ({
    first: () => ({
      json: {
        "Normalizar Entrada": entrada({ reporte }),
        "Leer Estado": { estado: estadoBase },
      }[n],
    }),
  }))[0].json;

test("el menú numerado: cada opción responde con su guía y la 4 lista las reservas propias", () => {
  const guia = (n) => charla(String(n), ia("CONSULTA"));
  assert.equal(guia(1).decisionIA.titulo, "Reservar una sala");
  assert.match(
    guia(1).decisionIA.explicacion,
    /Reserva la sala Azul mañana de 3 a 5 pm para 2 personas/,
  );
  assert.equal(guia(2).decisionIA.titulo, "Reportar una incidencia");
  assert.match(guia(2).decisionIA.explicacion, /en qué sala/);
  assert.equal(guia(3).decisionIA.titulo, "Ver salas libres");
  const e = estado([
    reserva(
      "a",
      "Azul",
      "Tomas Esteban Gonzalez",
      "14:00",
      "15:00",
      3,
      "07:00",
    ),
  ]);
  const mis = charla("4", ia("CONSULTA"), {}, e);
  assert.equal(mis.decisionIA.titulo, "Mis reservas");
  assert.match(mis.decisionIA.explicacion, /Azul hoy de 14:00 a 15:00/);
  assert.equal(
    charla("mis reservas", ia("CONSULTA")).decisionIA.explicacion,
    "No tienes reservas próximas a tu nombre.",
  );
  for (const palabra of ["reservar", "incidencia", "disponibilidad"]) {
    assert.equal(guia(palabra).plan.ops.length, 0);
  }
  assert.equal(
    charla("reservar", ia("RESERVA")).decisionIA.titulo,
    "Reservar una sala",
  );
});

test("el clasificador deja pasar a la IA solo lo que no se resuelve con reglas fijas", () => {
  for (const local of [
    "hola",
    "1",
    "quien soy",
    "gracias",
    "eres un idiota",
    "el profe mató a alguien",
    "ayuda",
  ]) {
    assert.ok(clasificar(local).clase, local);
  }
  for (const conIA of [
    "Necesito Apolo hoy de 3 a 5 pm para 20 personas",
    "El proyector de Skilab no funciona",
    "mira si puedo reservar para mañana",
    "La clase en Cosmos se extiende hasta las 11:30",
  ]) {
    assert.equal(clasificar(conIA).clase, null, conIA);
  }
});

test("«¿puedo reservar…?» es una pregunta: responde la disponibilidad aunque la IA diga RESERVA", () => {
  const e = estado([
    reserva("a", "Apolo", "Software · Apolo", "06:00", "09:00", 34, "06:00"),
  ]);
  const r = motor({
    entrada: entrada({
      reporte: "puedo reservar el salon apolo de 6 am a 8 am",
    }),
    estado: e,
    ia: ia("RESERVA", { sala: "Apolo", horaInicio: "06:00", horaFin: "08:00" }),
  });
  assert.equal(r.decisionIA.titulo, "Apolo está ocupada");
  assert.equal(r.plan.ops.length, 0);
  // Una orden directa sigue siendo reserva.
  const orden = motor({
    entrada: entrada({
      reporte: "reserva el salon apolo de 10 am a 11 am para 5 personas",
    }),
    estado: e,
    ia: ia("RESERVA", {
      sala: "Apolo",
      horaInicio: "10:00",
      horaFin: "11:00",
      asistentes: 5,
    }),
  });
  assert.equal(orden.decisionIA.accionEjecutada, "RESERVA_CREADA");
});

test("la respuesta de Groq (formato OpenAI) se entiende igual que la de Gemini; un 429 cae al respaldo", () => {
  const groq = {
    model: "openai/gpt-oss-20b",
    choices: [
      {
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            intencion: "CONSULTA",
            sala: null,
            horaInicio: "14:00",
            horaFin: "16:00",
            fecha: null,
            asistentes: 10,
            incidencia: {
              existe: false,
              descripcion: null,
              prioridad: "NONE",
              areaResponsable: null,
              inhabilitaSala: false,
            },
          }),
        },
      },
    ],
  };
  const ok = motor({
    entrada: entrada({ reporte: "libres de 2 a 4 para 10" }),
    estado: estado(),
    ia: groq,
  });
  assert.equal(ok.decisionIA.titulo, "Salas disponibles");
  assert.equal(ok.interpretacionIA.modelo, "openai/gpt-oss-20b");
  const cortada = {
    model: "m",
    choices: [
      { finish_reason: "length", message: { content: '{"intencion":"RES' } },
    ],
  };
  const mala = motor({
    entrada: entrada({ reporte: "algo" }),
    estado: estado(),
    ia: cortada,
  });
  assert.equal(mala.httpStatus, 503);
  assert.match(mala.decisionIA.explicacion, /finishReason: length/);
});

const porWhatsapp = (reporte, iaResp, estadoBase = estado()) =>
  motor({
    entrada: entrada({
      canal: "whatsapp",
      replyTo: "57300",
      reporte,
      usuario: "Tomas Esteban Gonzalez",
    }),
    estado: estadoBase,
    ia: iaResp,
  });

test("por WhatsApp, tras una gestión terminada se ofrece otra actividad con el menú", () => {
  const incidencia = porWhatsapp(
    "El proyector de Skilab no funciona",
    ia("INCIDENCIA", {
      sala: "Skilab",
      incidencia: {
        existe: true,
        descripcion: "El proyector de Skilab no funciona",
        prioridad: "MEDIUM",
        areaResponsable: "TECNOLOGIA",
        inhabilitaSala: false,
      },
    }),
  );
  assert.match(
    incidencia.decisionIA.explicacion,
    /Una persona del equipo lo revisará\./,
  );
  assert.match(
    incidencia.decisionIA.explicacion,
    /¿Quieres hacer otra actividad\? Responde con un número:\n1️⃣ Reservar una sala\n2️⃣ Reportar una incidencia/,
  );
  const reservaOk = porWhatsapp(
    "reserva la sala Azul hoy de 3 a 5 pm para 2 personas",
    ia("RESERVA", {
      sala: "Azul",
      horaInicio: "15:00",
      horaFin: "17:00",
      asistentes: 2,
    }),
  );
  assert.equal(reservaOk.decisionIA.accionEjecutada, "RESERVA_CREADA");
  assert.match(
    reservaOk.decisionIA.explicacion,
    /¿Quieres hacer otra actividad\?/,
  );
  const ocupada = porWhatsapp(
    "mira si azul está libre de 3 a 5",
    ia("CONSULTA", { sala: "Azul", horaInicio: "15:00", horaFin: "17:00" }),
    estado([reserva("x", "Azul", "Ana", "15:00", "16:00", 3, "07:00")]),
  );
  assert.match(ocupada.decisionIA.explicacion, /está reservada hoy por Ana/);
  assert.match(
    ocupada.decisionIA.explicacion,
    /¿Quieres hacer otra actividad\?/,
  );
  const fuera = porWhatsapp(
    "cuéntame un chiste de gatos",
    ia("FUERA_DE_ALCANCE"),
  );
  assert.match(fuera.decisionIA.explicacion, /no corresponde a este chat/);
  assert.match(fuera.decisionIA.explicacion, /¿Quieres hacer otra actividad\?/);
});

test("no se ofrece el menú cuando faltan datos, en emergencias ni en la interfaz web", () => {
  assert.doesNotMatch(
    porWhatsapp("reserva la sala Azul", ia("RESERVA", { sala: "Azul" }))
      .decisionIA.explicacion,
    /otra actividad/,
  );
  const emergencia = porWhatsapp(
    "el profe mató a un compañero",
    ia("CONSULTA"),
  );
  assert.equal(emergencia.decisionIA.titulo, "Aviso de seguridad registrado");
  assert.doesNotMatch(emergencia.decisionIA.explicacion, /otra actividad/);
  const web = motor({
    entrada: entrada({
      canal: "frontend",
      reporte: "reserva la sala Azul hoy de 3 a 5 pm para 2 personas",
    }),
    estado: estado(),
    ia: ia("RESERVA", {
      sala: "Azul",
      horaInicio: "15:00",
      horaFin: "17:00",
      asistentes: 2,
    }),
  });
  assert.doesNotMatch(web.decisionIA.explicacion, /otra actividad/);
});

test("si la IA falla, por WhatsApp se responde con un mensaje claro y el menú (que no necesita IA)", () => {
  const r = porWhatsapp("necesito una sala para hacer algo", {
    error: { message: "The connection was aborted" },
  });
  assert.equal(r.httpStatus, 503);
  assert.match(
    r.decisionIA.explicacion,
    /No pude interpretar tu mensaje en este momento/,
  );
  assert.match(r.decisionIA.explicacion, /1️⃣ Reservar una sala/);
  assert.doesNotMatch(r.decisionIA.explicacion, /connection was aborted/);
  assert.equal(r.plan.ops.length, 0);
});

test("el texto de las opciones del menú escrito a mano también funciona sin IA, y «0» vuelve al menú", () => {
  for (const [texto, titulo] of [
    ["Ver qué salas hay libres", "Ver salas libres"],
    ["Reservar una sala", "Reservar una sala"],
    ["Reportar una incidencia", "Reportar una incidencia"],
    ["Ver mis reservas", "Mis reservas"],
    ["0", "Menú"],
    ["menú", "Menú"],
  ]) {
    const r = porWhatsapp(texto, { error: { message: "IA caída" } });
    assert.equal(r.decisionIA.titulo, titulo, texto);
    assert.equal(r.httpStatus, 200, texto);
  }
});
