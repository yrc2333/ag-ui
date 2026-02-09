/**
 * AG-UI Mock Server
 *
 * 功能：
 * 1. 提供 SSE (Server-Sent Events) 流式响应
 * 2. 从 events.json 读取固定事件流
 * 3. 模拟真实 AI 流式响应延迟
 */

import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 启用 CORS，允许前端跨域访问
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

// ==================== 延迟配置 ====================
const DELAY_CONFIG = {
  // 事件间的延迟配置（毫秒）
  "run-started": { min: 50, max: 100 },
  "run-finished": { min: 100, max: 200 },
  "step-started": { min: 100, max: 200 },
  "step-finished": { min: 50, max: 100 },
  "text-message-start": { min: 50, max: 150 },
  "text-message-content": { min: 30, max: 80 },
  "text-message-end": { min: 50, max: 100 },
  "tool-call-start": { min: 100, max: 200 },
  "tool-call-args": { min: 40, max: 80 },
  "tool-call-end": { min: 100, max: 200 },
  "tool-call-result": { min: 800, max: 1500 },
};

function getDelay(eventType) {
  const config = DELAY_CONFIG[eventType];
  if (!config) return 50;
  return Math.floor(config.min + Math.random() * (config.max - config.min));
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== 加载事件配置 ====================
const eventsFilePath = join(__dirname, "events.json");

function loadEvents() {
  try {
    const content = readFileSync(eventsFilePath, "utf-8");
    const eventsData = JSON.parse(content);
    return eventsData;
  } catch (error) {
    console.error("❌ 加载事件配置失败:", error.message);
    throw error;
  }
}

// ==================== SSE 流式响应端点 ====================
app.post("/api/agent/run", async (req, res) => {
  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("\n📨 收到 Agent 运行请求");
  console.log(`   时间: ${new Date().toLocaleString()}`);

  try {
    // 动态加载事件配置
    const eventsData = loadEvents();
    const { events } = eventsData;
    console.log(`✅ 动态加载事件配置成功，共 ${events.length} 个事件`);

    // 按顺序发送事件
    for (const event of events) {
      // 添加时间戳
      const eventWithTimestamp = {
        ...event,
        timestamp: Date.now(),
      };

      // 发送 SSE 事件
      res.write(`data: ${JSON.stringify(eventWithTimestamp)}\n\n`);

      // 根据事件类型添加延迟
      const delayMs = getDelay(event.type);
      await delay(delayMs);
    }

    // 发送结束标记
    res.write(`data: [DONE]\n\n`);
    res.end();

    console.log("✅ 事件流发送完成");
  } catch (error) {
    console.error("❌ 发送事件流失败:", error);

    // 发送错误事件
    const errorEvent = {
      type: "run-error",
      message: error.message,
      timestamp: Date.now(),
    };
    res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    res.end();
  }
});

// ==================== GET 版本（用于测试）====================
app.get("/api/agent/run", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("\n📨 收到 GET 请求 (测试模式)");

  try {
    // 动态加载事件配置
    const eventsData = loadEvents();
    const { events } = eventsData;
    console.log(`✅ 动态加载事件配置成功，共 ${events.length} 个事件`);

    for (const event of events) {
      const eventWithTimestamp = {
        ...event,
        timestamp: Date.now(),
      };

      res.write(`data: ${JSON.stringify(eventWithTimestamp)}\n\n`);
      await delay(getDelay(event.type));
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error("❌ 发送失败:", error);
    res.write(
      `data: ${JSON.stringify({ type: "run-error", message: error.message })}\n\n`,
    );
    res.end();
  }
});

// ==================== 健康检查 ====================
app.get("/api/health", (req, res) => {
  try {
    const eventsData = loadEvents();
    res.json({
      status: "ok",
      timestamp: Date.now(),
      version: "1.0.0",
      eventsCount: eventsData?.events?.length || 0,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// ==================== 获取事件配置（调试用）====================
app.get("/api/events", (req, res) => {
  try {
    const eventsData = loadEvents();
    res.json(eventsData);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// ==================== 启动服务 ====================
app.listen(PORT, () => {
  console.log(`\n🚀 AG-UI Mock Server 已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   SSE 端点: POST http://localhost:${PORT}/api/agent/run`);
  console.log(`   健康检查: GET http://localhost:${PORT}/api/health`);
  console.log(`   事件配置: GET http://localhost:${PORT}/api/events`);
});
