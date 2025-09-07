#!/usr/bin/env python3
"""
Fashion Recommendation API - Simplified Version
===============================================

Clean API with 3 endpoints:
1. GET /constructpreferencevector - Build initial preference vector
2. GET /action - Update preference vector with moving average learning
3. GET /recommendations - Get next recommendation using Faiss

Author: Thuli AI Hackathon Team
Date: 2024
"""

import os
import pickle
import numpy as np
import faiss
import base64
import io
import ssl
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Optional
import logging
from datetime import datetime
import tensorflow as tf
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import google.generativeai as genai
    
# Fix SSL certificate issue for model downloading
ssl._create_default_https_context = ssl._create_unverified_context

# Configure TensorFlow to avoid threading issues
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Force CPU usage to avoid GPU threading issues

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'your-gemini-api-key-here')
if GEMINI_API_KEY != 'your-gemini-api-key-here':
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
else:
    gemini_model = None

# Initialize FastAPI app
app = FastAPI(
    title="Fashion Recommendation API",
    description="AI-powered fashion recommendation system with learning",
    version="2.0.0"
)

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving images
app.mount("/images", StaticFiles(directory="../data/img"), name="images")

# Global variables
fashion_index = None
item_ids = None
attribute_names = None
user_clothing_preferences = {}  # Store user clothing preferences by session
user_seen_items = {}  # Store seen items per user session to prevent duplicates

# Configuration
LEARNING_RATE = 0.1
SUPERLIKE_WEIGHT = 2.5

