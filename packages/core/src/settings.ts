import { config } from "dotenv";
import fs from "fs";
import path from "path";
import elizaLogger from "./logger.ts";

elizaLogger.info("Loading embedding settings:", {
    USE_OPENAI_EMBEDDING: process.env.USE_OPENAI_EMBEDDING,
    USE_OLLAMA_EMBEDDING: process.env.USE_OLLAMA_EMBEDDING,
    OLLAMA_EMBEDDING_MODEL:
        process.env.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large",
});

// Add this logging block
elizaLogger.info("Loading character settings:", {
    CHARACTER_PATH: process.env.CHARACTER_PATH,
    ARGV: process.argv,
    CHARACTER_ARG: process.argv.find((arg) => arg.startsWith("--character=")),
    CWD: process.cwd(),
});

interface Settings {
    [key: string]: string | undefined;
}

interface NamespacedSettings {
    [namespace: string]: Settings;
}

let environmentSettings: Settings = {};

/**
 * Determines if code is running in a browser environment
 * @returns {boolean} True if in browser environment
 */
const isBrowser = (): boolean => {
    return (
        typeof window !== "undefined" && typeof window.document !== "undefined"
    );
};

/**
 * Recursively searches for a .env file starting from the current directory
 * and moving up through parent directories (Node.js only)
 * @param {string} [startDir=process.cwd()] - Starting directory for the search
 * @returns {string|null} Path to the nearest .env file or null if not found
 */
export function findNearestEnvFile(startDir = process.cwd()) {
    if (isBrowser()) return null;

    let currentDir = startDir;

    // Continue searching until we reach the root directory
    while (currentDir !== path.parse(currentDir).root) {
        const envPath = path.join(currentDir, ".env");

        if (fs.existsSync(envPath)) {
            return envPath;
        }

        // Move up to parent directory
        currentDir = path.dirname(currentDir);
    }

    // Check root directory as well
    const rootEnvPath = path.join(path.parse(currentDir).root, ".env");
    return fs.existsSync(rootEnvPath) ? rootEnvPath : null;
}

/**
 * Configures environment settings for browser usage
 * @param {Settings} settings - Object containing environment variables
 */
export function configureSettings(settings: Settings) {
    environmentSettings = { ...settings };
}

/**
 * Loads environment variables from the nearest .env file in Node.js
 * or returns configured settings in browser
 * @returns {Settings} Environment variables object
 * @throws {Error} If no .env file is found in Node.js environment
 */
export function loadEnvConfig(): Settings {
    // For browser environments, return the configured settings
    if (isBrowser()) {
        return environmentSettings;
    }

    // Node.js environment: load from .env file
    const envPath = findNearestEnvFile();

    // attempt to Load the .env file into process.env
    const result = config(envPath ? { path: envPath } : {});

    if (!result.error) {
        elizaLogger.log(`Loaded .env file from: ${envPath}`);
    }

    // Parse namespaced settings
    const namespacedSettings = parseNamespacedSettings(process.env as Settings);

    // Attach to process.env for backward compatibility
    Object.entries(namespacedSettings).forEach(([namespace, settings]) => {
        process.env[`__namespaced_${namespace}`] = JSON.stringify(settings);
    });

    return process.env as Settings;
}

/**
 * Gets a specific environment variable
 * @param {string} key - The environment variable key
 * @param {string} [defaultValue] - Optional default value if key doesn't exist
 * @returns {string|undefined} The environment variable value or default value
 */
export function getEnvVariable(
    key: string,
    defaultValue?: string
): string | undefined {
    if (isBrowser()) {
        return environmentSettings[key] || defaultValue;
    }
    return process.env[key] || defaultValue;
}

/**
 * Checks if a specific environment variable exists
 * @param {string} key - The environment variable key
 * @returns {boolean} True if the environment variable exists
 */
export function hasEnvVariable(key: string): boolean {
    if (isBrowser()) {
        return key in environmentSettings;
    }
    return key in process.env;
}

// Initialize settings based on environment
export const settings = isBrowser() ? environmentSettings : loadEnvConfig();

elizaLogger.info("Parsed settings:", {
    USE_OPENAI_EMBEDDING: settings.USE_OPENAI_EMBEDDING,
    USE_OPENAI_EMBEDDING_TYPE: typeof settings.USE_OPENAI_EMBEDDING,
    USE_OLLAMA_EMBEDDING: settings.USE_OLLAMA_EMBEDDING,
    USE_OLLAMA_EMBEDDING_TYPE: typeof settings.USE_OLLAMA_EMBEDDING,
    OLLAMA_EMBEDDING_MODEL:
        settings.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large",
});

