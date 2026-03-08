-- AlterTable: add google_sub to users
ALTER TABLE "users" ADD COLUMN "google_sub" TEXT;

-- CreateIndex: unique constraint on google_sub
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");
