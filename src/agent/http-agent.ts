// HTTP Agent - 连接真实后端服务
// 使用 SSE (Server-Sent Events) 接收流式响应
import {
  type Agent,
  type AgentRun,
  type RunAgentInput,
  type AGUIEvent,
  type EventHandler,
  type ErrorHandler,
  type CompleteHandler,
  type AgentSubscription,
} from "../types/ag-ui";

interface HttpAgentOptions {
  baseUrl: string;
  endpoint?: string;
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * HTTP Agent 实现
 *
 * 通过 SSE 连接到后端服务，接收流式 AG-UI 事件
 */
export class HttpAgent implements Agent {
  private baseUrl: string;
  private endpoint: string;
  private activeRuns = new Map<string, AbortController>();

  constructor(options: HttpAgentOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.endpoint = options.endpoint || "/api/agent/run";
  }

  run(input: RunAgentInput): AgentRun {
    const runId = generateId();
    const url = `${this.baseUrl}${this.endpoint}`;
    const abortController = new AbortController();
    this.activeRuns.set(runId, abortController);

    return {
      runId,
      subscribe(handlers: {
        next?: EventHandler;
        error?: ErrorHandler;
        complete?: CompleteHandler;
      }): AgentSubscription {
        const { next, error, complete } = handlers;
        let isAborted = false;

        // 监听 abort 信号
        abortController.signal.addEventListener("abort", () => {
          isAborted = true;
        });

        // 启动 SSE 连接
        const fetchEvents = async () => {
          try {
            const response = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
              },
              body: JSON.stringify(input),
              signal: abortController.signal,
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error("Response body is null");
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (!isAborted) {
              const { done, value } = await reader.read();

              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);

                  // 检查结束标记
                  if (data === "[DONE]") {
                    cleanup();
                    if (complete) complete();
                    return;
                  }

                  // 解析事件
                  try {
                    const event: AGUIEvent = JSON.parse(data);
                    if (next) next(event);
                  } catch (e) {
                    console.warn("Failed to parse event:", data);
                  }
                }
              }
            }

            cleanup();
            if (complete) complete();
          } catch (err) {
            cleanup();
            if (!isAborted && error) {
              error(err instanceof Error ? err : new Error(String(err)));
            }
          }
        };

        const cleanup = () => {
          this.activeRuns.delete(runId);
        };

        fetchEvents();

        return {
          unsubscribe() {
            isAborted = true;
            abortController.abort();
            cleanup();
          },
        };
      },
      abort: () => {
        this.abortRun(runId);
      },
    };
  }

  abortRun(runId: string): void {
    const abortController = this.activeRuns.get(runId);
    if (abortController) {
      abortController.abort();
      this.activeRuns.delete(runId);
    }
  }
}

/**
 * 创建 HTTP Agent 实例
 */
export function createHttpAgent(baseUrl: string): HttpAgent {
  return new HttpAgent({ baseUrl });
}
