import {
  Plugin,
  IAgentRuntime,
  ModelType,
  ModelTypeName,
  GenerateTextParams,
  TokenizeTextParams,
  DetokenizeTextParams,
  logger,
} from '@elizaos/core';
import { fetch } from 'undici';

interface MiraError {
  message?: string;
  statusText?: string;
}

interface MiraMessage {
  role: string;
  content: string;
}

interface MiraChoice {
  message: MiraMessage;
}

interface MiraResponse {
  data: {
    choices: MiraChoice[];
  };
}

/**
 * Helper function to get the API key for Mira
 */
function getApiKey(runtime: IAgentRuntime): string | undefined {
  const apiKey = runtime.getSetting('MIRA_API_KEY');
  logger.debug(`[Mira Plugin] API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`);
  return apiKey;
}

/**
 * Helper function to get the model name with fallbacks
 */
function getModel(runtime: IAgentRuntime): string {
  const model = runtime.getSetting('MIRA_MODEL') ?? 'llama-3.1-8b-instruct';
  logger.debug(`[Mira Plugin] Model: ${model}`);
  return model;
}

export const miraPlugin: Plugin = {
  name: 'mira',
  description: 'Mira LLM integration',
  config: {
    MIRA_API_KEY: process.env.MIRA_API_KEY,
    MIRA_MODEL: process.env.MIRA_MODEL,
  },
  async init(_config, runtime) {
    try {
      const apiKey = getApiKey(runtime);
      logger.debug(
        `[Mira Plugin] Initializing with API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`
      );

      if (!apiKey) {
        logger.warn('MIRA_API_KEY is not set in environment - Mira functionality will be limited');
        return;
      }

      try {
        logger.debug('[Mira Plugin] Validating API key...');
        const response = await fetch('https://api.mira.network/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        logger.debug(`[Mira Plugin] Validation response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          logger.warn(`Mira API key validation failed: ${response.status} ${response.statusText}`);
          logger.warn(`Error details: ${errorText}`);
          logger.warn('Mira functionality will be limited until a valid API key is provided');
        } else {
          const data = await response.json();
          logger.log('Mira API key validated successfully');
          logger.debug(`Available models: ${JSON.stringify(data)}`);
        }
      } catch (fetchError: unknown) {
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        logger.warn(`Error validating Mira API key: ${message}`);
        logger.warn('Mira functionality will be limited until a valid API key is provided');
      }
    } catch (error) {
      const message =
        (error as { errors?: Array<{ message: string }> })?.errors
          ?.map((e) => e.message)
          .join(', ') || (error instanceof Error ? error.message : String(error));
      logger.warn(
        `Mira plugin configuration issue: ${message} - You need to configure the MIRA_API_KEY in your environment variables`
      );
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (runtime: IAgentRuntime, params: GenerateTextParams) => {
      const { prompt, maxTokens = 2048, temperature = 0.7 } = params;
      const modelName = getModel(runtime);
      const apiKey = getApiKey(runtime);

      logger.log('generating text');
      logger.log(prompt);
      logger.debug(`[Mira Plugin] Using model: ${modelName}`);
      logger.debug(
        `[Mira Plugin] API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`
      );

      if (!apiKey) {
        throw new Error('Mira API key not configured');
      }

      // Add a delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const requestBody = {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature,
      };

      logger.debug(`[Mira Plugin] Request body: ${JSON.stringify(requestBody)}`);

      const response = await fetch('https://api.mira.network/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      logger.debug(`[Mira Plugin] Response status: ${response.status}`);
      logger.debug(
        `[Mira Plugin] Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]))}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Mira API error: ${response.status} - ${response.statusText}`);
        logger.error(`Error details: ${errorText}`);
        throw new Error(`Mira API error: ${response.status} - ${response.statusText}`);
      }

      const data = (await response.json()) as MiraResponse;
      logger.debug(`[Mira Plugin] Response data: ${JSON.stringify(data)}`);
      return data.data.choices[0].message.content;
    },
    [ModelType.TEXT_LARGE]: async (runtime: IAgentRuntime, params: GenerateTextParams) => {
      // Use the same implementation as TEXT_SMALL for now
      return miraPlugin.models[ModelType.TEXT_SMALL](runtime, params);
    },
  },
};

export default miraPlugin;