class FashionRecommendationEngine:
    """Simplified recommendation engine with learning capabilities"""
    
    def __init__(self):
        self.index = None
        self.item_ids = None
        self.attribute_names = None
        self.loaded = False
        self.vgg16_model = None
        self.vgg16_embeddings = None
        self.gender = None
        
    def load_data(self):
        """Load all required data files"""
        try:
            logger.info("🔄 Loading fashion recommendation data...")
            
            # Load Faiss index and item IDs
            self.index = faiss.read_index('../embeddings/fashion_attributes.index')
            with open('../embeddings/fashion_item_ids.pkl', 'rb') as f:
                self.item_ids = pickle.load(f)
            
            # Load attribute names
            with open('../data/list_attr_cloth.txt', 'r') as f:
                lines = f.readlines()
                self.attribute_names = [line.strip() for line in lines[2:]]
            
            # Load VGG16 model
            logger.info("🔄 Loading VGG16 model...")
            self.vgg16_model = VGG16(
                weights='imagenet',
                include_top=False,
                input_shape=(224, 224, 3)
            )
            self.vgg16_model.trainable = False
            logger.info("✅ VGG16 model loaded successfully")
            
            # Load VGG16 embeddings
            embeddings_path = "../embeddings/vgg16_embeddings.pkl"
            if os.path.exists(embeddings_path):
                with open(embeddings_path, 'rb') as f:
                    self.vgg16_embeddings = pickle.load(f)
                logger.info(f"✅ Loaded VGG16 embeddings for {len(self.vgg16_embeddings)} images")
            else:
                logger.warning("⚠️ VGG16 embeddings not found, image upload will not work")
                self.vgg16_embeddings = {}
            
            self.loaded = True
            logger.info(f"✅ Loaded {len(self.item_ids)} items with {self.index.d} attributes")
            
        except Exception as e:
            logger.error(f"❌ Error loading data: {str(e)}")
            raise
    
    def construct_preference_vector(self, gender: str, country: str, clothing_options: List[str]) -> np.ndarray:
        """Construct initial preference vector based on user inputs"""
        if not self.loaded:
            raise RuntimeError("Data not loaded")
        self.gender = gender
        # Start with neutral vector
        preference_vector = np.full(463, 0.0, dtype=np.float32)
        
        # Country-based style preferences
        country_preferences = self._get_country_preferences(country)
        
        # Gender-based preferences
        gender_preferences = self._get_gender_preferences(gender)
        
        # Clothing options preferences
        clothing_preferences = self._get_clothing_preferences(clothing_options)
        
        # Combine all preferences
        for attr_name, weight in country_preferences.items():
            self._apply_preference(preference_vector, attr_name, weight)
        
        for attr_name, weight in gender_preferences.items():
            self._apply_preference(preference_vector, attr_name, weight)
        
        for attr_name, weight in clothing_preferences.items():
            self._apply_preference(preference_vector, attr_name, weight)
        
        # Normalize to [0, 1] range
        preference_vector = np.clip(preference_vector, 0, 1)
        
        logger.info(f"🎯 Constructed preference vector for {gender} from {country} with {len(clothing_options)} clothing options")
        return preference_vector
    
    def _get_country_preferences(self, country: str) -> Dict[str, float]:
        """Get style preferences based on country - HIGH INFLUENCE"""
        country_mapping = {
            # North America - HIGH WEIGHTS
            'United States': {'casual': 1.2, 'trendy': 1.0, 'comfortable': 1.0, 'versatile': 0.8},
            'Canada': {'casual': 1.2, 'practical': 1.0, 'comfortable': 1.0, 'outdoor': 0.8},
            
            # Europe - HIGH WEIGHTS
            'United Kingdom': {'classic': 1.5, 'elegant': 1.2, 'sophisticated': 1.0, 'formal': 0.8},
            'Germany': {'minimalist': 1.5, 'practical': 1.2, 'quality': 1.0, 'structured': 0.8},
            'France': {'elegant': 1.5, 'sophisticated': 1.2, 'classic': 1.0, 'chic': 0.8},
            'Italy': {'elegant': 1.5, 'sophisticated': 1.2, 'stylish': 1.0, 'luxury': 0.8},
            
            # Asia - HIGH WEIGHTS
            'Japan': {'minimalist': 1.5, 'modern': 1.2, 'clean': 1.0, 'sophisticated': 0.8},
            'China': {'modern': 1.5, 'trendy': 1.2, 'sophisticated': 1.0, 'luxury': 0.8},
            'India': {'colorful': 1.5, 'traditional': 1.2, 'elegant': 1.0, 'vibrant': 0.8},
            'South Korea': {'trendy': 1.5, 'modern': 1.2, 'stylish': 1.0, 'youthful': 0.8},
            
            # South America - HIGH WEIGHTS
            'Brazil': {'colorful': 1.5, 'creative': 1.2, 'vibrant': 1.0, 'bold': 0.8},
            'Argentina': {'elegant': 1.5, 'sophisticated': 1.2, 'classic': 1.0, 'refined': 0.8},
            
            # Africa - HIGH WEIGHTS
            'Nigeria': {'colorful': 1.5, 'traditional': 1.2, 'vibrant': 1.0, 'cultural': 0.8},
            'South Africa': {'casual': 1.2, 'colorful': 1.0, 'comfortable': 1.0, 'outdoor': 0.8},
            
            # Oceania - HIGH WEIGHTS
            'Australia': {'casual': 1.2, 'comfortable': 1.0, 'practical': 1.0, 'outdoor': 0.8},
            'New Zealand': {'casual': 1.2, 'practical': 1.0, 'comfortable': 1.0, 'outdoor': 0.8},
        }
        
        return country_mapping.get(country, {'casual': 0.8, 'comfortable': 0.6})
    
    def _get_gender_preferences(self, gender: str) -> Dict[str, float]:
        """Get style preferences based on gender - HIGH INFLUENCE"""
        if gender.upper() == 'MEN':
            return {
                'tailored': 1.5, 'structured': 1.2, 'classic': 1.0, 
                'professional': 1.0, 'formal': 0.8, 'masculine': 1.3,
                'business': 1.1, 'sophisticated': 0.9
            }
        else:  # WOMEN
            return {
                'feminine': 1.5, 'elegant': 1.2, 'stylish': 1.0, 
                'versatile': 1.0, 'trendy': 0.8, 'graceful': 1.3,
                'chic': 1.1, 'sophisticated': 0.9
            }
    
    def _get_clothing_preferences(self, clothing_options: List[str]) -> Dict[str, float]:
        """Get style preferences based on clothing options - HIGH INFLUENCE"""
        preferences = {}
        
        clothing_mapping = {
            # Women's clothing - HIGH WEIGHTS
            'dresses': {'dress': 2.0, 'elegant': 1.5, 'feminine': 1.5, 'formal': 1.2, 'graceful': 1.3},
            'skirts': {'skirt': 2.0, 'feminine': 1.5, 'elegant': 1.2, 'stylish': 1.0},
            'blouses': {'blouse': 2.0, 'elegant': 1.5, 'feminine': 1.2, 'professional': 1.0},
            'tops': {'top': 2.0, 'casual': 1.5, 'versatile': 1.2, 'stylish': 1.0},
            'pants': {'pants': 2.0, 'professional': 1.5, 'practical': 1.2, 'structured': 1.0},
            'jeans': {'jeans': 2.0, 'casual': 1.5, 'comfortable': 1.2, 'relaxed': 1.0},
            'jackets': {'jacket': 2.0, 'structured': 1.5, 'professional': 1.2, 'tailored': 1.0},
            'coats': {'coat': 2.0, 'professional': 1.5, 'structured': 1.2, 'formal': 1.0},
            'sweaters': {'sweater': 2.0, 'comfortable': 1.5, 'casual': 1.2, 'cozy': 1.0},
            'accessories': {'accessory': 2.0, 'stylish': 1.5, 'elegant': 1.2, 'chic': 1.0},
            
            # Men's clothing - HIGH WEIGHTS
            'shirts': {'shirt': 2.0, 'professional': 1.5, 'classic': 1.2, 'formal': 1.0},
            't-shirts': {'tee': 2.0, 'casual': 1.5, 'comfortable': 1.2, 'relaxed': 1.0},
            'suits': {'suit': 2.0, 'formal': 1.5, 'professional': 1.2, 'tailored': 1.0},
            'blazers': {'blazer': 2.0, 'professional': 1.5, 'structured': 1.2, 'formal': 1.0},
            'polos': {'polo': 2.0, 'casual': 1.5, 'classic': 1.2, 'preppy': 1.0},
            'trousers': {'trousers': 2.0, 'professional': 1.5, 'formal': 1.2, 'tailored': 1.0},
            'shorts': {'shorts': 2.0, 'casual': 1.5, 'comfortable': 1.2, 'sporty': 1.0},
            'hoodies': {'hoodie': 2.0, 'casual': 1.5, 'comfortable': 1.2, 'relaxed': 1.0},
            
        }
        
        for option in clothing_options:
            option_lower = option.lower()
            if option_lower in clothing_mapping:
                for attr, weight in clothing_mapping[option_lower].items():
                    preferences[attr] = max(preferences.get(attr, 0), weight)
        
        return preferences
    
    def _apply_preference(self, vector: np.ndarray, attr_name: str, weight: float):
        """Apply a preference to the vector by finding matching attributes - HIGH INFLUENCE"""
        matches_found = 0
        for i, name in enumerate(self.attribute_names):
            if attr_name.lower() in name.lower():
                # Apply the weight to this attribute with stronger influence
                # Scale the weight to be more impactful but still reasonable
                scaled_weight = min(weight * 0.3, 0.5)  # Cap at 0.5 to avoid overshooting
                vector[i] = min(1.0, vector[i] + scaled_weight)
                matches_found += 1
        
        # If no matches found, try partial matches
        if matches_found == 0:
            for i, name in enumerate(self.attribute_names):
                # Try partial word matches for better coverage
                attr_words = attr_name.lower().split()
                name_words = name.lower().split()
                if any(word in name_words for word in attr_words if len(word) > 3):
                    scaled_weight = min(weight * 0.2, 0.3)  # Lower weight for partial matches
                    vector[i] = min(1.0, vector[i] + scaled_weight)
    
    def update_preference_vector(self, preference_vector: np.ndarray, item_vector: np.ndarray, action: str) -> np.ndarray:
        """Update preference vector based on user action using moving average"""
        if not self.loaded:
            raise RuntimeError("Data not loaded")
        
        # Convert to numpy arrays if needed
        pref_vec = np.array(preference_vector, dtype=np.float32)
        item_vec = np.array(item_vector, dtype=np.float32)
        
        # Apply moving average based on action
        if action.lower() == "like":
            updated_vector = (1 - LEARNING_RATE) * pref_vec + (LEARNING_RATE * item_vec)
        elif action.lower() == "dislike":
            updated_vector = (1 - LEARNING_RATE) * pref_vec - (LEARNING_RATE * item_vec)
        elif action.lower() == "superlike":
            effective_lr = LEARNING_RATE * SUPERLIKE_WEIGHT
            updated_vector = (1 - effective_lr) * pref_vec + (effective_lr * item_vec)
        else:
            raise ValueError(f"Invalid action: {action}. Must be 'like', 'dislike', or 'superlike'")
        
        # Normalize to [0, 1] range
        updated_vector = np.clip(updated_vector, 0, 1)
        
        logger.info(f"🔄 Updated preference vector with action: {action}")
        return updated_vector
    
    def get_recommendation(self, preference_vector: np.ndarray, clothing_preferences: List[str] = None, gender: str = None, user_id: str = "default") -> Dict:
        """Get single recommendation using filtered similarity search, excluding already seen items"""
        if not self.loaded:
            raise RuntimeError("Data not loaded")
        
        # Get seen items for this user
        seen_items = user_seen_items.get(user_id, set())
        
        # First, get filtered item indices based on gender and clothing preferences
        filtered_indices = self._get_filtered_item_indices(gender, clothing_preferences)
        
        if len(filtered_indices) == 0:
            logger.warning("No items found matching gender and clothing preferences, using full dataset")
            filtered_indices = list(range(len(self.item_ids)))
        
        # Remove already seen items from filtered indices
        unseen_indices = []
        for idx in filtered_indices:
            item_id = self.item_ids[idx]
            if item_id not in seen_items:
                unseen_indices.append(idx)
        
        if len(unseen_indices) == 0:
            # All items have been seen
            logger.info(f"🎯 User {user_id} has seen all {len(filtered_indices)} items in their filtered catalog")
            return {
                'item_id': None,
                'item_vector': None,
                'similarity_score': 0.0,
                'image_paths': [],
                'attributes': [],
                'catalog_exhausted': True,
                'total_items_seen': len(seen_items),
                'total_filtered_items': len(filtered_indices)
            }
        
        logger.info(f"🎯 Searching among {len(unseen_indices)} unseen items (seen: {len(seen_items)}, total filtered: {len(filtered_indices)})")
        
        # Create a filtered subset for similarity search (excluding seen items)
        filtered_vectors = []
        filtered_item_ids = []
        index_mapping = {}  # Maps filtered index to original index
        
        for i, original_index in enumerate(unseen_indices):
            try:
                item_vector = self.index.reconstruct(original_index)
                filtered_vectors.append(item_vector)
                filtered_item_ids.append(self.item_ids[original_index])
                index_mapping[i] = original_index
            except:
                continue
        
        if len(filtered_vectors) == 0:
            raise RuntimeError("No valid unseen items found in filtered dataset")
        
        # Convert to numpy array for Faiss search
        filtered_vectors_array = np.array(filtered_vectors, dtype=np.float32)
        
        # Create a temporary Faiss index for the filtered subset
        temp_index = faiss.IndexFlatIP(463)  # Inner product for cosine similarity
        temp_index.add(filtered_vectors_array)
        
        # Reshape query vector for Faiss
        query_vector = preference_vector.reshape(1, -1)
        
        # Search for most similar item in the filtered subset
        distances, indices = temp_index.search(query_vector, 1)
        
        if len(indices[0]) == 0:
            raise RuntimeError("No recommendations found in filtered dataset")
        
        # Get the result
        filtered_index = indices[0][0]
        original_index = index_mapping[filtered_index]
        distance = distances[0][0]
        item_id = filtered_item_ids[filtered_index]
        
        # Mark this item as seen
        user_seen_items[user_id] = seen_items | {item_id}
        
        # Convert inner product to similarity score (0-1 range)
        similarity_score = max(0, min(1, (distance + 1) / 2))
        
        # Get item vector for return
        try:
            item_vector = self.index.reconstruct(original_index)
        except:
            item_vector = np.zeros(463, dtype=np.float32)
        
        # Get image paths
        image_paths = self._get_item_images(item_id)
        
        # Get attributes
        attributes = self._get_item_attributes(original_index)
        
        logger.info(f"🎯 Found unseen recommendation: {item_id} (similarity: {similarity_score:.3f})")
        
        return {
            'item_id': item_id,
            'item_vector': item_vector.tolist(),
            'similarity_score': float(similarity_score),
            'image_paths': image_paths,
            'attributes': attributes,
            'catalog_exhausted': False,
            'total_items_seen': len(user_seen_items[user_id]),
            'total_filtered_items': len(filtered_indices)
        }
    
    def _get_filtered_item_indices(self, gender: str = None, clothing_preferences: List[str] = None) -> List[int]:
        """Get item indices that match the specified gender and clothing preferences"""
        if not gender and not clothing_preferences:
            # No filtering, return all indices
            return list(range(len(self.item_ids)))
        
        filtered_indices = []
        base_path = "../data/img"
        
        # If no gender specified, search all genders. Normalize to dataset folder names.
        gender_dirs = []
        if not gender:
            gender = self.gender
    
        if gender:
            candidate = gender.upper()
            candidate_path = os.path.join(base_path, candidate)
            if os.path.isdir(candidate_path):
                gender_dirs = [candidate]
        if not gender_dirs:
            gender_dirs = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]
        
        for gender_dir in gender_dirs:
            gender_path = os.path.join(base_path, gender_dir)
            if not os.path.isdir(gender_path):
                continue
            
            # If no clothing preferences specified, search all clothing types
            clothing_dirs = []
            if clothing_preferences:
                # Map preferences to directory names with stricter matching (avoid e.g. 'Suits' matching 'Jumpsuits')
                def singularize(text: str) -> str:
                    t = text.lower()
                    return t[:-1] if t.endswith('s') else t

                all_dir_names = [d for d in os.listdir(gender_path) if os.path.isdir(os.path.join(gender_path, d))]
                for clothing_type_dir in all_dir_names:
                    clothing_path = os.path.join(gender_path, clothing_type_dir)
                    if not os.path.isdir(clothing_path):
                        continue

                    name_norm = clothing_type_dir.replace('-', '_').replace(' ', '_').lower()
                    name_sing = singularize(name_norm)

                    for preference in clothing_preferences:
                        pref_norm = str(preference).replace('-', '_').replace(' ', '_').lower()
                        pref_sing = singularize(pref_norm)

                        # Substring match
                        print(f"Checking {pref_norm} in {name_norm} or {pref_sing} in {name_sing}")
                        is_match = pref_norm in name_norm or pref_sing in name_sing or name_norm in pref_norm or name_sing in pref_sing

                        if is_match:
                            clothing_dirs.append(clothing_type_dir)
                            break
            else:
                # No clothing preferences, search all clothing types
                clothing_dirs = [d for d in os.listdir(gender_path) 
                               if os.path.isdir(os.path.join(gender_path, d))]
            
            # Search through matching clothing directories
            for clothing_type_dir in clothing_dirs:
                clothing_path = os.path.join(gender_path, clothing_type_dir)
                if not os.path.isdir(clothing_path):
                    continue
                
                # Get all items in this directory
                try:
                    items_in_dir = os.listdir(clothing_path)
                    for item_id in items_in_dir:
                        item_path = os.path.join(clothing_path, item_id)
                        if os.path.isdir(item_path):
                            # Find the index of this item in our dataset
                            try:
                                item_index = self.item_ids.index(item_id)
                                filtered_indices.append(item_index)
                            except ValueError:
                                # Item not in our dataset, skip
                                continue
                except OSError:
                    # Directory access error, skip
                    continue
        
        logger.info(f"🔍 Filtered to {len(filtered_indices)} items matching gender='{gender}' and clothing={clothing_preferences}")
        return filtered_indices
    
    def extract_vgg16_features(self, image_data: bytes) -> np.ndarray:
        """Extract VGG16 features from uploaded image"""
        if not self.vgg16_model:
            raise RuntimeError("VGG16 model not loaded")
        
        try:
            # Convert bytes to image
            img = load_img(io.BytesIO(image_data), target_size=(224, 224))
            img_array = img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = preprocess_input(img_array)
            
            # Extract features
            features = self.vgg16_model.predict(img_array, verbose=0)
            return features.flatten()
            
        except Exception as e:
            logger.error(f"❌ Error extracting VGG16 features: {str(e)}")
            raise RuntimeError(f"Failed to extract image features: {str(e)}")
    
    def find_closest_vgg16_match(self, query_features: np.ndarray) -> Dict:
        """Find closest match using VGG16 embeddings"""
        if not self.vgg16_embeddings:
            raise RuntimeError("VGG16 embeddings not loaded")
        
        try:
            # Convert embeddings to numpy array for comparison
            image_paths = list(self.vgg16_embeddings.keys())
            embeddings_matrix = np.array([self.vgg16_embeddings[path] for path in image_paths])
            
            # Calculate cosine similarity
            query_norm = query_features / np.linalg.norm(query_features)
            embeddings_norm = embeddings_matrix / np.linalg.norm(embeddings_matrix, axis=1, keepdims=True)
            
            similarities = np.dot(embeddings_norm, query_norm)
            best_match_idx = np.argmax(similarities)
            
            best_image_path = image_paths[best_match_idx]
            similarity_score = similarities[best_match_idx]
            
            # Extract item ID from image path
            # Path format: WOMEN/Dresses/id_00000002/02_1_front.jpg
            path_parts = best_image_path.split('/')
            if len(path_parts) >= 3:
                item_id = path_parts[2]  # Extract id_00000002
            else:
                item_id = "unknown"
            
            logger.info(f"🎯 Found VGG16 match: {item_id} (similarity: {similarity_score:.3f})")
            
            return {
                'item_id': item_id,
                'image_path': best_image_path,
                'similarity_score': float(similarity_score),
                'query_features': query_features.tolist()
            }
            
        except Exception as e:
            logger.error(f"❌ Error finding VGG16 match: {str(e)}")
            raise RuntimeError(f"Failed to find image match: {str(e)}")
    
    def analyze_style_description(self, description: str) -> Dict:
        """Analyze style description using Gemini AI"""
        if not gemini_model:
            raise RuntimeError("Gemini AI not configured")
        
        try:
            prompt = f"""
            Analyze this fashion style description and extract key attributes that would be relevant for clothing recommendations.
            
            Description: "{description}"
            
            Please provide a JSON response with the following structure:
            {{
                "extracted_attributes": {{
                    "color": ["color1", "color2"],
                    "style": ["style1", "style2"],
                    "occasion": ["occasion1", "occasion2"],
                    "fit": ["fit1", "fit2"],
                    "material": ["material1", "material2"],
                    "pattern": ["pattern1", "pattern2"]
                }},
                "confidence": 0.8,
                "summary": "Brief summary of the style preferences"
            }}
            
            Only include attributes that are clearly mentioned or strongly implied in the description.
            Use common fashion terminology.
            """
            
            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Try to extract JSON from response
            import json
            try:
                # Find JSON in the response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
            except:
                # Fallback: create a simple structure
                result = {
                    "extracted_attributes": {
                        "style": ["casual", "comfortable"],
                        "color": ["neutral"]
                    },
                    "confidence": 0.5,
                    "summary": "Basic style preferences extracted"
                }
            
            logger.info(f"🎯 Style analysis completed: {result['summary']}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error analyzing style: {str(e)}")
            raise RuntimeError(f"Failed to analyze style description: {str(e)}")
    
    def update_preference_vector_from_attributes(self, current_vector: np.ndarray, attributes: Dict, weight: float = 0.3) -> np.ndarray:
        """Update preference vector based on extracted attributes"""
        if not self.loaded:
            raise RuntimeError("Data not loaded")
        
        updated_vector = current_vector.copy()
        
        try:
            # Map attributes to preference vector indices
            for category, values in attributes.items():
                for value in values:
                    # Find matching attribute in our attribute list
                    for i, attr_name in enumerate(self.attribute_names):
                        if value.lower() in attr_name.lower() or attr_name.lower() in value.lower():
                            # Apply weight to the attribute
                            updated_vector[i] = min(1.0, updated_vector[i] + weight)
                            logger.debug(f"Updated attribute '{attr_name}' with weight {weight}")
            
            # Normalize the vector
            updated_vector = np.clip(updated_vector, 0, 1)
            
            logger.info(f"🎯 Updated preference vector with {len(attributes)} attribute categories")
            return updated_vector
            
        except Exception as e:
            logger.error(f"❌ Error updating preference vector: {str(e)}")
            raise RuntimeError(f"Failed to update preference vector: {str(e)}")
    
    def _item_matches_clothing_preference(self, item_id: str, clothing_preferences: List[str]) -> bool:
        """Check if an item matches any of the user's clothing preferences"""
        if not clothing_preferences:
            return True
        
        # Search through the data directory to find this item
        base_path = "../data/img"
        
        for gender_dir in os.listdir(base_path):
            gender_path = os.path.join(base_path, gender_dir)
            if not os.path.isdir(gender_path):
                continue
                
            for clothing_type_dir in os.listdir(gender_path):
                clothing_path = os.path.join(gender_path, clothing_type_dir)
                if not os.path.isdir(clothing_path):
                    continue
                
                # Check if this item exists in this clothing type
                item_path = os.path.join(clothing_path, item_id)
                if os.path.exists(item_path):
                    # Check if this clothing type matches user preferences
                    for preference in clothing_preferences:
                        if preference.lower() in clothing_type_dir.lower():
                            logger.info(f"✅ Item {item_id} matches preference '{preference}' in {clothing_type_dir}")
                            return True
        
        return False
    
    def _get_item_images(self, item_id: str) -> List[str]:
        """Get image paths for a specific item - DYNAMIC VERSION"""
        # First, try to find the actual item in the data directory
        base_path = "../data/img"
        
        # Search through all gender and clothing type directories
        for gender_dir in os.listdir(base_path):
            gender_path = os.path.join(base_path, gender_dir)
            if not os.path.isdir(gender_path):
                continue
                
            for clothing_type_dir in os.listdir(gender_path):
                clothing_path = os.path.join(gender_path, clothing_type_dir)
                if not os.path.isdir(clothing_path):
                    continue
                
                # Look for the specific item ID
                item_path = os.path.join(clothing_path, item_id)
                if os.path.exists(item_path):
                    # Found the item! Get its images
                    images = os.listdir(item_path)
                    if images:
                        # Filter for front/side/back images
                        front_images = [img for img in images if '_1_front.jpg' in img]
                        side_images = [img for img in images if '_2_side.jpg' in img]
                        back_images = [img for img in images if '_3_back.jpg' in img]
                        
                        # Build image URLs
                        image_urls = []
                        if front_images:
                            image_urls.append(f"http://192.168.1.9:5001/images/{gender_dir}/{clothing_type_dir}/{item_id}/{front_images[0]}")
                        if side_images:
                            image_urls.append(f"http://192.168.1.9:5001/images/{gender_dir}/{clothing_type_dir}/{item_id}/{side_images[0]}")
                        if back_images:
                            image_urls.append(f"http://192.168.1.9:5001/images/{gender_dir}/{clothing_type_dir}/{item_id}/{back_images[0]}")
                        
                        # If no specific views found, use any available images
                        if not image_urls:
                            for img in images[:3]:  # Take first 3 images
                                image_urls.append(f"http://192.168.1.9:5001/images/{gender_dir}/{clothing_type_dir}/{item_id}/{img}")
                        
                        logger.info(f"📸 Found {len(image_urls)} images for item {item_id} in {gender_dir}/{clothing_type_dir}")
                        return image_urls
        
        # If item not found, try to find similar items or use fallback
        logger.warning(f"⚠️ Item {item_id} not found in data directory, using fallback")
        
        # Fallback: Use a random existing item from WOMEN/Dresses
        fallback_items = [
            "id_00000002", "id_00000008", "id_00000009", "id_00000011", "id_00000021",
            "id_00000023", "id_00000027", "id_00000034", "id_00000035", "id_00000037"
        ]
        
        # Use hash to consistently map to a fallback item
        fallback_item = fallback_items[hash(item_id) % len(fallback_items)]
        fallback_path = f"../data/img/WOMEN/Dresses/{fallback_item}"
        
        if os.path.exists(fallback_path):
            images = os.listdir(fallback_path)
            if images:
                image_urls = []
                for img in images[:3]:  # Take first 3 images
                    image_urls.append(f"http://192.168.1.9:5001/images/WOMEN/Dresses/{fallback_item}/{img}")
                return image_urls
        
        # Ultimate fallback
        return [
            f"http://192.168.1.9:5001/images/WOMEN/Dresses/id_00000002/02_1_front.jpg",
            f"http://192.168.1.9:5001/images/WOMEN/Dresses/id_00000002/02_2_side.jpg",
            f"http://192.168.1.9:5001/images/WOMEN/Dresses/id_00000002/02_4_full.jpg"
        ]
    
    def _get_item_attributes(self, item_index: int) -> List[str]:
        """Get attribute names for a specific item"""
        if not self.loaded:
            return []
        
        # Get the item's attribute vector from the index
        try:
            item_vector = self.index.reconstruct(item_index)
        except:
            # If reconstruction fails, return empty list
            return []
        
        # Find positive attributes
        positive_attrs = []
        for i, value in enumerate(item_vector):
            if value > 0.5 and i < len(self.attribute_names):
                positive_attrs.append(self.attribute_names[i])
        
        return positive_attrs[:10]

