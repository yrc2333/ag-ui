// Vue Composable for AG-UI Agent
import { ref, type Ref } from 'vue';
import {
  type Agent,
  type RunAgentInput,
  type AGUIEvent,
  type ToolCall,
  RUN_STARTED,
  RUN_FINISHED,
  RUN_ERROR,
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
import { createAgent, type AgentConfig } from '../config/agent.config';

export interface StreamMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  timestamp: number;
}

export interface UseAgentOptions {
  agent?: Agent;
  config?: AgentConfig;
}

export interface UseAgentReturn {
  messages: Ref<StreamMessage[]>;
  isRunning: Ref<boolean>;
  currentToolCall: Ref<ToolCall | null>;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

/**
 * Vue composable for interacting with AG-UI agents
 */
export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const { agent: customAgent, config } = options;
  
  // 根据配置创建 Agent 实例
  const agent = customAgent || createAgent(config);

  // State
  const messages = ref<StreamMessage[]>([]);
  const isRunning = ref(false);
  const currentToolCall = ref<ToolCall | null>(null);

  // Active message tracking for streaming
  const activeMessages = new Map<string, StreamMessage>();
  const activeToolCalls = new Map<string, ToolCall>();

  /**
   * Send a message to the agent
   */
  const sendMessage = (content: string) => {
    if (isRunning.value) return;

    // Add user message
    const userMessage: StreamMessage = {
      id: generateId('user_'),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(userMessage);

    // Start agent run
    isRunning.value = true;
    currentToolCall.value = null;

    // Prepare input
    const input: RunAgentInput = {
      messages: messages.value.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    };

    // Run agent
    agent.run(input).subscribe({
      next: (event: AGUIEvent) => {
        handleEvent(event);
      },
      error: (err: Error) => {
        console.error('Agent error:', err);
        isRunning.value = false;
        currentToolCall.value = null;
      },
      complete: () => {
        isRunning.value = false;
        currentToolCall.value = null;
      },
    });
  };

  /**
   * Handle incoming AG-UI events
   */
  const handleEvent = (event: AGUIEvent) => {
    switch (event.type) {
      case RUN_STARTED:
        console.log('Run started:', event.runId);
        break;

      case RUN_FINISHED:
        console.log('Run finished:', event.outcome);
        break;

      case RUN_ERROR:
        console.error('Run error:', event.message);
        break;

      case TEXT_MESSAGE_START: {
        // Initialize new streaming message
        const newMessage: StreamMessage = {
          id: event.messageId,
          role: event.role === 'assistant' ? 'assistant' : 'user',
          content: '',
          isStreaming: true,
          timestamp: Date.now(),
        };
        activeMessages.set(event.messageId, newMessage);
        messages.value.push(newMessage);
        break;
      }

      case TEXT_MESSAGE_CONTENT: {
        // Append content to streaming message
        const streamingMsg = activeMessages.get(event.messageId);
        if (streamingMsg) {
          streamingMsg.content += event.delta;
        }
        break;
      }

      case TEXT_MESSAGE_END: {
        // Finalize streaming message
        const finishedMsg = activeMessages.get(event.messageId);
        if (finishedMsg) {
          finishedMsg.isStreaming = false;
          activeMessages.delete(event.messageId);
        }
        break;
      }

      case TOOL_CALL_START: {
        // Initialize tool call
        const toolCall: ToolCall = {
          id: event.toolCallId,
          name: event.toolCallName,
          arguments: '',
        };
        activeToolCalls.set(event.toolCallId, toolCall);
        currentToolCall.value = toolCall;
        break;
      }

      case TOOL_CALL_ARGS: {
        // Append tool arguments
        const streamingToolCall = activeToolCalls.get(event.toolCallId);
        if (streamingToolCall) {
          streamingToolCall.arguments += event.delta;
          currentToolCall.value = { ...streamingToolCall };
        }
        break;
      }

      case TOOL_CALL_END: {
        // Finalize tool call
        const finishedToolCall = activeToolCalls.get(event.toolCallId);
        if (finishedToolCall) {
          // Attach to last assistant message
          const lastAssistantMsg = [...messages.value]
            .reverse()
            .find(m => m.role === 'assistant');
          if (lastAssistantMsg) {
            if (!lastAssistantMsg.toolCalls) {
              lastAssistantMsg.toolCalls = [];
            }
            lastAssistantMsg.toolCalls.push(finishedToolCall);
          }
        }
        currentToolCall.value = null;
        break;
      }

      case TOOL_CALL_RESULT: {
        // Add tool result as a message
        messages.value.push({
          id: event.messageId,
          role: 'tool',
          content: event.content,
          timestamp: Date.now(),
        });

        // Update the tool call with result
        const toolCallWithResult = activeToolCalls.get(event.toolCallId);
        if (toolCallWithResult) {
          toolCallWithResult.result = event.content;
          activeToolCalls.delete(event.toolCallId);
        }
        break;
      }

      case STEP_STARTED:
        console.log('Step started:', event.stepName);
        break;

      case STEP_FINISHED:
        console.log('Step finished:', event.stepName);
        break;

      default:
        console.log('Unhandled event:', event.type, event);
    }
  };

  /**
   * Clear all messages
   */
  const clearMessages = () => {
    messages.value = [];
    activeMessages.clear();
    activeToolCalls.clear();
    currentToolCall.value = null;
  };

  return {
    messages,
    isRunning,
    currentToolCall,
    sendMessage,
    clearMessages,
  };
}



/**
 * Generate unique ID
 */
function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
