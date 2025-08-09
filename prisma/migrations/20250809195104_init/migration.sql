-- CreateTable
CREATE TABLE "public"."AssistantProfile" (
    "id" TEXT NOT NULL DEFAULT 'public',
    "name" TEXT NOT NULL DEFAULT 'G•One',
    "avatarUrl" TEXT,
    "avatarBase64" TEXT,
    "personality" TEXT NOT NULL DEFAULT 'neutro',
    "model" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantProfile_pkey" PRIMARY KEY ("id")
);
