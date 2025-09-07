// Environment Configuration Service
// This service handles loading environment variables for the app

import { Platform } from 'react-native';

class EnvironmentService {
  private config: { [key: string]: string } = {};

  constructor() {
    this.loadConfiguration();
  }

  private loadConfiguration() {
    // For React Native, we need to manually load environment variables
    // In development, you can set these directly or load from a config file
    
    // Default development configuration
    this.config = {
      API_BASE_URL: 'http://localhost:3000/api',
      ENVIRONMENT: __DEV__ ? 'development' : 'production',
      // GEMINI_API_KEY will be set manually for security
    };

    console.log('📋 Environment loaded:', this.config.ENVIRONMENT);
  }

  // Get environment variable
  public get(key: string): string | undefined {
    return this.config[key];
  }

  // Set environment variable (for runtime configuration)
  public set(key: string, value: string): void {
    this.config[key] = value;
    console.log(`✅ Environment variable '${key}' updated`);
  }

  // Get Gemini API key
  public getGeminiApiKey(): string | undefined {
    return this.config.GEMINI_API_KEY;
  }

  // Set Gemini API key
  public setGeminiApiKey(apiKey: string): void {
    this.config.GEMINI_API_KEY = apiKey;
    console.log('🔑 Gemini API key configured');
  }

  // Check if in development mode
  public isDevelopment(): boolean {
    return this.config.ENVIRONMENT === 'development';
  }

  // Get API base URL
  public getApiBaseUrl(): string {
    return this.config.API_BASE_URL || 'http://localhost:3000/api';
  }

  // Load from secrets.env file (manual implementation)
  public async loadFromSecretsFile(): Promise<void> {
    try {
      // In a real implementation, you would read the secrets.env file
      // For now, this is a placeholder that you can extend
      
      // Example of how to manually load secrets:
      // 1. Read the ../../secrets.env file
      // 2. Parse key=value pairs
      // 3. Set them in this.config
      
      console.log('💡 To load secrets automatically, implement file reading logic here');
      console.log('💡 For now, use the "Setup API Key" button in the app');
    } catch (error) {
      console.error('Failed to load secrets file:', error);
    }
  }

  // Helper method to validate configuration
  public validateGeminiSetup(): { isValid: boolean; message: string } {
    const apiKey = this.getGeminiApiKey();
    
    if (!apiKey) {
      return {
        isValid: false,
        message: 'Gemini API key not configured. Please set it up to enable AI chat.',
      };
    }
    
    if (apiKey.length < 20) {
      return {
        isValid: false,
        message: 'API key appears to be invalid. Please check your Gemini API key.',
      };
    }
    
    return {
      isValid: true,
      message: 'Gemini API configuration is valid.',
    };
  }

  // Debug info
  public getDebugInfo(): string {
    const validation = this.validateGeminiSetup();
    return `
Environment: ${this.config.ENVIRONMENT}
API Base URL: ${this.config.API_BASE_URL}
Gemini API Key: ${this.config.GEMINI_API_KEY ? 'Configured' : 'Not Set'}
Validation: ${validation.message}
Platform: ${Platform.OS}
Development Mode: ${this.isDevelopment()}
    `.trim();
  }
}

// Singleton instance
export const environmentService = new EnvironmentService();
export default environmentService;



