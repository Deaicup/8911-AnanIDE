// Theia 前端模块入口
// POC 阶段：主题注册已移至 @anan/anan-ui 扩展（Theia 仅加载依赖包的 theiaExtensions）
// 此处保留空模块，供后续 theia-app 自定义扩展使用
import { ContainerModule } from '@theia/core/shared/inversify';

export default new ContainerModule((_bind) => {
  // 后续 theia-app 自定义绑定放这里
});
