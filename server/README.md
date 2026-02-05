# AG-UI Mock Server

Node.js 服务端，提供 SSE (Server-Sent Events) 流式响应，模拟 AI Agent 的 AG-UI 协议事件流。

## 功能特性

- SSE 流式响应
- 从 `events.json` 读取固定事件流
- 模拟真实延迟（打字效果、工具调用延迟等）
- CORS 跨域支持
- 热重载（修改 `events.json` 后重启服务生效）

## 目录结构

```
server/
├── package.json      # 依赖配置
├── server.js         # 服务端入口
├── events.json       # 事件流配置（可修改）
└── README.md         # 说明文档
```

## 快速开始

```bash
# 进入服务端目录
cd server

# 安装依赖（已安装可跳过）
npm install

# 启动服务
npm start

# 或使用热重载模式（开发推荐）
npm run dev
```

服务启动后：
- 地址: http://localhost:3001
- SSE 端点: POST http://localhost:3001/api/agent/run
- 健康检查: GET http://localhost:3001/api/health

## 配置事件流

修改 `events.json` 文件即可自定义响应内容：

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
    {
      "type": "text-message-end",
      "messageId": "msg_001"
    }
  ]
}
```

**注意**: 修改 `events.json` 后需要重启服务才能生效。

## 前端配置

在 `src/config/agent.config.ts` 中切换模式：

```typescript
// 使用 HTTP 服务
const DEFAULT_CONFIG: AgentConfig = {
  type: 'http',
  http: {
    baseUrl: 'http://localhost:3001',
    endpoint: '/api/agent/run',
  },
};

// 或使用本地 Mock
const DEFAULT_CONFIG: AgentConfig = {
  type: 'mock',
};
```

或在界面中点击 **Mock/HTTP** 按钮实时切换。

## API 端点

### POST /api/agent/run

主端点，接收 POST 请求并返回 SSE 流。

**请求头:**
```
Content-Type: application/json
Accept: text/event-stream
```

**响应:**
```
data: {"type":"run-started",...}

data: {"type":"text-message-start",...}

data: {"type":"text-message-content",...}

data: [DONE]
```

### GET /api/agent/run

测试端点，用于浏览器直接访问测试。

### GET /api/health

健康检查。

**响应:**
```json
{
  "status": "ok",
  "timestamp": 1700000000000,
  "version": "1.0.0",
  "eventsCount": 156
}
```

### GET /api/events

获取当前事件配置（调试用）。

## 事件类型

支持所有 AG-UI 标准事件：

- `run-started`, `run-finished`, `run-error`
- `step-started`, `step-finished`
- `text-message-start`, `text-message-content`, `text-message-end`
- `tool-call-start`, `tool-call-args`, `tool-call-end`, `tool-call-result`

## 延迟配置

服务端根据事件类型自动添加延迟，模拟真实场景：

| 事件类型 | 延迟范围 |
|---------|---------|
| text-message-content | 30-80ms |
| tool-call-result | 800-1500ms |
| 其他 | 50-200ms |

修改 `server.js` 中的 `DELAY_CONFIG` 可调整延迟。
