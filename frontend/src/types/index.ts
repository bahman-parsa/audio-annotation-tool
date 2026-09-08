export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type AnnotationType =
  | 'NUMBER'
  | 'FORMATTING_COMMAND'
  | 'SPELLED_OUT'
  | 'NAMED_ENTITY'
  | 'MEDICAL_TERM'
  | 'MEASUREMENT';

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
  annotations: Annotation[];
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  transcriptId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  type: AnnotationType;
  attributes: Record<string, unknown>;
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
