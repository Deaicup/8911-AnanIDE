// Electron 预加载脚本
// 在渲染进程加载前注入安全桥接 API
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('anan', {
  version: '0.0.0',
  platform: process.platform,
  // POC: 后续按需暴露 IPC 接口
});
