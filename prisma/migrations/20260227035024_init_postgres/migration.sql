-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "presetSlugs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicPreset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultAiTopN" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicKeyword" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "TopicKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "activePresetId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "mode" TEXT NOT NULL DEFAULT 'collect_only',
    "windowHours" INTEGER NOT NULL DEFAULT 24,
    "presetId" TEXT,
    "aiRequested" BOOLEAN NOT NULL DEFAULT false,
    "aiUsed" BOOLEAN NOT NULL DEFAULT false,
    "aiTopN" INTEGER NOT NULL DEFAULT 20,
    "aiCalls" INTEGER NOT NULL DEFAULT 0,
    "aiTokensEst" INTEGER NOT NULL DEFAULT 0,
    "aiCostEstKrw" INTEGER NOT NULL DEFAULT 0,
    "summaryJson" TEXT,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT,
    "contentText" TEXT,
    "hash" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Judgment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isLifeImpact" BOOLEAN NOT NULL,
    "impactCategory" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "whoAffectedJson" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "whatToDoJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "gptScore" INTEGER NOT NULL,
    "rawJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Judgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "ruleScore" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "reasonsJson" TEXT NOT NULL,
    "rank" INTEGER,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_sourceId_key" ON "Source"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicPreset_slug_key" ON "TopicPreset"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TopicKeyword_presetId_group_keyword_key" ON "TopicKeyword"("presetId", "group", "keyword");

-- CreateIndex
CREATE UNIQUE INDEX "Item_url_key" ON "Item"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Judgment_itemId_key" ON "Judgment"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_runId_itemId_key" ON "Candidate"("runId", "itemId");

-- AddForeignKey
ALTER TABLE "TopicKeyword" ADD CONSTRAINT "TopicKeyword_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "TopicPreset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_activePresetId_fkey" FOREIGN KEY ("activePresetId") REFERENCES "TopicPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "TopicPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Judgment" ADD CONSTRAINT "Judgment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