# Initialize recommendation engine
recommendation_engine = FashionRecommendationEngine()

@app.on_event("startup")
async def startup_event():
    """Load data on startup"""
    try:
        recommendation_engine.load_data()
        logger.info("🚀 Fashion Recommendation API started successfully!")
    except Exception as e:
        logger.error(f"❌ Failed to start API: {str(e)}")
        raise

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "loaded": recommendation_engine.loaded,
        "timestamp": datetime.now().isoformat(),
        "total_items": len(recommendation_engine.item_ids) if recommendation_engine.item_ids else 0
    }

@app.get("/api/constructpreferencevector")
async def construct_preference_vector(
    gender: str = Query(..., description="Gender: MEN or WOMEN"),
    country: str = Query(..., description="Country name"),
    clothing_options: str = Query(..., description="Comma-separated clothing options"),
    user_id: str = Query(default="default", description="User session ID")
):
    """Construct initial preference vector based on user inputs"""
    try:
        # Parse clothing options
        clothing_list = [opt.strip() for opt in clothing_options.split(',')]
        
        # Store clothing preferences for this user
        user_clothing_preferences[user_id] = clothing_list
        
        logger.info(f"🎯 Constructing preference vector for {gender} from {country} with options: {clothing_list}")
        
        preference_vector = recommendation_engine.construct_preference_vector(
            gender, country, clothing_list
        )
        
        return {
            "success": True,
            "preference_vector": preference_vector.tolist(),
            "message": f"Constructed preference vector for {gender} from {country}",
            "user_id": user_id,
            "clothing_preferences": clothing_list
        }
        
    except Exception as e:
        logger.error(f"❌ Error constructing preference vector: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/action")
