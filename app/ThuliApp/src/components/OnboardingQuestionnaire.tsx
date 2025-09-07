import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Clothing categories based on gender
const CLOTHING_CATEGORIES = {
  MEN: [
    { id: 'denim', name: 'Denim', icon: '👖' },
    { id: 'jackets_vests', name: 'Jackets & Vests', icon: '🧥' },
    { id: 'pants', name: 'Pants', icon: '👖' },
    { id: 'shirts_polos', name: 'Shirts & Polos', icon: '👔' },
    { id: 'shorts', name: 'Shorts', icon: '🩳' },
    { id: 'suiting', name: 'Suiting', icon: '🤵' },
    { id: 'sweaters', name: 'Sweaters', icon: '🧶' },
    { id: 'sweatshirts_hoodies', name: 'Sweatshirts & Hoodies', icon: '👕' },
    { id: 'tees_tanks', name: 'Tees & Tanks', icon: '👕' },
  ],
  WOMEN: [
    { id: 'blouses_shirts', name: 'Blouses & Shirts', icon: '👚' },
    { id: 'cardigans', name: 'Cardigans', icon: '🧥' },
    { id: 'denim', name: 'Denim', icon: '👖' },
    { id: 'dresses', name: 'Dresses', icon: '👗' },
    { id: 'graphic_tees', name: 'Graphic Tees', icon: '👕' },
    { id: 'jackets_coats', name: 'Jackets & Coats', icon: '🧥' },
    { id: 'leggings', name: 'Leggings', icon: '🩱' },
    { id: 'pants', name: 'Pants', icon: '👖' },
    { id: 'rompers_jumpsuits', name: 'Rompers & Jumpsuits', icon: '👗' },
    { id: 'shorts', name: 'Shorts', icon: '🩳' },
    { id: 'skirts', name: 'Skirts', icon: '👗' },
    { id: 'sweaters', name: 'Sweaters', icon: '🧶' },
    { id: 'sweatshirts_hoodies', name: 'Sweatshirts & Hoodies', icon: '👕' },
    { id: 'tees_tanks', name: 'Tees & Tanks', icon: '👕' },
  ],
};

// Age groups
const AGE_GROUPS = [
  { id: '0-15', label: '0-15 years' },
  { id: '15-18', label: '15-18 years' },
  { id: '18-23', label: '18-23 years' },
  { id: '23-30', label: '23-30 years' },
  { id: '30-40', label: '30-40 years' },
  { id: '40-50', label: '40-50 years' },
  { id: '50+', label: '50+ years' },
];

