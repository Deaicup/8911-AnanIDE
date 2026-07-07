import type { EventMetadata, EventType, NewEventRecord } from '../memory/store';

export interface RecordableEventStore {
  record(event: NewEventRecord): number | Promise<number>;
}

export interface EventRecorderOptions {
  store?: RecordableEventStore;
  project?: string;
  now?: () => string;
}

export class EventRecorder {
  private readonly store?: RecordableEventStore;
  private readonly project?: string;
  private readonly now: () => string;

  constructor(options: EventRecorderOptions = {}) {
    this.store = options.store;
    this.project = options.project;
    this.now = options.now || (() => new Date().toISOString());
  }

  async record(type: EventType, content: string, metadata?: EventMetadata): Promise<number | undefined> {
    if (!this.store) return undefined;
    try {
      return await this.store.record({
        type,
        content,
        project: this.project,
        timestamp: this.now(),
        metadata,
      });
    } catch {
      return undefined;
    }
  }

  recordCommand(command: string, metadata?: EventMetadata): Promise<number | undefined> {
    return this.record('command', command, metadata);
  }

  recordMcpCall(toolName: string, metadata?: EventMetadata): Promise<number | undefined> {
    return this.record('mcp-call', toolName, metadata);
  }

  recordFileEdit(filePath: string, metadata?: EventMetadata): Promise<number | undefined> {
    return this.record('file-edit', filePath, metadata);
  }
}
