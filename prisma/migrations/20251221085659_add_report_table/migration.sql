-- CreateTable
CREATE TABLE "Report" (
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("reportId")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("campaignId") ON DELETE CASCADE ON UPDATE CASCADE;
