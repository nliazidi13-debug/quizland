-- CreateTable
CREATE TABLE "DuelMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "domainsJson" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "questionIdsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DuelParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "score" INTEGER,
    "xp" INTEGER,
    "timeSeconds" INTEGER,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "DuelParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "DuelMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DuelParticipant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DuelParticipant_matchId_profileId_key" ON "DuelParticipant"("matchId", "profileId");
