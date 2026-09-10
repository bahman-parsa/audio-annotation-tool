import { Prisma, type AnnotationType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function getAllItems() {
  return prisma.audioItem.findMany({
    include: {
      transcript: {
        include: {
          annotations: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTranscript(
  audioItemId: string,
  originalLabel: string,
  rawPath: string,
) {
  const audioItem = await prisma.audioItem.findUnique({
    where: { id: audioItemId },
    include: { transcript: true },
  });

  if (!audioItem) {
    throw new Error('Audio item not found');
  }

  if (audioItem.transcript) {
    throw new Error('Audio item already has a transcript');
  }

  const transcript = await prisma.transcript.create({
    data: {
      audioItemId,
      originalLabel,
      correctedText: originalLabel,
      rawPath,
    },
    include: { annotations: true },
  });

  await prisma.audioItem.update({
    where: { id: audioItemId },
    data: { status: 'NEW' },
  });

  return transcript;
}

export async function updateTranscript(
  audioItemId: string,
  correctedText: string,
  annotations: Array<{
    id: string;
    transcriptId: string;
    startOffset: number;
    endOffset: number;
    startTime: number;
    endTime: number;
    text: string;
    type: AnnotationType;
    attributes: Record<string, unknown>;
  }>,
) {
  const audioItem = await prisma.audioItem.findUnique({
    where: { id: audioItemId },
    include: { transcript: true },
  });

  if (!audioItem) {
    throw new Error('Audio item not found');
  }

  if (!audioItem.transcript) {
    throw new Error('Audio item has no transcript');
  }

  await prisma.transcript.update({
    where: { id: audioItem.transcript.id },
    data: { correctedText },
  });

  await prisma.annotation.deleteMany({
    where: { transcriptId: audioItem.transcript.id },
  });

  if (annotations.length > 0) {
    await prisma.annotation.createMany({
      data: annotations.map((a) => ({
        id: a.id,
        transcriptId: audioItem.transcript!.id,
        startOffset: a.startOffset,
        endOffset: a.endOffset,
        startTime: a.startTime,
        endTime: a.endTime,
        text: a.text,
        type: a.type,
        attributes: a.attributes as Prisma.InputJsonValue,
      })),
    });
  }

  const newStatus = annotations.length > 0 ? 'READY' : 'NEW';
  if (audioItem.status !== newStatus) {
    await prisma.audioItem.update({
      where: { id: audioItemId },
      data: { status: newStatus },
    });
  }

  return prisma.audioItem.findUnique({
    where: { id: audioItemId },
    include: {
      transcript: {
        include: { annotations: true },
      },
    },
  });
}

export async function replaceTranscript(
  audioItemId: string,
  originalLabel: string,
) {
  const audioItem = await prisma.audioItem.findUnique({
    where: { id: audioItemId },
    include: { transcript: true },
  });

  if (!audioItem) {
    throw new Error('Audio item not found');
  }

  if (!audioItem.transcript) {
    throw new Error('Audio item has no transcript');
  }

  await prisma.transcript.update({
    where: { id: audioItem.transcript.id },
    data: { originalLabel, correctedText: originalLabel },
  });

  await prisma.annotation.deleteMany({
    where: { transcriptId: audioItem.transcript.id },
  });

  if (audioItem.status !== 'NEW') {
    await prisma.audioItem.update({
      where: { id: audioItemId },
      data: { status: 'NEW' },
    });
  }

  return prisma.audioItem.findUnique({
    where: { id: audioItemId },
    include: {
      transcript: {
        include: { annotations: true },
      },
    },
  });
}

export async function deleteTranscript(audioItemId: string) {
  const audioItem = await prisma.audioItem.findUnique({
    where: { id: audioItemId },
    include: { transcript: true },
  });

  if (!audioItem) {
    throw new Error('Audio item not found');
  }

  if (!audioItem.transcript) {
    throw new Error('Audio item has no transcript');
  }

  await prisma.transcript.delete({
    where: { id: audioItem.transcript.id },
  });

  if (audioItem.status !== 'PENDING') {
    await prisma.audioItem.update({
      where: { id: audioItemId },
      data: { status: 'PENDING' },
    });
  }

  return prisma.audioItem.findUnique({
    where: { id: audioItemId },
    include: {
      transcript: {
        include: { annotations: true },
      },
    },
  });
}
