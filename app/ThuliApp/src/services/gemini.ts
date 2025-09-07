// Gemini AI API Integration Service
// Add your GEMINI_API_KEY to secrets.env file in project root

import { GEMINI_API_KEY } from '@env';
import environmentService from './environment';
import userProfileService from './userProfile';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GeminiError {
  error: {
    message: string;
    code: number;
  };
}

class GeminiService {
  private apiKey: string = '';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.loadApiKey();
  }

  private loadApiKey() {
    // Load API key from environment variables
    this.apiKey = GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.log('🔑 Gemini API Key: Not configured');
      console.log('💡 Add GEMINI_API_KEY to secrets.env file');
      console.log('📖 Get your key from: https://makersuite.google.com/app/apikey');
    } else {
      console.log('✅ Gemini API Key: Loaded from environment');
      environmentService.setGeminiApiKey(this.apiKey);
    }
  }

  // Set API key manually (for quick setup)
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    environmentService.setGeminiApiKey(apiKey);
    console.log('✅ Gemini API Key updated and saved');
  }

  // Send message to Gemini AI with multiple model fallbacks
  public async sendMessage(message: string, conversationHistory: string[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add your API key to secrets.env or call setApiKey().');
    }

    // Try different model names in order of preference
    const models = [
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-1.5-pro',
      'text-bison-001'
    ];

    for (const modelName of models) {
      try {
        console.log(`🚀 Trying Gemini model: ${modelName}...`);
        
        // Build context from conversation history
        const context = conversationHistory.length > 0 
          ? `Previous conversation:\n${conversationHistory.join('\n')}\n\nCurrent message: ${message}`
          : message;

        // Build personalized context based on user profile
        const profile = userProfileService.getProfile();
        let personalizedPrompt = `You are an AI fashion assistant for a hackathon project. Be helpful and concise.`;
        
        if (profile) {
          const recommendations = userProfileService.getPersonalizedRecommendations();
          personalizedPrompt = `You are a personalized AI fashion assistant. The user is interested in ${recommendations.gender} fashion, specifically ${recommendations.clothingTypes.join(', ')}. They are ${recommendations.ageGroup} and located in ${recommendations.location}. Provide fashion advice, styling tips, and recommendations tailored to their preferences and demographics. Be helpful, concise, and fashion-focused.`;
        }

        const requestBody = {
          contents: [{
            parts: [{
              text: `${personalizedPrompt}\n\nUser message: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          }
        };

        const response = await fetch(
          `${this.baseUrl}/models/${modelName}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ Model ${modelName} failed:`, errorText);
          
          // If this is the last model, throw the error
          if (modelName === models[models.length - 1]) {
            throw new Error(`API Error: ${response.status} - ${errorText}`);
          }
          
          // Otherwise, try the next model
          continue;
        }

        const data: GeminiResponse = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('No response generated from Gemini API');
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log(`✅ Success with model: ${modelName}`);
        
        return aiResponse;
      } catch (error) {
        console.error(`❌ Error with model ${modelName}:`, error);
        
        // If this is the last model, handle the error
        if (modelName === models[models.length - 1]) {
          if (error instanceof Error) {
            // Handle specific errors
            if (error.message.includes('API key')) {
              return 'Please configure your Gemini API key to enable AI responses. You can get one from Google AI Studio.';
            }
            if (error.message.includes('quota') || error.message.includes('limit')) {
              return 'API quota exceeded. Please check your Gemini API usage limits.';
            }
            if (error.message.includes('network') || error.message.includes('fetch')) {
              return 'Network error. Please check your internet connection and try again.';
            }
            if (error.message.includes('not found') || error.message.includes('not supported')) {
              return 'The Gemini API model is not available. This might be a temporary issue. Please try again in a few moments.';
            }
            
            return `AI service error: ${error.message}`;
          }
          
          return 'Sorry, I encountered an error with all available AI models. Please try again later.';
        }
        
        // Try the next model
        continue;
      }
    }

    return 'Unable to connect to any AI models. Please check your API key and try again.';
  }

  // Helper method for image analysis (for future CV features)
  public async analyzeImage(imageBase64: string, prompt: string = 'What do you see in this image?'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.8,
          topK: 32,
          maxOutputTokens: 1024,
        }
      };

      const response = await fetch(
        `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini Vision API Error:', error);
      throw error;
    }
  }

  // Test API connectivity with detailed debugging
  public async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const response = await this.sendMessage('Hello');
      return {
        success: true,
        message: 'Gemini API is working correctly!',
        model: 'Connected successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Quick test method for debugging
  public async quickTest(): Promise<string> {
    console.log('🔍 Testing Gemini API...');
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'Not set');
    
    try {
      const result = await this.sendMessage('Say "API Test Successful" if you can read this');
      console.log('✅ Gemini API test passed');
      return result;
    } catch (error) {
      console.error('❌ Gemini API test failed:', error);
      return `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

// Singleton instance
export const geminiService = new GeminiService();
export default geminiService;
