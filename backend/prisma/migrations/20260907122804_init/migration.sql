-- CreateEnum
CREATE TYPE "Status" AS ENUM ('AUTO_REJECTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('CRUD', 'NUMBER', 'FORMATTING_COMMAND', 'SPELLED_OUT', 'NAMED_ENTITY', 'MEDICAL_TERM', 'MEASUREMENT');

-- CreateTable
CREATE TABLE "AudioItem" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "annotator" TEXT,
    "sampleRate" INTEGER,
    "channels" INTEGER,
    "bitDepth" INTEGER,
    "wordsPerMinute" DOUBLE PRECISION,
    "distanceEstimate" DOUBLE PRECISION,
    "isConditionOverridden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "audioItemId" TEXT,
    "originalLabel" TEXT NOT NULL,
    "correctedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "attributes" JSONB NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioItem_filename_key" ON "AudioItem"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_audioItemId_key" ON "Transcript"("audioItemId");

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_audioItemId_fkey" FOREIGN KEY ("audioItemId") REFERENCES "AudioItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