async def action(
    preference_vector: str = Query(..., description="Current preference vector as comma-separated values"),
    item_vector: str = Query(..., description="Item vector as comma-separated values"),
    action: str = Query(..., description="Action: like, dislike, or superlike")
):
    """Update preference vector based on user action"""
    try:
        # Parse vectors
        pref_vec = [float(x.strip()) for x in preference_vector.split(',')]
        item_vec = [float(x.strip()) for x in item_vector.split(',')]
        
        logger.info(f"🔄 Processing action: {action}")
        
        updated_vector = recommendation_engine.update_preference_vector(
            pref_vec, item_vec, action
        )
        
        return {
            "success": True,
            "updated_preference_vector": updated_vector.tolist(),
            "action": action,
            "message": f"Updated preference vector with {action} action"
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations")
async def get_recommendations(
    preference_vector: str = Query(..., description="Current preference vector as comma-separated values"),
    user_id: str = Query(default="default", description="User session ID"),
    gender: str = Query(default=None, description="User's gender for filtering")
):
    """Get next recommendation using filtered similarity search based on gender and clothing preferences"""
    try:
        # Parse preference vector
        pref_vec = [float(x.strip()) for x in preference_vector.split(',')]
        
        # Validate vector length
        if len(pref_vec) != 463:
            raise HTTPException(
                status_code=400, 
                detail=f"Preference vector must be exactly 463 dimensions, got {len(pref_vec)}"
            )
        
        # Get stored clothing preferences for this user
        clothing_preferences = user_clothing_preferences.get(user_id, [])
        
        logger.info(f"🎯 Getting filtered recommendation for user {user_id} (gender: {gender}, clothing: {clothing_preferences})")
        
        recommendation = recommendation_engine.get_recommendation(
            np.array(pref_vec), clothing_preferences, gender, user_id
        )
        
        return {
            "success": True,
            "recommendation": recommendation,
            "message": "Filtered recommendation generated successfully",
            "user_id": user_id,
            "gender_filter": gender,
            "clothing_preferences_used": clothing_preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reset-seen-items")
async def reset_seen_items(
    user_id: str = Query(default="default", description="User session ID")
):
    """Reset seen items for a user (for testing purposes)"""
    try:
        if user_id in user_seen_items:
            del user_seen_items[user_id]
            logger.info(f"🔄 Reset seen items for user {user_id}")
            return {
                "success": True,
                "message": f"Reset seen items for user {user_id}",
                "user_id": user_id
            }
        else:
            return {
                "success": True,
                "message": f"No seen items to reset for user {user_id}",
                "user_id": user_id
            }
    except Exception as e:
        logger.error(f"❌ Error resetting seen items: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/seen-items-status")
async def get_seen_items_status(
    user_id: str = Query(default="default", description="User session ID")
):
    """Get status of seen items for a user"""
    try:
        seen_items = user_seen_items.get(user_id, set())
        clothing_preferences = user_clothing_preferences.get(user_id, [])
        
        # Get total filtered items count
        filtered_indices = recommendation_engine._get_filtered_item_indices(gender, clothing_preferences)
        
        return {
            "success": True,
            "user_id": user_id,
            "total_items_seen": len(seen_items),
            "total_filtered_items": len(filtered_indices),
            "remaining_items": len(filtered_indices) - len(seen_items),
            "catalog_exhausted": len(seen_items) >= len(filtered_indices),
            "seen_items": list(seen_items) if len(seen_items) <= 10 else f"{len(seen_items)} items (too many to list)"
        }
    except Exception as e:
        logger.error(f"❌ Error getting seen items status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Query(default="default", description="User session ID"),
    current_preference_vector: str = Query(..., description="Current preference vector as comma-separated values")
):
    """Upload image and find closest match using VGG16"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Parse current preference vector
        pref_vec = [float(x.strip()) for x in current_preference_vector.split(',')]
        if len(pref_vec) != 463:
            raise HTTPException(status_code=400, detail="Preference vector must be exactly 463 dimensions")
        
        logger.info(f"🖼️ Processing uploaded image for user {user_id}")
        
        # Extract VGG16 features from uploaded image
        query_features = recommendation_engine.extract_vgg16_features(image_data)
        
        # Find closest match
        match_result = recommendation_engine.find_closest_vgg16_match(query_features)
        
        # Get the item vector for the matched item
        try:
            item_index = recommendation_engine.item_ids.index(match_result['item_id'])
            item_vector = recommendation_engine.index.reconstruct(item_index)
        except ValueError:
            raise HTTPException(status_code=404, detail="Matched item not found in database")
        
        # Update preference vector based on the matched item (like action)
        updated_vector = recommendation_engine.update_preference_vector(
            np.array(pref_vec), item_vector, 'like'
        )
        
        # Get new recommendation with updated vector
        clothing_preferences = user_clothing_preferences.get(user_id, [])
        recommendation = recommendation_engine.get_recommendation(
            updated_vector, clothing_preferences, None, user_id
        )
        
        return {
            "success": True,
            "message": "Image analyzed successfully",
            "match_result": match_result,
            "updated_preference_vector": updated_vector.tolist(),
            "new_recommendation": recommendation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing image upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/describe-style")
async def describe_style(
    description: str = Query(..., description="Style description text"),
    user_id: str = Query(default="default", description="User session ID"),
    current_preference_vector: str = Query(..., description="Current preference vector as comma-separated values")
):
    """Analyze style description and update preferences"""
    try:
        # Return 400 if Gemini is not configured instead of 500
        if gemini_model is None:
            raise HTTPException(status_code=400, detail="Gemini API key not configured on server")
        # Parse current preference vector
        pref_vec = [float(x.strip()) for x in current_preference_vector.split(',')]
        if len(pref_vec) != 463:
            raise HTTPException(status_code=400, detail="Preference vector must be exactly 463 dimensions")
        
        logger.info(f"💬 Analyzing style description for user {user_id}: {description[:50]}...")
        
        # Analyze style description using Gemini
        analysis_result = recommendation_engine.analyze_style_description(description)
        
        # Update preference vector based on extracted attributes
        updated_vector = recommendation_engine.update_preference_vector_from_attributes(
            np.array(pref_vec), 
            analysis_result['extracted_attributes'], 
            weight=0.4  # Higher weight for style descriptions
        )
        
        # Get new recommendation with updated vector
        clothing_preferences = user_clothing_preferences.get(user_id, [])
        recommendation = recommendation_engine.get_recommendation(
            updated_vector, clothing_preferences, None, user_id
        )
        
        return {
            "success": True,
            "message": "Style description analyzed successfully",
            "analysis_result": analysis_result,
            "updated_preference_vector": updated_vector.tolist(),
            "new_recommendation": recommendation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error analyzing style description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
