-- Remove notificações COMMENT antes de alterar o enum
DELETE FROM "notification_recipients"
WHERE "notificationId" IN (
  SELECT "id" FROM "notifications" WHERE "type"::text = 'COMMENT'
);

DELETE FROM "notifications" WHERE "type"::text = 'COMMENT';

-- Recria enum NotificationType sem COMMENT
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";

CREATE TYPE "NotificationType" AS ENUM (
  'REMINDER',
  'STATUS_CHANGED',
  'APPOINTMENT',
  'FINANCE',
  'PATIENT',
  'SYSTEM',
  'MESSAGE'
);

ALTER TABLE "notifications"
  ALTER COLUMN "type" TYPE "NotificationType"
  USING ("type"::text::"NotificationType");

DROP TYPE "NotificationType_old";

-- Tarefas manuais do dashboard
CREATE TYPE "UserTaskStatus" AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE "UserTaskPriority" AS ENUM ('low', 'medium', 'high');

CREATE TABLE "user_tasks" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueAt" TIMESTAMPTZ(6) NOT NULL,
  "status" "UserTaskStatus" NOT NULL DEFAULT 'pending',
  "priority" "UserTaskPriority" NOT NULL DEFAULT 'medium',
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "user_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_tasks_userId_dueAt_idx" ON "user_tasks"("userId", "dueAt");
CREATE INDEX "user_tasks_status_dueAt_idx" ON "user_tasks"("status", "dueAt");

ALTER TABLE "user_tasks"
  ADD CONSTRAINT "user_tasks_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
