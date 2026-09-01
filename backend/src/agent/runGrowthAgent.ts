import { run, Runner, setDefaultModelProvider } from '@openai/agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { growthAgent } from './growthAgent.js';

/**
 * Options for executing the AgentRail Growth Agent.
 */
export interface RunGrowthAgentOptions {
  model?: string;
  maxTurns?: number;
}

let isProviderInitialized = false;

/**
 * Resolves and configures the LLM model provider (Groq API or OpenAI API).
 * When GROQ_API_KEY is present in environment, configures the OpenAIProvider
 * with base URL https://api.groq.com/openai/v1 and model openai/gpt-oss-120b.
 */
function getModelProvider(overrideModel?: string): { provider?: OpenAIProvider; model: string } {
  const groqApiKey = process.env.GROQ_API_KEY;
  const defaultModel = groqApiKey ? 'openai/gpt-oss-120b' : 'gpt-4o';
  const selectedModel = overrideModel || defaultModel;

  if (groqApiKey) {
    const groqProvider = new OpenAIProvider({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: groqApiKey,
      useResponses: false,
    });
    if (!isProviderInitialized) {
      setDefaultModelProvider(groqProvider);
      isProviderInitialized = true;
    }
    return { provider: groqProvider, model: selectedModel };
  }

  return { model: selectedModel };
}

/**
 * Executes the AgentRail Growth Agent with a buyer message using the official OpenAI Agents SDK.
 * 
 * @param message The input message/query from the buyer.
 * @param options Optional execution configuration.
 * @returns The final text response produced by the Growth Agent.
 */
export async function runGrowthAgent(message: string, options?: RunGrowthAgentOptions): Promise<string> {
  const { provider, model } = getModelProvider(options?.model);
  const runOptions = options?.maxTurns !== undefined ? { maxTurns: options.maxTurns } : undefined;

  const runner = new Runner({
    ...(provider ? { provider } : {}),
    model,
  });

  const result = await runner.run(growthAgent, message, runOptions);

  if (typeof result.finalOutput === 'string') {
    return result.finalOutput;
  }

  if (result.finalOutput !== undefined && result.finalOutput !== null) {
    return String(result.finalOutput);
  }

  return '';
}


