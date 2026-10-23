# Arquitectura Comercial CampusOPS Enterprise SaaS

## 1. Visión y Ecosistema Campuslands

CampusOPS evoluciona CampusFlow para convertirse en una plataforma SaaS B2B/B2Institution que conecta:
1. **Dirección General & Administración Central**: Control global, auditoría forense inmutable y analítica de uso.
2. **Sedes Físicas (Campus Branches)**: Bucaramanga (Zona Franca / Cabecera), Medellín, Bogotá y futuras sedes, cada una con sus aulas, aforos e inventarios tecnológicos segregados.
3. **Red de Empresas Aliadas (Hiring Partners & Patrocinadores)**: Empresas que patrocinan campers, financian laboratorios o contratan egresados, con un portal exclusivo para reservar salas de entrevistas técnicas, hackathons o demo days bajo cuotas de uso (*internal chargeback*).
4. **Comunidad Académica**: Coordinación académica, trainers y campers con asignación de espacios según su ruta formativa (Inteligencia Artificial, Cloud & DevOps, Fullstack, Ciberseguridad, Soft Skills).

---

## 2. Jerarquía de Roles y Matriz de Acceso (RBAC / ABAC)

| Rol | Nivel | Alcance | Capacidades Principales |
|---|---|---|---|
| `SUPER_ADMIN` | 100 | Multi-Tenant Global | Gestión de organizaciones, facturación SaaS, auditoría transversal |
| `ADMIN` | 90 | Institución / Campus | Altas de sedes, creación de aulas/recursos, visualización de auditoría |
| `CAMPUS_DIRECTOR` | 80 | Sede Específica | Aprobación de reservas sobre cuota (HITL), cuarentenas CMMS |
| `ACADEMIC_COORDINATOR` | 60 | Sede / Cohortes | Programación de cohortes, matching de aulas por ruta de aprendizaje |
| `IT_OPERATOR` / `OPERATOR` | 50 | Sede / Inventario | Préstamos, inspección física y firma de actas digitales Ley 527 |
| `PARTNER_REPRESENTATIVE` | 40 | Empresa Aliada | Reserva de salas de entrevista/demo days dentro de su cuota mensual |
| `TRAINER` | 30 | Cohorte Asignada | Solicitud de espacios y recursos para clases, reporte de incidencias |
| `CAMPER` / `CLIENT` | 10 | Personal | Consulta de agenda, préstamo de laptops con firma de acta, reportes |

---

## 3. Marco Jurídico Colombiano y Ciberseguridad

### 3.1 Protección de Datos Personales (Ley Estatutaria 1581 de 2012)
- **Consentimiento Inmutable (`ConsentLog`)**: Registro de versión de política, finalidades aceptadas, IP y fecha.
- **Protección Reforzada para Menores de Edad (Campers de 16 y 17 años)**: En estricto cumplimiento del Artículo 7 de la Ley 1581, el sistema exige el correo del acudiente/tutor legal (`guardianEmail`) para habilitar préstamos de computadores o participación en dinámicas con empresas aliadas.
- **Sanitización de PII ante IA**: Todo texto enviado a Groq u OpenAI pasa por un filtro de expresiones regulares que reemplaza números de Cédula de Ciudadanía (CC), teléfonos colombianos (+57 3xx) y correos personales por tokens opacos (`[DOCUMENTO_PROTEGIDO]`, `[TELEFONO_PROTEGIDO]`).

### 3.2 Actas Digitales con Plena Validez Probatoria (Ley 527 de 1999)
- Los préstamos de portátiles institucionales generan un documento electrónico inmutable (`DigitalActa`).
- Se calcula la huella criptográfica SHA-256 sobre el texto canónico del acta (serial, accesorios, estado físico, cláusulas de custodia y fecha UTC).
- La firma se autentica mediante código OTP de 6 dígitos verificado por el servidor, garantizando **integridad y no-repudio**.

### 3.3 Auditoría Forense Criptográfica (Tamper-Evident Chain)
- Los eventos de `AuditEvent` incorporan `previousHash` y `hash` encadenados.
- Si un usuario con credenciales privilegiadas modifica o borra una fila en la base de datos, la función `verifyAuditChain()` detecta de inmediato la alteración y el índice exacto de la vulneración.

---

## 4. Reglas de Negocio Avanzadas

### 4.1 Asignación Inteligente de Aulas por Ruta Formativa
- `validateSpaceForLearningPath`: Valida que la ruta de **Inteligencia Artificial** solo se asigne a salones con al menos 80% de estaciones con aceleración GPU (ej. aula *Apolo* o *Cosmos*), la ruta de **Ciberseguridad** a laboratorios con subred aislada, y los talleres de **Soft Skills** a espacios con mesas modulares.

### 4.2 CMMS y Mantenimiento Predictivo
- `evaluateBatchHealth`: Monitorea la tasa de fallas por lote de hardware. Si una partida de portátiles o cargadores supera el 15% de reportes o acumula 2 fallas críticas, el sistema decreta **cuarentena preventiva**, bloquea préstamos de ese lote y prepara el borrador de garantía mayorista (RMA).

### 4.3 Control de Cuotas y Facturación Interna (Internal Chargeback)
- `checkOrganizationQuota`: Gestiona un cupo mensual de horas en espacios premium para cada empresa aliada o departamento. Reservas que excedan la cuota pasan a estado de propuesta sujeta a la aprobación del Director de Campus (*Human-in-the-Loop*).
