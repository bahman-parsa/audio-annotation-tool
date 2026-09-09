import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkQueue } from '../useWorkQueue';
import type { AudioItem } from '@/types';

function createItem(overrides: Partial<AudioItem> = {}): AudioItem {
  return {
    id: crypto.randomUUID(),
    filename: `test-${crypto.randomUUID()}.wav`,
    filePath: '/uploads/test.wav',
    duration: 120,
    status: 'PENDING',
    annotator: null,
    sampleRate: 44100,
    channels: 1,
    bitDepth: 16,
    wordsPerMinute: null,
    distanceEstimate: null,
    isConditionOverridden: false,
    transcript: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('useWorkQueue', () => {
  const {
    setItems,
    items,
    filteredItems,
    selectItem,
    selectedItem,
    searchQuery,
    statusFilter,
  } = useWorkQueue();

  beforeEach(() => {
    items.value = [];
    searchQuery.value = '';
    statusFilter.value = 'ALL';
    selectItem('');
  });

  it('setItems populates the queue correctly', () => {
    const item1 = createItem({ filename: 'alpha.wav' });
    const item2 = createItem({ filename: 'beta.wav' });

    setItems([item1, item2]);

    expect(items.value).toHaveLength(2);
    expect(items.value[0].filename).toBe('alpha.wav');
    expect(items.value[1].filename).toBe('beta.wav');
  });

  it('filteredItems filters by status', () => {
    const pending = createItem({ status: 'PENDING' });
    const untouched = createItem({ status: 'NEW' });
    const ready = createItem({ status: 'READY' });

    setItems([pending, untouched, ready]);

    statusFilter.value = 'PENDING';
    expect(filteredItems.value).toHaveLength(1);
    expect(filteredItems.value[0].id).toBe(pending.id);

    statusFilter.value = 'NEW';
    expect(filteredItems.value).toHaveLength(1);
    expect(filteredItems.value[0].id).toBe(untouched.id);

    statusFilter.value = 'READY';
    expect(filteredItems.value).toHaveLength(1);
    expect(filteredItems.value[0].id).toBe(ready.id);

    statusFilter.value = 'ALL';
    expect(filteredItems.value).toHaveLength(3);
  });

  it('filteredItems filters by search query', () => {
    const alpha = createItem({ filename: 'alpha-report.wav' });
    const beta = createItem({ filename: 'beta-report.wav' });
    const gamma = createItem({ filename: 'gamma-summary.wav' });

    setItems([alpha, beta, gamma]);

    searchQuery.value = 'report';
    expect(filteredItems.value).toHaveLength(2);

    searchQuery.value = 'summary';
    expect(filteredItems.value).toHaveLength(1);
    expect(filteredItems.value[0].id).toBe(gamma.id);

    searchQuery.value = '';
    expect(filteredItems.value).toHaveLength(3);
  });

  it('selectItem and selectedItem track selection', () => {
    const item1 = createItem({ filename: 'first.wav' });
    const item2 = createItem({ filename: 'second.wav' });

    setItems([item1, item2]);

    expect(selectedItem.value).toBeNull();

    selectItem(item1.id);
    expect(selectedItem.value?.id).toBe(item1.id);

    selectItem(item2.id);
    expect(selectedItem.value?.id).toBe(item2.id);

    selectItem('');
    expect(selectedItem.value).toBeNull();
  });
});
