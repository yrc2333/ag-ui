// Agent 配置 - HTTP 服务
import { type Agent } from '../types/ag-ui';
import { createHttpAgent } from '../agent/http-agent';

// ==================== 配置 ====================

export interface AgentConfig {
  http: {
    baseUrl: string;
    endpoint?: string;
  };
}

/**
 * 默认配置 - 使用 HTTP 服务
 */
const DEFAULT_CONFIG: AgentConfig = {
  http: {
    baseUrl: 'http://localhost:3001',
    endpoint: '/api/agent/run',
  },
};

// ==================== Agent 工厂 ====================

/**
 * 创建 HTTP Agent 实例
 */
export function createAgent(config: AgentConfig = DEFAULT_CONFIG): Agent {
  if (!config.http?.baseUrl) {
    throw new Error('HTTP agent requires baseUrl');
  }
  console.log(`[Agent] 连接服务: ${config.http.baseUrl}`);
  return createHttpAgent(config.http.baseUrl);
}

// ==================== 导出配置 ====================
export { DEFAULT_CONFIG };
