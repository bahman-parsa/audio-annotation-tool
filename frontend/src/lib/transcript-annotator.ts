// Standalone, framework-agnostic module.
// Can be extracted as an npm package: copy this file, add package.json + tsconfig.json, then npm publish.
export interface Annotation {
  id: string;
  startOffset: number;
  endOffset: number;
  startTime: number;
  endTime: number;
  text: string;
  type: 'CRUD' | 'NUMBER' | 'MEDICAL_TERM' | 'MEASUREMENT' | 'NAMED_ENTITY';
  attributes: Record<string, unknown>;
}

interface Token {
  text: string;
  start: number;
  end: number;
  isWord: boolean;
}

let idCounter = 0;

function generateId(): string {
  return `ann-${Date.now()}-${++idCounter}`;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\S+|\s+)/g;
  let match: RegExpExecArray | null;
  let pos = 0;

  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      text: match[1],
      start: pos,
      end: pos + match[1].length,
      isWord: !/^\s+$/.test(match[1]),
    });
    pos += match[1].length;
  }
  return tokens;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class TranscriptAnnotator {
  private originalText: string;
  private annotations: Annotation[];

  constructor(originalText: string, existingAnnotations?: Annotation[]) {
    this.originalText = originalText;
    this.annotations = existingAnnotations ? [...existingAnnotations] : [];
  }

  getOriginal(): string {
    return this.originalText;
  }

  getAnnotations(): Annotation[] {
    return [...this.annotations];
  }

  getAnnotationById(id: string): Annotation | undefined {
    return this.annotations.find((a) => a.id === id);
  }

  addAnnotation(data: Omit<Annotation, 'id'>): Annotation {
    const annotation: Annotation = {
      startTime: 0,
      endTime: 0,
      ...data,
      id: generateId(),
    };
    this.annotations.push(annotation);
    return annotation;
  }

  removeAnnotation(id: string): void {
    this.annotations = this.annotations.filter((a) => a.id !== id);
  }

  getCorrectedText(): string {
    if (this.annotations.length === 0) return this.originalText;

    const sorted = [...this.annotations]
      .filter((a) => a.type === 'CRUD')
      .sort((a, b) => b.startOffset - a.startOffset);

    let result = this.originalText;

    for (const ann of sorted) {
      const before = result.slice(0, ann.startOffset);
      const after = result.slice(ann.endOffset);

      if (ann.attributes.mode === 'delete') {
        result = before + after;
      } else if (ann.attributes.mode === 'update') {
        const replacement = (ann.attributes.normalizedValue as string) ?? '';
        result = before + replacement + after;
      }
    }

    return result.replace(/  +/g, ' ').trim();
  }

  renderAnnotatedHTML(): string {
    const tokens = tokenize(this.originalText);
    const parts: string[] = [];

    for (const token of tokens) {
      if (!token.isWord) {
        parts.push(escapeHtml(token.text));
        continue;
      }

      const overlapping = this.annotations.filter(
        (a) => a.startOffset < token.end && a.endOffset > token.start,
      );

      if (overlapping.length === 0) {
        parts.push(
          `<span class="word" data-start="${token.start}">${escapeHtml(token.text)}</span>`,
        );
        continue;
      }

      const ann = overlapping[0];

      if (ann.type === 'NUMBER') {
        const rendering = (ann.attributes.rendering as string) ?? 'digits';
        const value = ann.attributes.normalizedValue ?? '';
        parts.push(
          `<span class="word word--number" data-id="${ann.id}" data-start="${token.start}" data-rendering="${escapeHtml(rendering)}" data-value="${escapeHtml(String(value))}">${escapeHtml(token.text)}</span>`,
        );
      } else if (ann.type === 'MEDICAL_TERM') {
        const category = (ann.attributes.category as string) ?? '';
        parts.push(
          `<span class="word word--medical" data-id="${ann.id}" data-start="${token.start}" data-category="${escapeHtml(category)}"><span class="word--medical-label">${escapeHtml(category)}</span> ${escapeHtml(token.text)}</span>`,
        );
      } else if (ann.type === 'MEASUREMENT') {
        const value = ann.attributes.value ?? '';
        const unit = (ann.attributes.unit as string) ?? '';
        const label = `${value} ${unit}`;
        parts.push(
          `<span class="word word--measurement" data-id="${ann.id}" data-start="${token.start}" data-value="${escapeHtml(String(value))}" data-unit="${escapeHtml(unit)}"><span class="word--measurement-label">${escapeHtml(label)}</span> ${escapeHtml(token.text)}</span>`,
        );
      } else if (ann.type === 'NAMED_ENTITY') {
        const entityType = (ann.attributes.entityType as string) ?? '';
        parts.push(
          `<span class="word word--entity-${escapeHtml(entityType)}" data-id="${ann.id}" data-start="${token.start}" data-entity-type="${escapeHtml(entityType)}"><span class="word--entity-label">${escapeHtml(entityType)}</span> ${escapeHtml(token.text)}</span>`,
        );
      } else if (ann.type === 'CRUD' && ann.attributes.mode === 'delete') {
        parts.push(
          `<span class="word word--deleted" data-id="${ann.id}" data-start="${token.start}"><s>${escapeHtml(token.text)}</s></span>`,
        );
      } else if (ann.type === 'CRUD' && ann.attributes.mode === 'update') {
        const newText = (ann.attributes.normalizedValue as string) ?? '';
        parts.push(
          `<span class="word word--updated" data-id="${ann.id}" data-start="${token.start}"><s>${escapeHtml(token.text)}</s> <span class="word--new">${escapeHtml(newText)}</span></span>`,
        );
      }
    }

    return parts.join('');
  }
}
