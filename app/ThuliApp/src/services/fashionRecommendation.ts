/**
 * Fashion Recommendation API Service - Simplified Version
 * Communicates with the new Python backend using 3 simple endpoints
 */

interface RecommendationItem {
  item_id: string | null;
  item_vector: number[] | null;
  similarity_score: number;
  image_paths: string[];
  attributes: string[];
  catalog_exhausted?: boolean;
  total_items_seen?: number;
  total_filtered_items?: number;
}

interface PreferenceVectorResponse {
  success: boolean;
  preference_vector: number[];
  message: string;
}

interface ActionResponse {
  success: boolean;
  updated_preference_vector: number[];
  action: string;
  message: string;
}

interface RecommendationResponse {
  success: boolean;
  recommendation: RecommendationItem;
  message: string;
}

interface ImageUploadResponse {
  success: boolean;
  message: string;
  match_result: {
    item_id: string;
    image_path: string;
    similarity_score: number;
    query_features: number[];
  };
  updated_preference_vector: number[];
  new_recommendation: RecommendationItem;
}

interface StyleDescriptionResponse {
  success: boolean;
  message: string;
  analysis_result: {
    extracted_attributes: {
      color?: string[];
      style?: string[];
      occasion?: string[];
      fit?: string[];
      material?: string[];
      pattern?: string[];
    };
    confidence: number;
    summary: string;
  };
  updated_preference_vector: number[];
  new_recommendation: RecommendationItem;
}

class FashionRecommendationService {
  private readonly baseUrl: string;
  private isConnected: boolean = false;
  private preferenceVector: number[] | null = null; // In-memory cache for preference vector

  constructor(baseUrl: string = 'http://192.168.1.9:5001') {
    this.baseUrl = baseUrl;
  }

  // Test connection to the API
  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      this.isConnected = data.status === 'healthy';
      return this.isConnected;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Construct initial preference vector
  public async constructPreferenceVector(
    gender: string,
    country: string,
    clothingOptions: string[]
  ): Promise<PreferenceVectorResponse> {
    try {
      console.log('🎯 Constructing preference vector for:', { gender, country, clothingOptions });

      const clothingOptionsStr = clothingOptions.join(',');
      const url = `${this.baseUrl}/api/constructpreferencevector?gender=${encodeURIComponent(gender)}&country=${encodeURIComponent(country)}&clothing_options=${encodeURIComponent(clothingOptionsStr)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Preference vector constructed:', data.message);

      // Store the preference vector for future use
      if (data.success && data.preference_vector) {
        this.preferenceVector = data.preference_vector;
      }

      return data;
    } catch (error) {
      console.error('❌ Error constructing preference vector:', error);
      throw new Error(`Failed to construct preference vector: ${error}`);
    }
  }

  // Update preference vector based on user action
  public async updatePreferenceVector(
    preferenceVector: number[],
    itemVector: number[],
    action: 'like' | 'dislike' | 'superlike'
  ): Promise<ActionResponse> {
    try {
      console.log('🔄 Updating preference vector with action:', action);

      const prefVecStr = preferenceVector.join(',');
      const itemVecStr = itemVector.join(',');
      const url = `${this.baseUrl}/api/action?preference_vector=${encodeURIComponent(prefVecStr)}&item_vector=${encodeURIComponent(itemVecStr)}&action=${action}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Preference vector updated:', data.message);

      // Update the stored preference vector
      if (data.success && data.updated_preference_vector) {
        this.preferenceVector = data.updated_preference_vector;
      }

      return data;
    } catch (error) {
      console.error('❌ Error updating preference vector:', error);
      throw new Error(`Failed to update preference vector: ${error}`);
    }
  }

  // Get next recommendation
  public async getRecommendation(preferenceVector: number[]): Promise<RecommendationResponse> {
    try {
      console.log('🎯 Getting recommendation');

      const prefVecStr = preferenceVector.join(',');
      const url = `${this.baseUrl}/api/recommendations?preference_vector=${encodeURIComponent(prefVecStr)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Recommendation received:', data.message);

      return data;
    } catch (error) {
      console.error('❌ Error getting recommendation:', error);
      throw new Error(`Failed to get recommendation: ${error}`);
    }
  }

  // Get current preference vector from memory
  public getPreferenceVector(): number[] | null {
    return this.preferenceVector;
  }

  // Clear stored preference vector
  public clearPreferenceVector(): void {
    this.preferenceVector = null;
    console.log('✅ Preference vector cleared from memory');
  }

  // Check if preference vector exists
  public hasPreferenceVector(): boolean {
    return this.preferenceVector !== null && this.preferenceVector.length > 0;
  }

  // Get connection status
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Upload image and find closest match
  public async uploadImage(imageUri: string, userId: string = 'default'): Promise<ImageUploadResponse> {
    try {
      console.log('🖼️ Uploading image for analysis');

      // Convert image URI to FormData
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'uploaded_image.jpg',
      } as any);

      const currentVector = this.preferenceVector || [];
      const prefVecStr = currentVector.join(',');

      const url = `${this.baseUrl}/api/upload-image?user_id=${encodeURIComponent(userId)}&current_preference_vector=${encodeURIComponent(prefVecStr)}`;

      const response = await fetch(url, {
        method: 'POST',
        // Let React Native set the multipart boundary header automatically
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Image uploaded and analyzed:', data.message);

      // Update the stored preference vector
      if (data.success && data.updated_preference_vector) {
        this.preferenceVector = data.updated_preference_vector;
      }

      return data;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  // Describe style and update preferences
  public async describeStyle(description: string, userId: string = 'default'): Promise<StyleDescriptionResponse> {
    try {
      console.log('💬 Analyzing style description:', description.substring(0, 50) + '...');

      const currentVector = this.preferenceVector || [];
      const prefVecStr = currentVector.join(',');

      const url = `${this.baseUrl}/api/describe-style?description=${encodeURIComponent(description)}&user_id=${encodeURIComponent(userId)}&current_preference_vector=${encodeURIComponent(prefVecStr)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Style description analyzed:', data.message);

      // Update the stored preference vector
      if (data.success && data.updated_preference_vector) {
        this.preferenceVector = data.updated_preference_vector;
      }

      return data;
    } catch (error) {
      console.error('❌ Error analyzing style description:', error);
      throw new Error(`Failed to analyze style description: ${error}`);
    }
  }
}

// Export singleton instance
const fashionRecommendationService = new FashionRecommendationService();
export default fashionRecommendationService;