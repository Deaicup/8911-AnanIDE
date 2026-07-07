// anan-agent 后端模块入口
// 绑定 AgentBackendContribution 到 BackendApplicationContribution
import { ContainerModule } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { AgentBackendContribution } from './agent-backend-contribution';

export default new ContainerModule(bind => {
  bind(AgentBackendContribution).toSelf().inSingletonScope();
  bind(BackendApplicationContribution).toService(AgentBackendContribution);
});
