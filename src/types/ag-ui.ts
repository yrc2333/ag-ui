// AG-UI Protocol Type Definitions
// https://docs.ag-ui.com/concepts/events

// ==================== Event Type Constants ====================
export const RUN_STARTED = 'run-started' as const;
export const RUN_FINISHED = 'run-finished' as const;
export const RUN_ERROR = 'run-error' as const;
export const STEP_STARTED = 'step-started' as const;
export const STEP_FINISHED = 'step-finished' as const;
export const TEXT_MESSAGE_START = 'text-message-start' as const;
export const TEXT_MESSAGE_CONTENT = 'text-message-content' as const;
export const TEXT_MESSAGE_END = 'text-message-end' as const;
export const TEXT_MESSAGE_CHUNK = 'text-message-chunk' as const;
export const TOOL_CALL_START = 'tool-call-start' as const;
export const TOOL_CALL_ARGS = 'tool-call-args' as const;
export const TOOL_CALL_END = 'tool-call-end' as const;
export const TOOL_CALL_RESULT = 'tool-call-result' as const;
export const TOOL_CALL_CHUNK = 'tool-call-chunk' as const;
export const STATE_SNAPSHOT = 'state-snapshot' as const;
export const STATE_DELTA = 'state-delta' as const;
export const MESSAGES_SNAPSHOT = 'messages-snapshot' as const;
export const ACTIVITY_SNAPSHOT = 'activity-snapshot' as const;
export const ACTIVITY_DELTA = 'activity-delta' as const;
export const RAW = 'raw' as const;
export const CUSTOM = 'custom' as const;

export const EventType = {
  RUN_STARTED,
  RUN_FINISHED,
  RUN_ERROR,
  STEP_STARTED,
  STEP_FINISHED,
  TEXT_MESSAGE_START,
  TEXT_MESSAGE_CONTENT,
  TEXT_MESSAGE_END,
  TEXT_MESSAGE_CHUNK,
  TOOL_CALL_START,
  TOOL_CALL_ARGS,
  TOOL_CALL_END,
  TOOL_CALL_RESULT,
  TOOL_CALL_CHUNK,
  STATE_SNAPSHOT,
  STATE_DELTA,
  MESSAGES_SNAPSHOT,
  ACTIVITY_SNAPSHOT,
  ACTIVITY_DELTA,
  RAW,
  CUSTOM,
} as const;

export type EventTypeValue = typeof EventType[keyof typeof EventType];

// ==================== Base Event ====================
export interface BaseEvent {
  type: EventTypeValue;
  timestamp?: number;
  rawEvent?: any;
}

// ==================== Role Types ====================
export type MessageRole = 'developer' | 'system' | 'assistant' | 'user' | 'tool';

// ==================== Lifecycle Events ====================
export interface RunStartedEvent extends BaseEvent {
  type: typeof RUN_STARTED;
  threadId: string;
  runId: string;
  parentRunId?: string;
  input?: RunAgentInput;
}

export interface RunFinishedEvent extends BaseEvent {
  type: typeof RUN_FINISHED;
  threadId: string;
  runId: string;
  result?: any;
  outcome?: 'success' | 'interrupt';
  interrupt?: any;
}

export interface RunErrorEvent extends BaseEvent {
  type: typeof RUN_ERROR;
  message: string;
  code?: string;
}

export interface StepStartedEvent extends BaseEvent {
  type: typeof STEP_STARTED;
  stepName: string;
}

export interface StepFinishedEvent extends BaseEvent {
  type: typeof STEP_FINISHED;
  stepName: string;
}

// ==================== Text Message Events ====================
export interface TextMessageStartEvent extends BaseEvent {
  type: typeof TEXT_MESSAGE_START;
  messageId: string;
  role: MessageRole;
}

export interface TextMessageContentEvent extends BaseEvent {
  type: typeof TEXT_MESSAGE_CONTENT;
  messageId: string;
  delta: string;
}

export interface TextMessageEndEvent extends BaseEvent {
  type: typeof TEXT_MESSAGE_END;
  messageId: string;
}

export interface TextMessageChunkEvent extends BaseEvent {
  type: typeof TEXT_MESSAGE_CHUNK;
  messageId?: string;
  role?: MessageRole;
  delta?: string;
}

// ==================== Tool Call Events ====================
export interface ToolCallStartEvent extends BaseEvent {
  type: typeof TOOL_CALL_START;
  toolCallId: string;
  toolCallName: string;
  parentMessageId?: string;
}

export interface ToolCallArgsEvent extends BaseEvent {
  type: typeof TOOL_CALL_ARGS;
  toolCallId: string;
  delta: string;
}

export interface ToolCallEndEvent extends BaseEvent {
  type: typeof TOOL_CALL_END;
  toolCallId: string;
}

export interface ToolCallResultEvent extends BaseEvent {
  type: typeof TOOL_CALL_RESULT;
  messageId: string;
  toolCallId: string;
  content: string;
  role?: MessageRole;
}

export interface ToolCallChunkEvent extends BaseEvent {
  type: typeof TOOL_CALL_CHUNK;
  toolCallId?: string;
  toolCallName?: string;
  parentMessageId?: string;
  delta?: string;
}

// ==================== State Management Events ====================
export interface StateSnapshotEvent extends BaseEvent {
  type: typeof STATE_SNAPSHOT;
  snapshot: any;
}

export interface StateDeltaEvent extends BaseEvent {
  type: typeof STATE_DELTA;
  delta: any[]; // JSON Patch operations (RFC 6902)
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  timestamp?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
  result?: string;
}

export interface MessagesSnapshotEvent extends BaseEvent {
  type: typeof MESSAGES_SNAPSHOT;
  messages: Message[];
}

// ==================== Activity Events ====================
export interface ActivitySnapshotEvent extends BaseEvent {
  type: typeof ACTIVITY_SNAPSHOT;
  messageId: string;
  activityType: string;
  content: any;
  replace?: boolean;
}

export interface ActivityDeltaEvent extends BaseEvent {
  type: typeof ACTIVITY_DELTA;
  messageId: string;
  activityType: string;
  patch: any[]; // JSON Patch operations
}

// ==================== Special Events ====================
export interface RawEvent extends BaseEvent {
  type: typeof RAW;
  event: any;
  source?: string;
}

export interface CustomEvent extends BaseEvent {
  type: typeof CUSTOM;
  name: string;
  value: any;
}

// ==================== Union Type ====================
export type AGUIEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | StepStartedEvent
  | StepFinishedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | TextMessageChunkEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | ToolCallChunkEvent
  | StateSnapshotEvent
  | StateDeltaEvent
  | MessagesSnapshotEvent
  | ActivitySnapshotEvent
  | ActivityDeltaEvent
  | RawEvent
  | CustomEvent;

// ==================== Agent Input ====================
export interface RunAgentInput {
  messages?: Message[];
  tools?: ToolDefinition[];
  context?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

// ==================== Agent Interface ====================
export type EventHandler = (event: AGUIEvent) => void;
export type ErrorHandler = (error: Error) => void;
export type CompleteHandler = () => void;

export interface AgentSubscription {
  unsubscribe: () => void;
}

export interface AgentRun {
  runId: string;
  subscribe: (handlers: {
    next?: EventHandler;
    error?: ErrorHandler;
    complete?: CompleteHandler;
  }) => AgentSubscription;
  abort: () => void;
}

export interface Agent {
  run(input: RunAgentInput): AgentRun;
  abortRun(runId: string): void;
}
