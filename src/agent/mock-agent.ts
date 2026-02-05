// Mock Agent Implementation for AG-UI Protocol Demo
// JSON 中定义完整事件流，Agent 直接播放这些事件
import {
  type Agent,
  type RunAgentInput,
  type AGUIEvent,
  type EventHandler,
  type ErrorHandler,
  type CompleteHandler,
  type AgentSubscription,
  RUN_STARTED,
  RUN_FINISHED,
  STEP_STARTED,
  STEP_FINISHED,
  TEXT_MESSAGE_START,
  TEXT_MESSAGE_CONTENT,
  TEXT_MESSAGE_END,
  TOOL_CALL_START,
  TOOL_CALL_ARGS,
  TOOL_CALL_END,
  TOOL_CALL_RESULT,
} from '../types/ag-ui';
import mockResponses from './mock-responses.json';

// ==================== Types ====================
interface MockEvent {
  type: string;
  [key: string]: any;
}

interface MockResponseConfig {
  description: string;
  events: MockEvent[];
  metadata: {
    version: string;
    description: string;
    note: string;
  };
}

// ==================== Delay Configuration ====================
const DELAY_CONFIG = {
  // 事件间的延迟配置（毫秒）
  TEXT_MESSAGE_START_DELAY: { min: 50, max: 150 },
  TEXT_MESSAGE_CONTENT_DELAY: { min: 30, max: 80 },
  TEXT_MESSAGE_END_DELAY: { min: 50, max: 100 },
  TOOL_CALL_START_DELAY: { min: 100, max: 200 },
  TOOL_CALL_ARGS_DELAY: { min: 40, max: 80 },
  TOOL_CALL_END_DELAY: { min: 100, max: 200 },
  TOOL_CALL_RESULT_DELAY: { min: 800, max: 1500 },
  STEP_STARTED_DELAY: { min: 100, max: 200 },
  STEP_FINISHED_DELAY: { min: 50, max: 100 },
  RUN_STARTED_DELAY: { min: 50, max: 100 },
  RUN_FINISHED_DELAY: { min: 100, max: 200 },
};

// ==================== Utils ====================
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(range: { min: number; max: number }): number {
  return Math.floor(range.min + Math.random() * (range.max - range.min));
}

function loadResponseConfig(): MockResponseConfig {
  return mockResponses as MockResponseConfig;
}

/**
 * 根据事件类型获取对应的延迟
 */
function getDelayForEvent(eventType: string): number {
  switch (eventType) {
    case TEXT_MESSAGE_START:
      return randomDelay(DELAY_CONFIG.TEXT_MESSAGE_START_DELAY);
    case TEXT_MESSAGE_CONTENT:
      return randomDelay(DELAY_CONFIG.TEXT_MESSAGE_CONTENT_DELAY);
    case TEXT_MESSAGE_END:
      return randomDelay(DELAY_CONFIG.TEXT_MESSAGE_END_DELAY);
    case TOOL_CALL_START:
      return randomDelay(DELAY_CONFIG.TOOL_CALL_START_DELAY);
    case TOOL_CALL_ARGS:
      return randomDelay(DELAY_CONFIG.TOOL_CALL_ARGS_DELAY);
    case TOOL_CALL_END:
      return randomDelay(DELAY_CONFIG.TOOL_CALL_END_DELAY);
    case TOOL_CALL_RESULT:
      return randomDelay(DELAY_CONFIG.TOOL_CALL_RESULT_DELAY);
    case STEP_STARTED:
      return randomDelay(DELAY_CONFIG.STEP_STARTED_DELAY);
    case STEP_FINISHED:
      return randomDelay(DELAY_CONFIG.STEP_FINISHED_DELAY);
    case RUN_STARTED:
      return randomDelay(DELAY_CONFIG.RUN_STARTED_DELAY);
    case RUN_FINISHED:
      return randomDelay(DELAY_CONFIG.RUN_FINISHED_DELAY);
    default:
      return randomDelay({ min: 50, max: 100 });
  }
}

/**
 * 生成 AG-UI 标准事件对象
 */
function createEvent(mockEvent: MockEvent): AGUIEvent {
  const baseEvent = {
    ...mockEvent,
    timestamp: Date.now(),
  };
  return baseEvent as AGUIEvent;
}

// ==================== Mock Agent ====================

/**
 * Mock Agent 实现
 * 
 * 特性：
 * 1. 从 JSON 读取完整事件流，明确定义每个事件
 * 2. 每个事件包含完整的 AG-UI 标准字段（messageId, toolCallId, delta 等）
 * 3. Agent 只负责按顺序播放事件并添加适当延迟
 * 4. 所有事件分割在 JSON 中定义，模拟真实 AI 流式响应
 */
export class MockAgent implements Agent {
  run(_input: RunAgentInput) {

    return {
      subscribe(handlers: {
        next?: EventHandler;
        error?: ErrorHandler;
        complete?: CompleteHandler;
      }): AgentSubscription {
        const { next, error, complete } = handlers;

        (async () => {
          try {
            // 加载配置
            const config = loadResponseConfig();

            // 按顺序播放 JSON 中定义的事件
            for (const mockEvent of config.events) {
              // 添加适当的延迟（模拟网络传输和处理时间）
              const delayMs = getDelayForEvent(mockEvent.type);
              await delay(delayMs);

              // 创建完整事件对象并发送
              const event = createEvent(mockEvent);
              
              if (next) {
                next(event);
              }
            }

            if (complete) complete();
          } catch (err) {
            if (error) {
              error(err instanceof Error ? err : new Error(String(err)));
            }
          }
        })();

        return {
          unsubscribe() {},
        };
      },
    };
  }
}

export function createMockAgent(): MockAgent {
  return new MockAgent();
}

export { mockResponses, DELAY_CONFIG };
export type { MockEvent };
