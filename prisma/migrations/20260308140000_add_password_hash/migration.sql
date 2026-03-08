-- AlterTable: add password_hash column to users (nullable for social login compatibility)
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
