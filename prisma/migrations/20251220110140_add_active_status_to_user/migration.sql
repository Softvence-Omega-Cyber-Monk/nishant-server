-- CreateEnum
CREATE TYPE "UserActiveStatus" AS ENUM ('ACTIVE', 'BANNED', 'FLAGGED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activeStatus" "UserActiveStatus" NOT NULL DEFAULT 'ACTIVE';
