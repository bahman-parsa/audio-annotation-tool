export type Status = 'PENDING' | 'NEW' | 'READY';

export type AnnotationType = 'CRUD' | 'NUMBER';

export type { Annotation } from '@/lib/transcript-annotator'

export interface AudioItem {
  id: string;
  filename: string;
  filePath: string;
  duration: number;
  status: Status;
  annotator: string | null;
  sampleRate: number | null;
  channels: number | null;
  bitDepth: number | null;
  wordsPerMinute: number | null;
  distanceEstimate: number | null;
  isConditionOverridden: boolean;
  transcript: Transcript | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transcript {
  id: string;
  audioItemId: string | null;
  originalLabel: string;
  correctedText: string;
  rawPath: string | null;
  annotations: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  index: number;
}

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
}
