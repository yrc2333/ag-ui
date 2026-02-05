# AG-UI Calculator Demo

基于 [AG-UI (Agent User Interaction Protocol)](https://docs.ag-ui.com) 协议的计算器工具调用演示项目。

## 快速开始（开箱即用）

```bash
# 1. 安装依赖（同时安装前端和后端依赖）
pnpm install

# 2. 启动前后端服务
pnpm dev
```

服务启动后：
- 前端: http://localhost:5173
- 后端: http://localhost:3001

## 功能特性

- 完整的 AG-UI 标准事件流演示
- SSE (Server-Sent Events) 流式响应
- 计算器工具调用示例
- 结果验证工具调用
- 真实延迟模拟（打字效果、服务端处理）
- 响应内容可从服务端 JSON 文件配置

## 项目结构

```
ag-ui/
├── src/                        # 前端代码
│   ├── agent/
│   │   └── http-agent.ts       # HTTP Agent 实现
│   ├── components/
│   │   └── ChatInterface.vue   # 聊天界面
│   ├── composables/
│   │   └── useAgent.ts         # Agent 组合式函数
│   ├── config/
│   │   └── agent.config.ts     # Agent 配置
│   └── types/
│       └── ag-ui.ts            # AG-UI 类型定义
├── server/                     # 后端服务
│   ├── server.js               # Node.js 服务端
│   ├── events.json             # 事件流配置（可修改）
│   └── package.json            # 后端依赖
├── package.json                # 前端依赖 & 启动脚本
└── README.md                   # 本文档
```

## 配置响应内容

后端从 `server/events.json` 读取事件流，修改此文件即可自定义 AI 响应：

```json
{
  "events": [
    {
      "type": "text-message-start",
      "messageId": "msg_001",
      "role": "assistant"
    },
    {
      "type": "text-message-content",
      "messageId": "msg_001",
      "delta": "你"
    },
    {
      "type": "text-message-content",
      "messageId": "msg_001",
      "delta": "好"
    },
    ...
  ]
}
```

**注意**: 修改后需要重启服务才能生效。

## 可用脚本

```bash
# 同时启动前后端（推荐）
pnpm dev

# 只启动前端
pnpm dev:client

# 只启动后端
pnpm dev:server

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

## AG-UI 事件类型

服务端支持所有 AG-UI 标准事件：

| 事件类型 | 说明 |
|---------|------|
| `run-started` / `run-finished` | 运行生命周期 |
| `step-started` / `step-finished` | 步骤标记 |
| `text-message-start` / `content` / `end` | 文本消息 |
| `tool-call-start` / `args` / `end` / `result` | 工具调用 |

## 技术栈

- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + SSE
- **协议**: AG-UI (Agent User Interaction Protocol)

## 了解更多

- [AG-UI 文档](https://docs.ag-ui.com)
- [核心架构](https://docs.ag-ui.com/concepts/architecture)
- [事件类型](https://docs.ag-ui.com/concepts/events)