// Location options
const LOCATIONS = [
  { continent: 'North America', countries: ['United States', 'Canada', 'Mexico'] },
  { continent: 'Europe', countries: ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway'] },
  { continent: 'Asia', countries: ['China', 'Japan', 'South Korea', 'India', 'Singapore', 'Thailand', 'Indonesia'] },
  { continent: 'South America', countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'] },
  { continent: 'Africa', countries: ['South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Morocco'] },
  { continent: 'Oceania', countries: ['Australia', 'New Zealand', 'Fiji'] },
];

interface OnboardingQuestionnaireProps {
  onComplete: (userProfile: UserProfile) => void;
}

interface UserProfile {
  gender: 'MEN' | 'WOMEN';
  ageGroup: string;
  location: {
    continent: string;
    country: string;
  };
  clothingPreferences: string[];
}

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    clothingPreferences: [],
  });

  const steps = [
    { title: 'Welcome to Thuli AI!', subtitle: 'Let\'s personalize your fashion experience' },
    { title: 'What\'s your gender?', subtitle: 'This helps us show relevant clothing options' },
    { title: 'What\'s your age group?', subtitle: 'This helps us tailor recommendations' },
    { title: 'Where are you located?', subtitle: 'This helps us consider regional preferences' },
    { title: 'What clothing interests you?', subtitle: 'Select your favorite clothing types' },
  ];

  const handleGenderSelect = (gender: 'MEN' | 'WOMEN') => {
    setUserProfile(prev => ({ ...prev, gender }));
    setCurrentStep(2);
  };

  const handleAgeSelect = (ageGroup: string) => {
    setUserProfile(prev => ({ ...prev, ageGroup }));
    setCurrentStep(3);
  };

  const handleLocationSelect = (continent: string, country: string) => {
    setUserProfile(prev => ({ 
      ...prev, 
      location: { continent, country } 
    }));
    setCurrentStep(4);
  };

  const handleClothingToggle = (categoryId: string) => {
    setUserProfile(prev => {
      const current = prev.clothingPreferences || [];
      const updated = current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId];
      return { ...prev, clothingPreferences: updated };
    });
  };

  const handleComplete = () => {
    if (!userProfile.gender || !userProfile.ageGroup || !userProfile.location || 
        !userProfile.clothingPreferences || userProfile.clothingPreferences.length === 0) {
      Alert.alert('Incomplete Profile', 'Please complete all sections before continuing.');
      return;
    }

    onComplete(userProfile as UserProfile);
  };

  const renderGenderStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.genderButton, styles.menButton]}
          onPress={() => handleGenderSelect('MEN')}
        >
          <Text style={styles.genderIcon}>👨</Text>
          <Text style={styles.genderText}>Men</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.genderButton, styles.womenButton]}
          onPress={() => handleGenderSelect('WOMEN')}
        >
          <Text style={styles.genderIcon}>👩</Text>
          <Text style={styles.genderText}>Women</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAgeStep = () => (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {AGE_GROUPS.map((age) => (
          <TouchableOpacity
            key={age.id}
            style={[
              styles.ageButton,
              userProfile.ageGroup === age.id && styles.ageButtonSelected
            ]}
            onPress={() => handleAgeSelect(age.id)}
          >
            <Text style={[
              styles.ageButtonText,
              userProfile.ageGroup === age.id && styles.ageButtonTextSelected
            ]}>
              {age.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {LOCATIONS.map((location) => (
          <View key={location.continent} style={styles.locationGroup}>
            <Text style={styles.continentText}>{location.continent}</Text>
            {location.countries.map((country) => (
              <TouchableOpacity
                key={country}
                style={[
                  styles.countryButton,
                  userProfile.location?.country === country && styles.countryButtonSelected
                ]}
                onPress={() => handleLocationSelect(location.continent, country)}
              >
                <Text style={[
                  styles.countryButtonText,
                  userProfile.location?.country === country && styles.countryButtonTextSelected
                ]}>
                  {country}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderClothingStep = () => {
    const categories = userProfile.gender ? CLOTHING_CATEGORIES[userProfile.gender] : [];
    
    return (
      <View style={styles.stepContainer}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.clothingGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.clothingTile,
                  userProfile.clothingPreferences?.includes(category.id) && styles.clothingTileSelected
                ]}
                onPress={() => handleClothingToggle(category.id)}
              >
                <Text style={styles.clothingIcon}>{category.icon}</Text>
                <Text style={[
                  styles.clothingName,
                  userProfile.clothingPreferences?.includes(category.id) && styles.clothingNameSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        <TouchableOpacity
          style={[
            styles.completeButton,
            (!userProfile.clothingPreferences || userProfile.clothingPreferences.length === 0) && styles.completeButtonDisabled
          ]}
          onPress={handleComplete}
          disabled={!userProfile.clothingPreferences || userProfile.clothingPreferences.length === 0}
        >
          <Text style={styles.completeButtonText}>
            Complete Setup ({userProfile.clothingPreferences?.length || 0} selected)
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeIcon}>👗</Text>
              <Text style={styles.welcomeTitle}>Welcome to Thuli AI!</Text>
              <Text style={styles.welcomeSubtitle}>
                Your personal fashion assistant powered by AI
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.startButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 1:
        return renderGenderStep();
      case 2:
        return renderAgeStep();
      case 3:
        return renderLocationStep();
      case 4:
        return renderClothingStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep) / (steps.length - 1)) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep} of {steps.length - 1}
          </Text>
        </View>
        
        <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep].subtitle}</Text>
      </View>

      {renderStep()}

      {currentStep > 0 && currentStep < 4 && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E90FF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Welcome Step
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Gender Step
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
  },
  genderButton: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 20,
    minWidth: 120,
  },
  menButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  womenButton: {
    backgroundColor: '#FCE4EC',
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  genderIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  genderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  
  // Age Step
  ageButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  ageButtonSelected: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  ageButtonText: {
    fontSize: 16,
    color: '#212529',
    textAlign: 'center',
  },
  ageButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Location Step
  locationGroup: {
    marginBottom: 20,
  },
  continentText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
    marginTop: 8,
  },
  countryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  countryButtonSelected: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  countryButtonText: {
    fontSize: 14,
    color: '#212529',
  },
  countryButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Clothing Step
  clothingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  clothingTile: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  clothingTileSelected: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  clothingIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  clothingName: {
    fontSize: 12,
    color: '#212529',
    textAlign: 'center',
    fontWeight: '500',
  },
  clothingNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Complete Button
  completeButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  completeButtonDisabled: {
    backgroundColor: '#E9ECEF',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Navigation
  navigationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OnboardingQuestionnaire;

