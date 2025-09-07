// User Profile Service
// Manages user profile data and preferences for personalized recommendations

interface UserProfile {
  gender: 'MEN' | 'WOMEN';
  ageGroup: string;
  location: {
    continent: string;
    country: string;
  };
  clothingPreferences: string[];
  createdAt: Date;
  lastUpdated: Date;
}

class UserProfileService {
  private profile: UserProfile | null = null;

  // Save user profile
  public saveProfile(profile: Omit<UserProfile, 'createdAt' | 'lastUpdated'>): void {
    const now = new Date();
    this.profile = {
      ...profile,
      createdAt: now,
      lastUpdated: now,
    };
    
    console.log('✅ User profile saved:', this.profile);
  }

  // Get user profile
  public getProfile(): UserProfile | null {
    return this.profile;
  }

  // Update specific profile fields
  public updateProfile(updates: Partial<UserProfile>): void {
    if (!this.profile) {
      console.warn('⚠️ No profile to update');
      return;
    }

    this.profile = {
      ...this.profile,
      ...updates,
      lastUpdated: new Date(),
    };
    
    console.log('✅ User profile updated:', this.profile);
  }

  // Get personalized recommendations based on profile
  public getPersonalizedRecommendations(): {
    gender: string;
    ageGroup: string;
    location: string;
    clothingTypes: string[];
    recommendationContext: string;
  } {
    if (!this.profile) {
      return {
        gender: 'Unknown',
        ageGroup: 'Unknown',
        location: 'Unknown',
        clothingTypes: [],
        recommendationContext: 'No profile available',
      };
    }

    return {
      gender: this.profile.gender === 'MEN' ? 'Men\'s' : 'Women\'s',
      ageGroup: this.profile.ageGroup,
      location: `${this.profile.location.country}, ${this.profile.location.continent}`,
      clothingTypes: this.profile.clothingPreferences,
      recommendationContext: `Personalized for ${this.profile.gender === 'MEN' ? 'men' : 'women'} aged ${this.profile.ageGroup} in ${this.profile.location.country} interested in ${this.profile.clothingPreferences.length} clothing categories`,
    };
  }

  // Check if profile is complete
  public isProfileComplete(): boolean {
    if (!this.profile) return false;
    
    return !!(
      this.profile.gender &&
      this.profile.ageGroup &&
      this.profile.location?.continent &&
      this.profile.location?.country &&
      this.profile.clothingPreferences?.length &&
      this.profile.clothingPreferences.length > 0
    );
  }

  // Get profile summary for display
  public getProfileSummary(): string {
    if (!this.profile) return 'No profile available';
    
    return `${this.profile.gender === 'MEN' ? 'Men\'s' : 'Women\'s'} fashion • ${this.profile.ageGroup} • ${this.profile.location.country} • ${this.profile.clothingPreferences.length} categories`;
  }

  // Clear profile (for testing or logout)
  public clearProfile(): void {
    this.profile = null;
    console.log('🗑️ User profile cleared');
  }

  // Get clothing preferences for AI recommendations
  public getClothingPreferencesForAI(): string {
    if (!this.profile || !this.profile.clothingPreferences.length) {
      return 'general fashion';
    }

    return this.profile.clothingPreferences.join(', ');
  }

  // Get location context for regional preferences
  public getLocationContext(): string {
    if (!this.profile) return 'global';
    
    return `${this.profile.location.country} fashion trends and preferences`;
  }

  // Get age-appropriate context
  public getAgeContext(): string {
    if (!this.profile) return 'all ages';
    
    const ageGroup = this.profile.ageGroup;
    if (ageGroup === '0-15') return 'youth and teen fashion';
    if (ageGroup === '15-18') return 'teen and young adult fashion';
    if (ageGroup === '18-23') return 'young adult and college fashion';
    if (ageGroup === '23-30') return 'young professional fashion';
    if (ageGroup === '30-40') return 'professional and mature fashion';
    if (ageGroup === '40-50') return 'mature professional fashion';
    if (ageGroup === '50+') return 'mature and classic fashion';
    
    return 'age-appropriate fashion';
  }
}

// Export singleton instance
const userProfileService = new UserProfileService();
export default userProfileService;
