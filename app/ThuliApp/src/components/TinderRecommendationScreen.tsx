import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Animated,
  Modal,
  TextInput,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import userProfileService from '../services/userProfile';
import fashionRecommendationService from '../services/fashionRecommendation';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.6;

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

interface TinderRecommendationScreenProps {
  onBack: () => void;
  clothingType?: string;
}

const TinderRecommendationScreen: React.FC<TinderRecommendationScreenProps> = ({ onBack, clothingType }) => {
  const [currentRecommendation, setCurrentRecommendation] = useState<RecommendationItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [preferenceVector, setPreferenceVector] = useState<number[]>([]);
  const [imageErrors, setImageErrors] = useState<{[key: string]: number}>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [showFeedbackTab, setShowFeedbackTab] = useState(false);
  const [catalogExhausted, setCatalogExhausted] = useState(false);
  
  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadUserProfile();
    checkExistingPreferenceVector();
  }, []);

  useEffect(() => {
    if (userProfile && !isInitialized) {
      initializePreferenceVector();
    }
  }, [userProfile, isInitialized]);

  const loadUserProfile = () => {
    const profile = userProfileService.getProfile();
    setUserProfile(profile);
  };

  const checkExistingPreferenceVector = async () => {
    try {
      const existingVector = fashionRecommendationService.getPreferenceVector();
      if (existingVector && existingVector.length > 0) {
        setPreferenceVector(existingVector);
        console.log('✅ Using existing preference vector');
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('❌ Error checking existing preference vector:', error);
    }
  };

  const initializePreferenceVector = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    try {
      const clothingOptions = clothingType ? [clothingType] : userProfile.clothingPreferences || ['dresses'];
      
      const result = await fashionRecommendationService.constructPreferenceVector(
        userProfile.gender,
        userProfile.location.country,
        clothingOptions
      );
      
      setPreferenceVector(result.preference_vector);
      setIsInitialized(true);
      console.log('✅ Preference vector initialized:', result.message);
      
      // Get first recommendation
      await getNextRecommendation();
    } catch (error) {
      console.error('❌ Error initializing preference vector:', error);
      Alert.alert('Error', 'Failed to initialize preference vector');
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSource = (item: RecommendationItem): string => {
    if (!item.item_id) return 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=No+Image';
    const errorCount = imageErrors[item.item_id] || 0;
    const imageUrl = errorCount < item.image_paths.length ? item.image_paths[errorCount] : `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${item.item_id}`;
    console.log(`🖼️ Image source for ${item.item_id}:`, imageUrl);
    return imageUrl;
  };

  const handleImageError = (itemId: string | null) => {
    if (!itemId) return;
    console.log(`❌ Image error for ${itemId}`);
    setImageErrors(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const getNextRecommendation = async () => {
    if (preferenceVector.length === 0) {
      Alert.alert('Error', 'Preference vector not initialized yet');
      return;
    }

    setIsLoading(true);
    try {
      const result = await fashionRecommendationService.getRecommendation(preferenceVector);
      console.log('📸 Received recommendation:', result.recommendation);
      
      // Check if catalog is exhausted
      if (result.recommendation.catalog_exhausted) {
        setCatalogExhausted(true);
        setCurrentRecommendation(null);
        console.log('📚 Catalog exhausted - all items seen');
      } else {
        setCurrentRecommendation(result.recommendation);
        setCatalogExhausted(false);
      }
    } catch (error) {
      console.error('❌ Error getting recommendation:', error);
      Alert.alert('Error', 'Failed to get recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'like' | 'dislike' | 'superlike') => {
    if (!currentRecommendation?.item_vector || preferenceVector.length === 0) {
      Alert.alert('Error', 'No recommendation available');
      return;
    }

    setIsLoading(true);
    try {
      // Update preference vector based on action
      const result = await fashionRecommendationService.updatePreferenceVector(
        preferenceVector,
        currentRecommendation.item_vector,
        action
      );

      // Update local preference vector
      setPreferenceVector(result.updated_preference_vector);
      console.log('✅ Preference vector updated with action:', action);

      // Get next recommendation
      await getNextRecommendation();
    } catch (error) {
      console.error('❌ Error processing action:', error);
      Alert.alert('Error', 'Failed to process action');
    } finally {
      setIsLoading(false);
    }
  };


  const handleLike = () => {
    if (!currentRecommendation) return;
    console.log('👍 Liked:', currentRecommendation.item_id);
    handleAction('like');
  };

  const handleDislike = () => {
    if (!currentRecommendation) return;
    console.log('👎 Disliked:', currentRecommendation.item_id);
    
    // Increment dislike count
    const newDislikeCount = dislikeCount + 1;
    setDislikeCount(newDislikeCount);
    
    // Show feedback tab after 3 dislikes
    if (newDislikeCount >= 3) {
      setShowFeedbackTab(true);
    }
    
    handleAction('dislike');
  };

  const handleSuperLike = () => {
    if (!currentRecommendation) return;
    console.log('⭐ Super liked:', currentRecommendation.item_id);
    handleAction('superlike');
  };

  const requestGalleryPermissionAndroid = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'We need access to your photos to let you upload a reference image.',
          buttonPositive: 'OK',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.error('❌ Permission request failed', e);
      return false;
    }
  };

  const handleImageUpload = async () => {
    try {
      console.log('📸 Starting image upload process');
      const hasPerm = await requestGalleryPermissionAndroid();
      if (!hasPerm) {
        Alert.alert('Permission required', 'Please grant storage permission to pick an image.');
        return;
      }
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      };

      console.log('📸 Launching image library with options:', options);
      launchImageLibrary(options, (response) => {
        console.log('📸 Image picker response:', response);
        if (response.didCancel || response.errorMessage) {
          console.log('Image picker cancelled or error:', response.errorMessage);
          return;
        }

        if (response.assets && response.assets[0]) {
          console.log('📸 Image selected:', response.assets[0]);
          setIsLoading(true);
          const imageUri = response.assets[0].uri;
          
          if (imageUri) {
            try {
              fashionRecommendationService.uploadImage(imageUri, 'user_session').then(response => {
                if (response.success) {
                  // Update preference vector and get new recommendation
                  setPreferenceVector(response.updated_preference_vector);
                  setCurrentRecommendation(response.new_recommendation);
                  setShowFeedbackTab(false); // Hide feedback button after successful upload
                  
                  Alert.alert(
                    'Success!', 
                    'Image analyzed successfully! Your preferences have been updated.',
                    [{ text: 'Great!', style: 'default' }]
                  );
                }
              }).catch(error => {
                console.error('❌ Error uploading image:', error);
                Alert.alert('Error', 'Failed to upload image. Please try again.');
              }).finally(() => {
                setIsLoading(false);
              });
            } catch (error) {
              console.error('❌ Error uploading image:', error);
              Alert.alert('Error', 'Failed to upload image. Please try again.');
              setIsLoading(false);
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Error with image picker:', error);
      Alert.alert('Error', 'Failed to open image picker.');
    }
  };

  const handleStyleDescription = () => {
    console.log('💬 Describe Style button pressed - opening modal');
    setStyleModalVisible(true);
  };

  const analyzeStyleDescription = async (description: string) => {
    setIsLoading(true);
    try {
      const response = await fashionRecommendationService.describeStyle(description, 'user_session');
      
      if (response.success) {
        // Update preference vector and get new recommendation
        setPreferenceVector(response.updated_preference_vector);
        setCurrentRecommendation(response.new_recommendation);
        setShowFeedbackTab(false); // Hide feedback button after successful analysis
        
        const attributes = Object.keys(response.analysis_result.extracted_attributes).slice(0, 3).join(', ');
        Alert.alert(
          'Style Analyzed!', 
          `We found these attributes: ${attributes}. Your preferences have been updated!`,
          [{ text: 'Perfect!', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Error analyzing style:', error);
      Alert.alert('Error', 'Failed to analyze style description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [styleModalVisible, setStyleModalVisible] = useState(false);
  const [styleText, setStyleText] = useState('');

  const renderCard = () => {
    if (!currentRecommendation?.item_id) return null;
    
    return (
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageSource(currentRecommendation) }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => handleImageError(currentRecommendation.item_id)}
            onLoad={() => console.log('✅ Image loaded successfully')}
          />
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.itemId}>{currentRecommendation.item_id}</Text>
          <Text style={styles.similarityScore}>
            Similarity: {(currentRecommendation.similarity_score * 100).toFixed(1)}%
          </Text>
          
          {currentRecommendation.total_items_seen && (
            <Text style={styles.progressText}>
              Seen: {currentRecommendation.total_items_seen} items
            </Text>
          )}
          
          <View style={styles.attributesContainer}>
            <Text style={styles.attributesTitle}>Attributes:</Text>
            {currentRecommendation.attributes.slice(0, 3).map((attr) => (
              <Text key={attr} style={styles.attribute}>
                • {attr}
              </Text>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      <Text style={styles.loadingText}>
        {!isInitialized ? 'Creating Profile...' : 'Getting Recommendation...'}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {catalogExhausted ? 'You\'ve seen everything!' : 'No Recommendations Available'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {catalogExhausted 
          ? 'You\'ve browsed through all available items. Check back later for new additions!'
          : 'Make sure your profile is complete and try again.'
        }
      </Text>
      {!catalogExhausted && (
        <TouchableOpacity style={styles.retryButton} onPress={getNextRecommendation}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );


  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }
    if (currentRecommendation) {
      return renderCard();
    }
    return renderEmptyState();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fashion Recommendations</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>

      {!isLoading && currentRecommendation && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.dislikeButton} onPress={handleDislike}>
            <Text style={styles.buttonText}>👎</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.superLikeButton} onPress={handleSuperLike}>
            <Text style={styles.buttonText}>⭐</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
            <Text style={styles.buttonText}>👍</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show feedback button at bottom if user has disliked 3+ times */}
      {showFeedbackTab && (
        <View style={styles.feedbackButtonContainer}>
          <TouchableOpacity 
            style={styles.feedbackButtonBottom}
            onPress={() => {
              console.log('💬 Feedback button pressed - showing alert');
              Alert.alert('Help Us Improve', 'Choose an option:', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Upload Image', onPress: () => { console.log('📸 Upload Image button pressed'); handleImageUpload().catch(console.error); } },
                { text: 'Describe Style', onPress: () => { console.log('💬 Describe Style button pressed'); handleStyleDescription(); } },
              ]);
            }}
          >
            <Text style={styles.feedbackButtonIcon}>💬</Text>
            <Text style={styles.feedbackButtonText}>Don't like what we show?</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Style Description Modal */}
      <Modal
        transparent
        visible={styleModalVisible}
        animationType="slide"
        onRequestClose={() => setStyleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Describe Your Style</Text>
            <Text style={styles.modalSubtitle}>Tell us what you like. Example: "Casual streetwear with dark colors, relaxed fit"</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type your style preferences..."
              placeholderTextColor="#999"
              multiline
              value={styleText}
              onChangeText={setStyleText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setStyleModalVisible(false)}>
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  const text = styleText.trim();
                  if (!text) { Alert.alert('Please enter some text'); return; }
                  setStyleModalVisible(false);
                  analyzeStyleDescription(text).catch(console.error);
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Analyze</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  itemId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  similarityScore: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  attributesContainer: {
    marginTop: 8,
  },
  attributesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 6,
  },
  attribute: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
  },
  dislikeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  superLikeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F39C12',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Feedback Button Styles
  feedbackButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  feedbackButtonBottom: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  modalInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    color: '#111827',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButtonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  modalButtonPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  modalButtonTextSecondary: {
    color: '#111827',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TinderRecommendationScreen;