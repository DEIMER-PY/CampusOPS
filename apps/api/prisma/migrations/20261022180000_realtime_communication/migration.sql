-- CreateEnum
CREATE TYPE "app_private"."MessagePriority" AS ENUM ('NORMAL', 'URGENT');

-- CreateTable
CREATE TABLE "app_private"."CommunicationChannel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isBroadcastOnly" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT NOT NULL DEFAULT 'hash',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_private"."ChannelMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channelId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'Usuario',
    "authorRole" "app_private"."Role" NOT NULL DEFAULT 'CLIENT',
    "content" TEXT NOT NULL,
    "priority" "app_private"."MessagePriority" NOT NULL DEFAULT 'NORMAL',
    "mentions" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationChannel_slug_key" ON "app_private"."CommunicationChannel"("slug");

-- CreateIndex
CREATE INDEX "ChannelMessage_channelId_createdAt_idx" ON "app_private"."ChannelMessage"("channelId", "createdAt");

-- AddForeignKey
ALTER TABLE "app_private"."ChannelMessage" ADD CONSTRAINT "ChannelMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "app_private"."CommunicationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_private"."ChannelMessage" ADD CONSTRAINT "ChannelMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "app_private"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Grant permissions to campusflow_runtime
GRANT SELECT, INSERT, UPDATE, DELETE ON "app_private"."CommunicationChannel", "app_private"."ChannelMessage" TO campusflow_runtime;

-- Insert initial official channels
INSERT INTO "app_private"."CommunicationChannel" ("slug", "name", "description", "isBroadcastOnly", "icon")
VALUES
  ('avisos-generales', 'Avisos Generales', 'Comunicados prioritarios y eventos oficiales para todo el campus.', true, 'megaphone'),
  ('formacion', 'Formación y Aulas', 'Coordinación académica entre trainers, campers y docentes.', false, 'graduation-cap'),
  ('co-working', 'Co-working y Estudio', 'Espacios compartidos, puestos individuales y convivencia.', false, 'briefcase'),
  ('marketing-alianzas', 'Marketing y Eventos', 'Visitas corporativas, alianzas tecnológicas y auditorio.', false, 'target'),
  ('soporte-tecnico', 'Soporte e Infraestructura', 'Reporte y coordinación rápida de equipos, conectividad y proyectores.', false, 'wrench')
ON CONFLICT ("slug") DO NOTHING;
