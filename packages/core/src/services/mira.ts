import { Service, ServiceType, IAgentRuntime } from '../types';
import { MiraClient } from '@mira-network/node-sdk';
import settings from '../settings';

export class MiraService extends Service {
    private client: MiraClient | null = null;

    static get serviceType(): ServiceType {
        return ServiceType.MIRA_NETWORK;
    }

    get serviceType(): ServiceType {
        return MiraService.serviceType;
    }

    async initialize(runtime: IAgentRuntime): Promise<void> {
        const baseURL = runtime.character.modelEndpointOverride || settings.MIRA_API_URL;
        this.client = new MiraClient({
            apiKey: runtime.token || settings.MIRA_API_KEY,
            baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
        });
        runtime.miraClient = this.client;
    }

    async listModels(): Promise<any> {
        if (!this.client) throw new Error('Mira client not initialized');
        return await this.client.listModels();
    }

    async getUserCredits(): Promise<any> {
        if (!this.client) throw new Error('Mira client not initialized');
        return await this.client.getUserCredits();
    }

    async getCreditsHistory(): Promise<any> {
        if (!this.client) throw new Error('Mira client not initialized');
        return await this.client.getCreditsHistory();
    }

    async listApiTokens(): Promise<any> {
        if (!this.client) throw new Error('Mira client not initialized');
        return await this.client.listApiTokens();
    }

    async createApiToken(params: {
        name: string;
        expiration: string;
        permissions: string[];
    }): Promise<any> {
        if (!this.client) throw new Error('Mira client not initialized');
        return await this.client.createApiToken(params);
    }

    async deleteApiToken(tokenId: string): Promise<void> {
        if (!this.client) throw new Error('Mira client not initialized');
        await this.client.deleteApiToken(tokenId);
    }
} 