export default {
    // ... existing settings ...
    
    // Mira Network settings
    MIRA_API_KEY: process.env.MIRA_API_KEY || '',
    MIRA_API_URL: process.env.MIRA_API_URL || 'https://apis.mira.network',
    SMALL_MIRA_MODEL: process.env.SMALL_MIRA_MODEL || 'claude-3.5-sonnet',
    MEDIUM_MIRA_MODEL: process.env.MEDIUM_MIRA_MODEL || 'claude-3.5-sonnet',
    LARGE_MIRA_MODEL: process.env.LARGE_MIRA_MODEL || 'claude-3.5-sonnet',
    SYSTEM_PROMPT: process.env.SYSTEM_PROMPT || '',
    
    // OpenAI settings
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_API_URL: process.env.OPENAI_API_URL || 'https://api.openai.com',
    SMALL_OPENAI_MODEL: process.env.SMALL_OPENAI_MODEL || 'gpt-4o-mini',
    MEDIUM_OPENAI_MODEL: process.env.MEDIUM_OPENAI_MODEL || 'gpt-4o',
    LARGE_OPENAI_MODEL: process.env.LARGE_OPENAI_MODEL || 'gpt-4o',
    EMBEDDING_OPENAI_MODEL: process.env.EMBEDDING_OPENAI_MODEL || 'text-embedding-3-small',
    IMAGE_OPENAI_MODEL: process.env.IMAGE_OPENAI_MODEL || 'dall-e-3',
    
    // EternalAI settings
    ETERNALAI_URL: process.env.ETERNALAI_URL || '',
    ETERNALAI_MODEL: process.env.ETERNALAI_MODEL || 'neuralmagic/Meta-Llama-3.1-405B-Instruct-quantized.w4a16',
    
    // GaiaNet settings
    GAIANET_API_KEY: process.env.GAIANET_API_KEY || '',
    GAIANET_SERVER_URL: process.env.GAIANET_SERVER_URL || '',
    SMALL_GAIANET_SERVER_URL: process.env.SMALL_GAIANET_SERVER_URL || '',
    MEDIUM_GAIANET_SERVER_URL: process.env.MEDIUM_GAIANET_SERVER_URL || '',
    LARGE_GAIANET_SERVER_URL: process.env.LARGE_GAIANET_SERVER_URL || '',
    GAIANET_MODEL: process.env.GAIANET_MODEL || '',
    SMALL_GAIANET_MODEL: process.env.SMALL_GAIANET_MODEL || '',
    MEDIUM_GAIANET_MODEL: process.env.MEDIUM_GAIANET_MODEL || '',
    LARGE_GAIANET_MODEL: process.env.LARGE_GAIANET_MODEL || '',
    GAIANET_EMBEDDING_MODEL: process.env.GAIANET_EMBEDDING_MODEL || '',
    
    // Anthropic settings
    SMALL_ANTHROPIC_MODEL: process.env.SMALL_ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    MEDIUM_ANTHROPIC_MODEL: process.env.MEDIUM_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    LARGE_ANTHROPIC_MODEL: process.env.LARGE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    
    // Grok settings
    SMALL_GROK_MODEL: process.env.SMALL_GROK_MODEL || 'grok-2-1212',
    MEDIUM_GROK_MODEL: process.env.MEDIUM_GROK_MODEL || 'grok-2-1212',
    LARGE_GROK_MODEL: process.env.LARGE_GROK_MODEL || 'grok-2-1212',
    EMBEDDING_GROK_MODEL: process.env.EMBEDDING_GROK_MODEL || 'grok-2-1212',
    
    // Groq settings
    SMALL_GROQ_MODEL: process.env.SMALL_GROQ_MODEL || 'llama-3.1-8b-instant',
    MEDIUM_GROQ_MODEL: process.env.MEDIUM_GROQ_MODEL || 'llama-3.3-70b-versatile',
    LARGE_GROQ_MODEL: process.env.LARGE_GROQ_MODEL || 'llama-3.2-90b-vision-preview',
    EMBEDDING_GROQ_MODEL: process.env.EMBEDDING_GROQ_MODEL || 'llama-3.1-8b-instant',
    
    // LMStudio settings
    LMSTUDIO_SERVER_URL: process.env.LMSTUDIO_SERVER_URL || '',
    LMSTUDIO_MODEL: process.env.LMSTUDIO_MODEL || '',
    SMALL_LMSTUDIO_MODEL: process.env.SMALL_LMSTUDIO_MODEL || '',
    MEDIUM_LMSTUDIO_MODEL: process.env.MEDIUM_LMSTUDIO_MODEL || '',
    LARGE_LMSTUDIO_MODEL: process.env.LARGE_LMSTUDIO_MODEL || '',
    
    // Google settings
    SMALL_GOOGLE_MODEL: process.env.SMALL_GOOGLE_MODEL || '',
    MEDIUM_GOOGLE_MODEL: process.env.MEDIUM_GOOGLE_MODEL || '',
    LARGE_GOOGLE_MODEL: process.env.LARGE_GOOGLE_MODEL || '',
    EMBEDDING_GOOGLE_MODEL: process.env.EMBEDDING_GOOGLE_MODEL || '',
    GOOGLE_MODEL: process.env.GOOGLE_MODEL || '',
    
    // Mistral settings
    SMALL_MISTRAL_MODEL: process.env.SMALL_MISTRAL_MODEL || '',
    MEDIUM_MISTRAL_MODEL: process.env.MEDIUM_MISTRAL_MODEL || '',
    LARGE_MISTRAL_MODEL: process.env.LARGE_MISTRAL_MODEL || '',
    MISTRAL_MODEL: process.env.MISTRAL_MODEL || '',
    
    // Redpill settings
    SMALL_REDPILL_MODEL: process.env.SMALL_REDPILL_MODEL || '',
    MEDIUM_REDPILL_MODEL: process.env.MEDIUM_REDPILL_MODEL || '',
    LARGE_REDPILL_MODEL: process.env.LARGE_REDPILL_MODEL || '',
    REDPILL_MODEL: process.env.REDPILL_MODEL || '',
    
    // OpenRouter settings
    SMALL_OPENROUTER_MODEL: process.env.SMALL_OPENROUTER_MODEL || '',
    MEDIUM_OPENROUTER_MODEL: process.env.MEDIUM_OPENROUTER_MODEL || '',
    LARGE_OPENROUTER_MODEL: process.env.LARGE_OPENROUTER_MODEL || '',
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || '',
    
    // Ollama settings
    OLLAMA_SERVER_URL: process.env.OLLAMA_SERVER_URL || '',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || '',
    SMALL_OLLAMA_MODEL: process.env.SMALL_OLLAMA_MODEL || '',
    MEDIUM_OLLAMA_MODEL: process.env.MEDIUM_OLLAMA_MODEL || '',
    LARGE_OLLAMA_MODEL: process.env.LARGE_OLLAMA_MODEL || '',
    
    // Heurist settings
    SMALL_HEURIST_MODEL: process.env.SMALL_HEURIST_MODEL || '',
    MEDIUM_HEURIST_MODEL: process.env.MEDIUM_HEURIST_MODEL || '',
    LARGE_HEURIST_MODEL: process.env.LARGE_HEURIST_MODEL || '',
    HEURIST_IMAGE_MODEL: process.env.HEURIST_IMAGE_MODEL || '',
    
    // Galadriel settings
    SMALL_GALADRIEL_MODEL: process.env.SMALL_GALADRIEL_MODEL || '',
    MEDIUM_GALADRIEL_MODEL: process.env.MEDIUM_GALADRIEL_MODEL || '',
    LARGE_GALADRIEL_MODEL: process.env.LARGE_GALADRIEL_MODEL || '',
    
    // NanoGPT settings
    SMALL_NANOGPT_MODEL: process.env.SMALL_NANOGPT_MODEL || '',
    MEDIUM_NANOGPT_MODEL: process.env.MEDIUM_NANOGPT_MODEL || '',
    LARGE_NANOGPT_MODEL: process.env.LARGE_NANOGPT_MODEL || '',
    
    // Hyperbolic settings
    SMALL_HYPERBOLIC_MODEL: process.env.SMALL_HYPERBOLIC_MODEL || '',
    MEDIUM_HYPERBOLIC_MODEL: process.env.MEDIUM_HYPERBOLIC_MODEL || '',
    LARGE_HYPERBOLIC_MODEL: process.env.LARGE_HYPERBOLIC_MODEL || '',
    HYPERBOLIC_MODEL: process.env.HYPERBOLIC_MODEL || '',
    IMAGE_HYPERBOLIC_MODEL: process.env.IMAGE_HYPERBOLIC_MODEL || '',
    
    // Venice settings
    SMALL_VENICE_MODEL: process.env.SMALL_VENICE_MODEL || '',
    MEDIUM_VENICE_MODEL: process.env.MEDIUM_VENICE_MODEL || '',
    LARGE_VENICE_MODEL: process.env.LARGE_VENICE_MODEL || '',
    IMAGE_VENICE_MODEL: process.env.IMAGE_VENICE_MODEL || '',
    
    // Nvidia settings
    SMALL_NVIDIA_MODEL: process.env.SMALL_NVIDIA_MODEL || '',
    MEDIUM_NVIDIA_MODEL: process.env.MEDIUM_NVIDIA_MODEL || '',
    LARGE_NVIDIA_MODEL: process.env.LARGE_NVIDIA_MODEL || '',
    
    // Nineteen AI settings
    SMALL_NINETEEN_AI_MODEL: process.env.SMALL_NINETEEN_AI_MODEL || '',
    MEDIUM_NINETEEN_AI_MODEL: process.env.MEDIUM_NINETEEN_AI_MODEL || '',
    LARGE_NINETEEN_AI_MODEL: process.env.LARGE_NINETEEN_AI_MODEL || '',
    IMAGE_NINETEEN_AI_MODEL: process.env.IMAGE_NINETEEN_AI_MODEL || '',
    
    // Akash Chat API settings
    SMALL_AKASH_CHAT_API_MODEL: process.env.SMALL_AKASH_CHAT_API_MODEL || '',
    MEDIUM_AKASH_CHAT_API_MODEL: process.env.MEDIUM_AKASH_CHAT_API_MODEL || '',
    LARGE_AKASH_CHAT_API_MODEL: process.env.LARGE_AKASH_CHAT_API_MODEL || '',
    
    // Livepeer settings
    LIVEPEER_GATEWAY_URL: process.env.LIVEPEER_GATEWAY_URL || '',
    SMALL_LIVEPEER_MODEL: process.env.SMALL_LIVEPEER_MODEL || '',
    MEDIUM_LIVEPEER_MODEL: process.env.MEDIUM_LIVEPEER_MODEL || '',
    LARGE_LIVEPEER_MODEL: process.env.LARGE_LIVEPEER_MODEL || '',
    IMAGE_LIVEPEER_MODEL: process.env.IMAGE_LIVEPEER_MODEL || '',
    
    // Infera settings
    SMALL_INFERA_MODEL: process.env.SMALL_INFERA_MODEL || '',
    MEDIUM_INFERA_MODEL: process.env.MEDIUM_INFERA_MODEL || '',
    LARGE_INFERA_MODEL: process.env.LARGE_INFERA_MODEL || '',
    
    // Deepseek settings
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || '',
    SMALL_DEEPSEEK_MODEL: process.env.SMALL_DEEPSEEK_MODEL || '',
    MEDIUM_DEEPSEEK_MODEL: process.env.MEDIUM_DEEPSEEK_MODEL || '',
    LARGE_DEEPSEEK_MODEL: process.env.LARGE_DEEPSEEK_MODEL || '',
    
    // Bedrock settings
    SMALL_BEDROCK_MODEL: process.env.SMALL_BEDROCK_MODEL || '',
    MEDIUM_BEDROCK_MODEL: process.env.MEDIUM_BEDROCK_MODEL || '',
    LARGE_BEDROCK_MODEL: process.env.LARGE_BEDROCK_MODEL || '',
    EMBEDDING_BEDROCK_MODEL: process.env.EMBEDDING_BEDROCK_MODEL || '',
    IMAGE_BEDROCK_MODEL: process.env.IMAGE_BEDROCK_MODEL || '',
    
    // Atoma settings
    ATOMA_API_URL: process.env.ATOMA_API_URL || '',
    SMALL_ATOMA_MODEL: process.env.SMALL_ATOMA_MODEL || '',
    MEDIUM_ATOMA_MODEL: process.env.MEDIUM_ATOMA_MODEL || '',
    LARGE_ATOMA_MODEL: process.env.LARGE_ATOMA_MODEL || '',
    
    // Volengine settings
    VOLENGINE_API_URL: process.env.VOLENGINE_API_URL || '',
    SMALL_VOLENGINE_MODEL: process.env.SMALL_VOLENGINE_MODEL || '',
    MEDIUM_VOLENGINE_MODEL: process.env.MEDIUM_VOLENGINE_MODEL || '',
    LARGE_VOLENGINE_MODEL: process.env.LARGE_VOLENGINE_MODEL || '',
    VOLENGINE_MODEL: process.env.VOLENGINE_MODEL || '',
    VOLENGINE_EMBEDDING_MODEL: process.env.VOLENGINE_EMBEDDING_MODEL || '',
    
    // Embedding settings
    USE_OPENAI_EMBEDDING: process.env.USE_OPENAI_EMBEDDING || 'false',
    USE_OLLAMA_EMBEDDING: process.env.USE_OLLAMA_EMBEDDING || 'true',
    USE_GAIANET_EMBEDDING: process.env.USE_GAIANET_EMBEDDING || 'false',
    USE_HEURIST_EMBEDDING: process.env.USE_HEURIST_EMBEDDING || 'false',
    OLLAMA_EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'mxbai-embed-large',
    
    // Other settings
    INFERA_API_KEY: process.env.INFERA_API_KEY || '',
};

// Add this function to parse namespaced settings
function parseNamespacedSettings(env: Settings): NamespacedSettings {
    const namespaced: NamespacedSettings = {};

    for (const [key, value] of Object.entries(env)) {
        if (!value) continue;

        const [namespace, ...rest] = key.split(".");
        if (!namespace || rest.length === 0) continue;

        const settingKey = rest.join(".");
        namespaced[namespace] = namespaced[namespace] || {};
        namespaced[namespace][settingKey] = value;
    }

    return namespaced;
}
