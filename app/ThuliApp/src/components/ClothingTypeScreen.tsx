import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ClothingTypeScreenProps {
  onClothingTypeSelected: (clothingType: string) => void;
  onBack: () => void;
  userGender: string;
}

const ClothingTypeScreen: React.FC<ClothingTypeScreenProps> = ({
  onClothingTypeSelected,
  onBack,
  userGender,
}) => {
  const [clothingTypes, setClothingTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    loadClothingTypes();
  }, []);

  const loadClothingTypes = () => {
    // Define clothing types based on gender
    const clothingTypesByGender = {
      'MEN': [
        'Tees_Tanks',
        'Shirts_Polos', 
        'Pants',
        'Shorts',
        'Jeans',
        'Jackets_Vests',
        'Sweaters',
        'Sweatshirts_Hoodies',
        'Suits',
        'Denim'
      ],
      'WOMEN': [
        'Dresses',
        'Blouses_Shirts',
        'Pants',
        'Skirts',
        'Jeans',
        'Jackets_Coats',
        'Sweaters',
        'Sweatshirts_Hoodies',
        'Tees_Tanks',
        'Shorts',
        'Leggings',
        'Rompers_Jumpsuits',
        'Cardigans',
        'Graphic_Tees'
      ]
    };

    const types = clothingTypesByGender[userGender as keyof typeof clothingTypesByGender] || [];
    setClothingTypes(types);
    setIsLoading(false);
  };

  const handleClothingTypeSelect = (clothingType: string) => {
    setSelectedType(clothingType);
  };

  const handleContinue = async () => {
    if (!selectedType) {
      Alert.alert('Please Select', 'Please select a clothing type to continue');
      return;
    }

    try {
      // Store clothing type preference
      await fetch('http://192.168.1.9:5001/api/select-clothing-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'current_user',
          clothing_type: selectedType,
        }),
      });

      onClothingTypeSelected(selectedType);
    } catch (error) {
      console.error('❌ Error selecting clothing type:', error);
      Alert.alert('Error', 'Failed to select clothing type');
    }
  };

  const renderClothingTypeButton = (clothingType: string) => {
    const isSelected = selectedType === clothingType;
    
    return (
      <TouchableOpacity
        key={clothingType}
        style={[
          styles.clothingTypeButton,
          isSelected && styles.selectedClothingTypeButton,
        ]}
        onPress={() => handleClothingTypeSelect(clothingType)}
      >
        <Text
          style={[
            styles.clothingTypeText,
            isSelected && styles.selectedClothingTypeText,
          ]}
        >
          {clothingType}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading clothing types...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Clothing Type</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>What are you looking for?</Text>
          <Text style={styles.introText}>
            Select the type of clothing you'd like to discover. This helps us show you more relevant recommendations.
          </Text>
        </View>

        {/* Clothing Types Grid */}
        <View style={styles.clothingTypesContainer}>
          <Text style={styles.sectionTitle}>Available for {userGender}</Text>
          <View style={styles.clothingTypesGrid}>
            {clothingTypes.map(renderClothingTypeButton)}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedType && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <Text style={styles.continueButtonText}>
            Continue to Recommendations
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  clothingTypesContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  clothingTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  clothingTypeButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  selectedClothingTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  clothingTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  selectedClothingTypeText: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ClothingTypeScreen;
