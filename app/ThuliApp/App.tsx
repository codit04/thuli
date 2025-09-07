/**
 * 🚀 Thuli AI/CV Hackathon App
 * Professional React Native Prototype for AI & Computer Vision
 * 
 * Features:
 * - Gemini AI Chat Integration
 * - File Upload System
 * - Camera AI Features
 * - Modern UI/UX
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ChatInterface from './src/components/ChatInterface';
import ErrorBoundary from './src/components/ErrorBoundary';
import OnboardingQuestionnaire from './src/components/OnboardingQuestionnaire';
import TinderRecommendationScreen from './src/components/TinderRecommendationScreen';
import ClothingTypeScreen from './src/components/ClothingTypeScreen';
import geminiService from './src/services/gemini';
import userProfileService from './src/services/userProfile';
import fashionRecommendationService from './src/services/fashionRecommendation';

const { width } = Dimensions.get('window');

// User Profile Interface
interface UserProfile {
  gender: 'MEN' | 'WOMEN';
  ageGroup: string;
  location: {
    continent: string;
    country: string;
  };
  clothingPreferences: string[];
}

// Main Navigation Component
function ThuliApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedClothingType, setSelectedClothingType] = useState<string | null>(null);
  const [showClothingTypeSelection, setShowClothingTypeSelection] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  const handleClothingTypeSelected = async (clothingType: string) => {
    setSelectedClothingType(clothingType);
    setShowClothingTypeSelection(false);
    console.log('✅ Clothing type selected:', clothingType);
    
    // Create preference vector with the selected clothing type
    if (userProfile) {
      try {
        setIsLoading(true);
        const clothingOptions = [clothingType];
        const result = await fashionRecommendationService.constructPreferenceVector(
          userProfile.gender,
          userProfile.location.country,
          clothingOptions
        );
        console.log('✅ Preference vector created:', result.message);
      } catch (error) {
        console.error('❌ Error creating preference vector:', error);
        Alert.alert(
          'Error',
          'Failed to create preference vector. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
  };


  const handleOnboardingComplete = async (profile: UserProfile) => {
    // Save profile to service
    userProfileService.saveProfile(profile);
    setUserProfile(profile);
    
    // Hide onboarding and show clothing type selection
    setShowOnboarding(false);
    setShowClothingTypeSelection(true);
    
    console.log('✅ Onboarding completed, showing clothing type selection');
  };

  const checkApiStatus = async () => {
    setIsLoading(true);
    try {
      const result = await geminiService.testConnection();
      setApiStatus(result.success ? 'ready' : 'error');
    } catch (error) {
      console.error('API status check failed:', error);
      setApiStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Gemini API message sending
  const handleGeminiMessage = async (message: string): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await geminiService.sendMessage(message);
      return response;
    } catch (error) {
      console.error('Gemini error:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation tabs
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'recommendations', label: 'Discover', icon: '🎯' },
    { id: 'upload', label: 'Upload', icon: '📁' },
    { id: 'chat', label: 'AI Chat', icon: '🤖' },
  ];

  // Render Home Screen - Minimal and Clean
  const renderHome = () => (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Thuli</Text>
          <Text style={styles.appSubtitle}>
            {(() => {
              if (!userProfile) return 'AI Fashion Assistant';
              const genderText = userProfile.gender === 'MEN' ? 'Men\'s' : 'Women\'s';
              return `Personalized ${genderText} Fashion`;
            })()}
          </Text>
        </View>

        {/* Main Action */}
        <View style={styles.mainActionContainer}>
          <TouchableOpacity 
            style={styles.mainActionButton}
            onPress={() => setActiveTab('recommendations')}
          >
            <Text style={styles.mainActionIcon}>🎯</Text>
            <Text style={styles.mainActionTitle}>Discover Fashion</Text>
            <Text style={styles.mainActionSubtitle}>
              {userProfile ? 'Get personalized recommendations' : 'Complete setup to start'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        {userProfile && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.clothingPreferences.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.ageGroup}</Text>
              <Text style={styles.statLabel}>Age Group</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.location.country}</Text>
              <Text style={styles.statLabel}>Location</Text>
            </View>
          </View>
        )}

        {/* Status Indicator */}
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: (() => {
            if (apiStatus === 'ready') return '#4CAF50';
            if (apiStatus === 'error') return '#F44336';
            return '#FF9800';
          })() }]} />
          <Text style={styles.statusText}>
            {(() => {
              if (apiStatus === 'ready') return 'AI Ready';
              if (apiStatus === 'error') return 'AI Offline';
              return 'Checking...';
            })()}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );

  // Render other screens
  const renderScreen = (screenName: string) => {
    switch (screenName) {
      case 'recommendations':
        return (
          <TinderRecommendationScreen 
            onBack={() => setActiveTab('home')}
            clothingType={selectedClothingType || undefined}
          />
        );
      case 'chat':
        return (
          <View style={styles.screen}>
            <ChatInterface 
              onSendMessage={handleGeminiMessage}
              isLoading={isLoading}
            />
          </View>
        );
      case 'upload':
        return (
          <View style={styles.screen}>
            <SafeAreaView style={styles.container}>
              <View style={styles.placeholderScreen}>
                <Text style={styles.placeholderIcon}>📁</Text>
                <Text style={styles.placeholderTitle}>File Upload System</Text>
                <Text style={styles.placeholderText}>
                  Ready to implement document picker, multi-file upload, 
                  progress tracking, and file validation features.
                </Text>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setActiveTab('home')}
                >
                  <Text style={styles.backButtonText}>← Back to Home</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        );
      default:
        return renderHome();
    }
  };

  // Show onboarding questionnaire first
  // Show clothing type selection after onboarding
  if (showClothingTypeSelection && userProfile) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <ClothingTypeScreen
            onClothingTypeSelected={handleClothingTypeSelected}
            onBack={() => setShowClothingTypeSelection(false)}
            userGender={userProfile.gender}
          />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  if (showOnboarding) {
  return (
      <ErrorBoundary>
    <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <OnboardingQuestionnaire onComplete={handleOnboardingComplete} />
    </SafeAreaProvider>
      </ErrorBoundary>
  );
}

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Main Content */}
        {renderScreen(activeTab)}
        
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.navItem,
                activeTab === tab.id && styles.navItemActive
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.navIcon,
                activeTab === tab.id && styles.navIconActive
              ]}>
                {tab.icon}
              </Text>
              <Text style={[
                styles.navLabel,
                activeTab === tab.id && styles.navLabelActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
    </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Main Action
  mainActionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainActionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 280,
  },
  mainActionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mainActionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  mainActionSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  // Status Indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  // Placeholder Screens
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingBottom: 8,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconActive: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default ThuliApp;