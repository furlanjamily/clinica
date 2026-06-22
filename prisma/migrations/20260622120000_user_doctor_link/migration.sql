-- AlterTable
ALTER TABLE "users" ADD COLUMN "doctorId" INTEGER;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "users_doctorId_idx" ON "users"("doctorId");
