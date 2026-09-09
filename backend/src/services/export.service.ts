import { prisma } from '../lib/prisma.js';

interface ExportLine {
  audio: {
    id: string;
    filename: string;
    duration: number;
  };
  originalTranscript: string;
  correctedTranscript: string;
  annotations: Array<{
    id: string;
    text: string;
    startOffset: number;
    endOffset: number;
    startTime: number;
    endTime: number;
    type: string;
    attributes: Record<string, unknown>;
  }>;
  recordingConditions: {
    sampleRate: number | null;
    channels: number | null;
    bitDepth: number | null;
    wordsPerMinute: number | null;
    distanceEstimate: number | null;
    isConditionOverridden: boolean;
  };
}

export async function getExportLines(): Promise<ExportLine[]> {
  const items = await prisma.audioItem.findMany({
    where: {
      transcript: {
        isNot: null,
      },
      status: 'READY',
    },
    include: {
      transcript: {
        include: {
          annotations: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => ({
    audio: {
      id: item.id,
      filename: item.filename,
      duration: item.duration,
    },
    originalTranscript: item.transcript!.originalLabel,
    correctedTranscript: item.transcript!.correctedText,
    annotations: item.transcript!.annotations.map((a) => ({
      id: a.id,
      text: a.text,
      startOffset: a.startOffset,
      endOffset: a.endOffset,
      startTime: a.startTime,
      endTime: a.endTime,
      type: a.type,
      attributes: a.attributes as Record<string, unknown>,
    })),
    recordingConditions: {
      sampleRate: item.sampleRate,
      channels: item.channels,
      bitDepth: item.bitDepth,
      wordsPerMinute: item.wordsPerMinute,
      distanceEstimate: item.distanceEstimate,
      isConditionOverridden: item.isConditionOverridden,
    },
  }));
}
