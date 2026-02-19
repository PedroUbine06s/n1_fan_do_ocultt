-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "matchId" TEXT NOT NULL,
    "win" BOOLEAN NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "championName" TEXT NOT NULL,
    "lp" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_matchId_key" ON "Match"("matchId");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");

-- CreateIndex
CREATE INDEX "Match_matchId_idx" ON "Match"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_phone_key" ON "Recipient"("phone");

-- CreateIndex
CREATE INDEX "Recipient_phone_idx" ON "Recipient"("phone");
