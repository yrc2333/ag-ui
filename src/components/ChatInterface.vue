<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { useAgent } from '../composables/useAgent';

// Use the agent composable - 使用 HTTP 服务
const { messages, isRunning, currentToolCall, sendMessage, abortRun, clearMessages } = useAgent();

// Input state
const inputValue = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

// 仅保留计算器相关的快捷建议
const suggestions = [
  { 
    label: '🧮 计算器示例', 
    value: '帮我计算 1+1',
    desc: '固定执行计算器工具调用'
  },
];

// Auto-scroll to bottom when messages change
watch(messages, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}, { deep: true });

// Handle send
const handleSend = () => {
  const content = inputValue.value.trim();
  if (!content || isRunning.value) return;

  // 无论输入什么，Agent 内部都会处理为固定响应
  sendMessage(content);
  inputValue.value = '';
};

// Handle suggestion click
const handleSuggestion = (value: string) => {
  if (isRunning.value) return;
  sendMessage(value);
};

// Handle keydown
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

// Format timestamp
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Parse tool arguments for display
const parseToolArgs = (args: string): any => {
  try {
    return JSON.parse(args);
  } catch {
    return args;
  }
};
</script>

<template>
  <div class="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-2xl">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-800">AG-UI Calculator Demo</h1>
          <p class="text-xs text-slate-500">后端服务: http://localhost:3001</p>
        </div>
      </div>
      
      <button 
        @click="clearMessages" 
        :disabled="isRunning"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        清空
      </button>
    </header>

    <!-- Messages -->
    <div 
      ref="messagesContainer" 
      class="flex-1 overflow-y-auto scrollbar-thin bg-slate-50/50"
    >
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full px-6 py-12">
        <div class="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
          <span class="text-4xl">🧮</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">计算器工具调用演示</h2>
        <p class="text-slate-500 text-center max-w-md mb-2">
          基于 AG-UI 协议的标准化工具调用示例
        </p>
        <p class="text-sm text-slate-400 text-center max-w-md mb-8">
          无论输入什么内容，都会执行固定的计算器示例<br>
          响应配置来自 <code class="px-2 py-1 bg-slate-100 rounded text-slate-600">mock-responses.json</code>
        </p>
        
        <!-- Suggestions -->
        <div class="flex flex-wrap justify-center gap-3">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.value"
            @click="handleSuggestion(suggestion.value)"
            :disabled="isRunning"
            class="flex flex-col items-center gap-1 px-6 py-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="text-lg">{{ suggestion.label }}</span>
            <span class="text-xs text-emerald-600/70">{{ suggestion.desc }}</span>
          </button>
        </div>
      </div>

      <!-- Message list -->
      <div v-else class="px-4 py-6 space-y-6">
        <div
          v-for="message in messages"
          :key="message.id"
          class="animate-fade-in-up"
        >
          <!-- User Message -->
          <div v-if="message.role === 'user'" class="flex items-start gap-3 justify-end">
            <div class="flex flex-col items-end max-w-[80%]">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-slate-400">{{ formatTime(message.timestamp) }}</span>
                <span class="text-xs font-medium text-slate-600">我</span>
              </div>
              <div class="px-5 py-3 bg-emerald-600 text-white rounded-2xl rounded-tr-sm shadow-md">
                <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ message.content }}</p>
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
              <span class="text-sm">👤</span>
            </div>
          </div>

          <!-- Assistant Message -->
          <div v-else-if="message.role === 'assistant'" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span class="text-sm">🤖</span>
            </div>
            <div class="flex flex-col max-w-[80%]">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-slate-600">AI 助手</span>
                <span class="text-xs text-slate-400">{{ formatTime(message.timestamp) }}</span>
              </div>
              
              <!-- Text Content -->
              <div class="px-5 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {{ message.content }}
                  <span v-if="message.isStreaming" class="inline-block w-2 h-4 ml-0.5 bg-emerald-500 animate-blink"></span>
                </p>
              </div>

              <!-- Tool Calls -->
              <div v-if="message.toolCalls && message.toolCalls.length > 0" class="mt-3 space-y-2">
                <div
                  v-for="toolCall in message.toolCalls"
                  :key="toolCall.id"
                  class="overflow-hidden rounded-xl border border-amber-200 bg-amber-50"
                >
                  <!-- Tool Header -->
                  <div class="flex items-center gap-2 px-4 py-2 bg-amber-100/50 border-b border-amber-200">
                    <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="text-sm font-semibold text-amber-800">{{ toolCall.name }}</span>
                    <span class="text-xs text-amber-600/70 ml-auto">工具调用</span>
                  </div>
                  
                  <!-- Arguments -->
                  <div class="px-4 py-3">
                    <div class="text-xs text-amber-700/70 mb-1.5 font-medium uppercase tracking-wide">参数</div>
                    <pre class="text-xs text-slate-600 bg-white/60 rounded-lg p-3 overflow-x-auto">{{ parseToolArgs(toolCall.arguments) }}</pre>
                  </div>
                  
                  <!-- Result -->
                  <div v-if="toolCall.result" class="px-4 py-3 border-t border-amber-200/50">
                    <div class="text-xs text-amber-700/70 mb-1.5 font-medium uppercase tracking-wide">返回结果</div>
                    <pre class="text-xs text-slate-600 bg-white/60 rounded-lg p-3 overflow-x-auto">{{ toolCall.result }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tool Result Message -->
          <div v-else-if="message.role === 'tool'" class="flex items-start gap-3 ml-11">
            <div class="flex flex-col max-w-[70%]">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-emerald-600">工具返回</span>
                <span class="text-xs text-slate-400">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl rounded-tl-sm">
                <pre class="text-xs text-emerald-800 overflow-x-auto whitespace-pre-wrap">{{ message.content }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Current tool call indicator -->
        <div v-if="currentToolCall" class="flex items-start gap-3 animate-fade-in-up">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <span class="text-sm">🤖</span>
          </div>
          <div class="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <div class="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm text-amber-800">
              正在调用 <span class="font-semibold">{{ currentToolCall.name }}</span>...
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="px-4 py-4 bg-white border-t border-slate-200">
      <div class="flex items-end gap-3 max-w-4xl mx-auto">
        <div class="flex-1 relative">
          <input
            v-model="inputValue"
            type="text"
            placeholder="输入任意内容都会执行计算器示例..."
            :disabled="isRunning"
            @keydown="handleKeydown"
            class="w-full px-5 py-3.5 pr-12 bg-slate-100 border-0 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            ↵
          </div>
        </div>
        
        <!-- 发送按钮 / 终止按钮 -->
        <button
          v-if="!isRunning"
          @click="handleSend"
          :disabled="!inputValue.trim()"
          :class="[
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 shadow-lg',
            inputValue.trim()
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-0.5'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
        
        <!-- 终止按钮 -->
        <button
          v-else
          @click="abortRun"
          class="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-red-200 hover:-translate-y-0.5"
          title="终止响应"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <p class="text-center text-xs text-slate-400 mt-3">
        提示：无论输入什么内容，都会执行 <code class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">1 + 1</code> 的计算示例 · 修改 
        <code class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">src/agent/mock-responses.json</code> 可调整响应
      </p>
    </div>
  </div>
</template>
