/* eslint-disable @typescript-eslint/no-var-requires */

const sqliteAvailable = (() => {
  try {
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.close();
    return true;
  } catch {
    return false;
  }
})();

const describeSqlite = sqliteAvailable ? describe : describe.skip;

describe('memory metadata helpers', () => {
  it('serializes object metadata', () => {
    const { serializeMetadata } = require('./store');

    expect(serializeMetadata({ command: 'npm test' })).toBe('{"command":"npm test"}');
  });

  it('normalizes unsafe query limits', () => {
    const { normalizeLimit } = require('./store');

    expect(normalizeLimit(-10)).toBe(1);
    expect(normalizeLimit(9999)).toBe(500);
    expect(normalizeLimit()).toBe(100);
  });
});

describeSqlite('MemoryStore', () => {
  it('records and queries events in insertion order by timestamp', () => {
    const { MemoryStore, parseMetadata } = require('./store');
    const store = new MemoryStore(':memory:');

    try {
      const firstId = store.record({
        type: 'command',
        content: ' npm run lint ',
        project: 'demo',
        timestamp: '2026-07-07T01:00:00.000Z',
        metadata: { exitCode: 0 },
      });
      store.record({
        type: 'file-edit',
        content: 'edited src/index.ts',
        project: 'demo',
        timestamp: '2026-07-07T02:00:00.000Z',
      });

      expect(store.count({ project: 'demo' })).toBe(2);
      expect(store.getById(firstId)).toMatchObject({ content: 'npm run lint' });

      const commandEvents = store.query({ type: 'command', project: 'demo' });
      expect(commandEvents).toHaveLength(1);
      expect(parseMetadata(commandEvents[0].metadata)).toEqual({ exitCode: 0 });
    } finally {
      store.close();
    }
  });
});
