-- Pacientes: novos campos, migra texto antigo, remove coluna legada
ALTER TABLE "pacientes" ADD COLUMN "cep" TEXT;
ALTER TABLE "pacientes" ADD COLUMN "logradouro" TEXT;
ALTER TABLE "pacientes" ADD COLUMN "numero" TEXT;
ALTER TABLE "pacientes" ADD COLUMN "complemento" TEXT;
ALTER TABLE "pacientes" ADD COLUMN "bairro" TEXT;
ALTER TABLE "pacientes" ADD COLUMN "cidade" TEXT;
ALTER TABLE "pacientes" ADD COLUMN "uf" TEXT;

UPDATE "pacientes" SET "logradouro" = "endereco" WHERE "endereco" IS NOT NULL AND TRIM("endereco") <> '';

ALTER TABLE "pacientes" DROP COLUMN "endereco";

-- Médicos (nome da tabela padrão Prisma: Medico)
ALTER TABLE "Medico" ADD COLUMN "cep" TEXT;
ALTER TABLE "Medico" ADD COLUMN "logradouro" TEXT;
ALTER TABLE "Medico" ADD COLUMN "numero" TEXT;
ALTER TABLE "Medico" ADD COLUMN "complemento" TEXT;
ALTER TABLE "Medico" ADD COLUMN "bairro" TEXT;
ALTER TABLE "Medico" ADD COLUMN "cidade" TEXT;
ALTER TABLE "Medico" ADD COLUMN "uf" TEXT;

UPDATE "Medico" SET "logradouro" = "endereco" WHERE "endereco" IS NOT NULL AND TRIM("endereco") <> '';

ALTER TABLE "Medico" DROP COLUMN "endereco";
