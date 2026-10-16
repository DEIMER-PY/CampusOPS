# Procedencia del catálogo

Fuente suministrada por el usuario: CONTRATO_N8N_FRONTEND.md, sección 4.A, Catálogo Oficial de Salas. Contiene once espacios y aforos, incluido Azules (6), ausente en la transcripción anterior de diez filas. La guía oficial define la evaluación pero no contiene el inventario privado completo del evento.

spaces.csv contiene nombres y aforos de ese contrato. DISABLED significa que no se ha confirmado habilitación, no un diagnóstico físico de avería. Los ejemplos JSON del contrato muestran disponibilidad ilustrativa y no se importan como reservas reales. Los campos mixto/estudio del contrato no bastan para inferir reglas adicionales no definidas.

Importación: npm run db:import-spaces -w @campusflow/api. Se valida archivo completo, aforos positivos, estados, duplicados y conflictos de capacidad antes de confirmar una transacción. No sobreescribe estados ni aforos existentes. Inventario tecnológico y casos borde privados de la organización siguen pendientes de recepción. Datos sintéticos de pruebas solo en campusflow_test aislada, nunca como registros de demostración reales.
