-- AlterTable
ALTER TABLE "public"."bolos" ADD COLUMN     "criadoPorAdminId" VARCHAR(36);

-- AlterTable
ALTER TABLE "public"."pedidos" ADD COLUMN     "gerenciadoPorAdminId" VARCHAR(36);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "nivel" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- AddForeignKey
ALTER TABLE "public"."bolos" ADD CONSTRAINT "bolos_criadoPorAdminId_fkey" FOREIGN KEY ("criadoPorAdminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedidos" ADD CONSTRAINT "pedidos_gerenciadoPorAdminId_fkey" FOREIGN KEY ("gerenciadoPorAdminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
