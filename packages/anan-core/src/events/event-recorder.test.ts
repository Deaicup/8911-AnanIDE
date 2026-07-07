import { EventRecorder, RecordableEventStore } from './event-recorder';

describe('EventRecorder', () => {
  it('records commands through an injected store', async () => {
    const events: unknown[] = [];
    const store: RecordableEventStore = {
      record: event => {
        events.push(event);
        return 7;
      },
    };
    const recorder = new EventRecorder({
      store,
      project: 'demo',
      now: () => '2026-07-07T00:00:00.000Z',
    });

    await expect(recorder.recordCommand('npm test', { ok: true })).resolves.toBe(7);
    expect(events).toEqual([
      {
        type: 'command',
        content: 'npm test',
        project: 'demo',
        timestamp: '2026-07-07T00:00:00.000Z',
        metadata: { ok: true },
      },
    ]);
  });

  it('keeps running when no store is attached', async () => {
    const recorder = new EventRecorder();

    await expect(recorder.recordMcpCall('security-scan.run')).resolves.toBeUndefined();
  });
});
