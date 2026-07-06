// anan-ui 扩展入口
// 二次元 UI 替换：主题、图标、安安动画层
import { ContainerModule } from '@theia/core/shared/inversify';

export default new ContainerModule(bind => {
  // MVP 阶段任务：
  // 1. 注册二次元文件树图标主题
  // 2. 挂载 PixiJS Canvas 作为安安表情 Overlay Widget
  // 3. 监听 diagnostic 信息驱动表情切换
  // POC 先跑通主题，动画放迭代
});
