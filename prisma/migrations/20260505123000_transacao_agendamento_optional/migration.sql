-- Transações avulsas (sem agendamento) e vínculo opcional 1:1 com agendamento
ALTER TABLE "transacoes" ALTER COLUMN "agendamentoId" DROP NOT NULL;
