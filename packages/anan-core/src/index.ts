import { ContainerModule } from '@theia/core/shared/inversify';
import { EventRecorder } from './events/event-recorder';
import { AutosaveStore } from './autosave/autosave-store';

export { ConfigStore } from './config/config-store';
export { MemoryStore } from './memory/store';
export { Safety } from './safety/safety';
export * from './safety/confirmation';
export * from './safety/file-guard';
export * from './events/event-recorder';
export * from './autosave/autosave-store';

export default new ContainerModule(bind => {
  bind(EventRecorder).toDynamicValue(() => new EventRecorder()).inSingletonScope();
  bind(AutosaveStore).toDynamicValue(() => new AutosaveStore()).inSingletonScope();
});
