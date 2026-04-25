-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ptts_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptts_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptts_assets" (
    "id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "power_kw" DOUBLE PRECISION DEFAULT 0,
    "foundation_type" TEXT DEFAULT 'rigid',
    "vib_limit_warning" DOUBLE PRECISION,
    "vib_limit_fault" DOUBLE PRECISION,
    "organization_id" TEXT DEFAULT 'demo-mode',
    "organization_name" TEXT DEFAULT 'Live Demo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ptts_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptts_telemetry" (
    "id" BIGSERIAL NOT NULL,
    "asset_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temp" DOUBLE PRECISION,
    "vib_overall" DOUBLE PRECISION,
    "vib_rms" DOUBLE PRECISION,
    "vib_velocity" DOUBLE PRECISION,
    "vib_freq" DOUBLE PRECISION,
    "motor_kw" DOUBLE PRECISION,
    "motor_current" DOUBLE PRECISION,
    "raw_payload" JSONB,

    CONSTRAINT "ptts_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptts_alarms" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "alarm_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" TEXT,
    "ack_comment" TEXT,

    CONSTRAINT "ptts_alarms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptts_system_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "api_keys" JSONB NOT NULL DEFAULT '{}',
    "telegram_token" TEXT,
    "telegram_chat_id" TEXT,
    "whatsapp_api_url" TEXT,
    "whatsapp_token" TEXT,
    "is_notify_enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ptts_system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ptts_users_username_key" ON "ptts_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ptts_assets_tag_id_key" ON "ptts_assets"("tag_id");

-- CreateIndex
CREATE INDEX "ptts_telemetry_asset_id_timestamp_idx" ON "ptts_telemetry"("asset_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "ptts_alarms_acknowledged_at_idx" ON "ptts_alarms"("acknowledged_at");

-- CreateIndex
CREATE INDEX "ptts_alarms_asset_id_idx" ON "ptts_alarms"("asset_id");

-- AddForeignKey
ALTER TABLE "ptts_telemetry" ADD CONSTRAINT "ptts_telemetry_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "ptts_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptts_alarms" ADD CONSTRAINT "ptts_alarms_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "ptts_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

