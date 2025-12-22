-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "targetLatitude" DOUBLE PRECISION,
ADD COLUMN     "targetLongitude" DOUBLE PRECISION,
ADD COLUMN     "targetRadiusKm" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "pointsBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Follow_vendorId_idx" ON "Follow"("vendorId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_vendorId_key" ON "Follow"("followerId", "vendorId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
