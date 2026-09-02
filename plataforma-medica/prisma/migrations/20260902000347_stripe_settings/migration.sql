-- CreateTable
CREATE TABLE "StripeSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "secretKeyEncrypted" TEXT,
    "publishableKey" TEXT,
    "webhookSecretEncrypted" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "StripeSettings_pkey" PRIMARY KEY ("id")
);
