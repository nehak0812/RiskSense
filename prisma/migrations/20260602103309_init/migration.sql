-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "geographies" TEXT NOT NULL,
    "commodities" TEXT NOT NULL,
    "peers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RiskAppetite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "appetiteThreshold" REAL NOT NULL,
    "setBy" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    CONSTRAINT "RiskAppetite_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "entities" TEXT NOT NULL,
    "regulations" TEXT NOT NULL,
    "geographies" TEXT NOT NULL,
    "embeddingString" TEXT,
    "confidence" REAL NOT NULL,
    "sourcesCited" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SignalMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL,
    "linkedRiskIds" TEXT NOT NULL,
    "matchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignalMatch_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SignalMatch_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ownerRole" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "inherentRating" TEXT NOT NULL,
    "controlEffectiveness" TEXT NOT NULL,
    "residualRating" TEXT NOT NULL,
    "appetiteStatus" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "trendDirection" TEXT NOT NULL,
    "trendValue" REAL NOT NULL,
    "horizon" TEXT NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "peerGap" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" DATETIME NOT NULL,
    "nextReviewAt" DATETIME NOT NULL,
    CONSTRAINT "Risk_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskScoreHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riskId" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    "score" REAL NOT NULL,
    "sentiment" TEXT NOT NULL,
    CONSTRAINT "RiskScoreHistory_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KRI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "currentValue" REAL NOT NULL,
    "breached" BOOLEAN NOT NULL,
    CONSTRAINT "KRI_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeerDisclosure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "peerName" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "disclosed" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    CONSTRAINT "PeerDisclosure_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "owner" TEXT NOT NULL,
    CONSTRAINT "Action_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoardPack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "posture" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" TEXT NOT NULL,
    CONSTRAINT "BoardPack_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Signal_url_key" ON "Signal"("url");
