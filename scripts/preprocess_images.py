#!/usr/bin/env python3

import os
import pickle
import numpy as np
import tensorflow as tf
import ssl
from tqdm import tqdm
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Fix SSL certificate issue for model downloading
ssl._create_default_https_context = ssl._create_unverified_context

# Configuration
IMAGE_DIRECTORY = '../data/img'  # Path to the folder containing all clothing images
OUTPUT_FILE = '../embeddings/vgg16_embeddings.pkl'  # Output file for saved embeddings
MODEL_INPUT_SHAPE = (224, 224)  # Required input dimensions for VGG16

def main():
    """
    Main function to extract VGG16 features from all clothing images.
    """
    print("🚀 Starting Fashion Image Feature Extraction")
    print("=" * 50)
    
    # Check if image directory exists
    if not os.path.exists(IMAGE_DIRECTORY):
        print(f"❌ Error: Image directory '{IMAGE_DIRECTORY}' not found!")
        return
    
    print(f"📁 Image Directory: {IMAGE_DIRECTORY}")
    print(f"💾 Output File: {OUTPUT_FILE}")
    print(f"📐 Input Shape: {MODEL_INPUT_SHAPE}")
    print()
    
    # Load the pre-trained VGG16 model
    print("🔄 Loading VGG16 model...")
    model = VGG16(
        weights='imagenet',
        include_top=False,  # Remove final classification layers
        input_shape=(224, 224, 3)
    )
    
    # Freeze the model's layers to prevent accidental training
    model.trainable = False
    
    print(f"✅ VGG16 model loaded successfully!")
    print(f"📊 Model output shape: {model.output_shape}")
    print()
    
    # Initialize dictionary to store embeddings
    image_embeddings = {}
    
    # Get all image files recursively
    print("🔍 Scanning for image files...")
    image_files = []
    for root, dirs, files in os.walk(IMAGE_DIRECTORY):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                image_files.append(os.path.join(root, file))
    
    image_files.sort()  # Ensure consistent order
    total_images = len(image_files)
    
    print(f"📸 Found {total_images} images to process")
    print()
    
    if total_images == 0:
        print("❌ No images found in the directory!")
        return
    
    # Process each image
    print("🔄 Extracting features...")
    successful_count = 0
    failed_count = 0
    
    for image_path in tqdm(image_files, desc="Processing images", unit="img"):
        try:
            # Load and preprocess the image
            img = load_img(image_path, target_size=MODEL_INPUT_SHAPE)
            img_array = img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)  # Create batch of one
            img_array = preprocess_input(img_array)  # VGG16 preprocessing
            
            # Extract features using VGG16
            features = model.predict(img_array, verbose=0)
            
            # Flatten the feature vector and store
            image_name = os.path.relpath(image_path, IMAGE_DIRECTORY)
            image_embeddings[image_name] = features.flatten()
            
            successful_count += 1
            
        except Exception as e:
            print(f"\n⚠️  Error processing {image_path}: {str(e)}")
            failed_count += 1
            continue
    
    print()
    print("=" * 50)
    print("📊 Processing Summary:")
    print(f"✅ Successfully processed: {successful_count} images")
    print(f"❌ Failed to process: {failed_count} images")
    print(f"📈 Success rate: {(successful_count/total_images)*100:.1f}%")
    print()
    
    if successful_count == 0:
        print("❌ No images were successfully processed!")
        return
    
    # Save the embeddings to pickle file
    print("💾 Saving embeddings...")
    try:
        with open(OUTPUT_FILE, 'wb') as f:
            pickle.dump(image_embeddings, f)
        
        print(f"✅ Successfully saved {len(image_embeddings)} embeddings to {OUTPUT_FILE}")
        
        # Calculate file size
        file_size = os.path.getsize(OUTPUT_FILE)
        if file_size > 1024 * 1024:  # MB
            size_str = f"{file_size / (1024 * 1024):.1f} MB"
        else:  # KB
            size_str = f"{file_size / 1024:.1f} KB"
        
        print(f"📁 File size: {size_str}")
        
    except Exception as e:
        print(f"❌ Error saving embeddings: {str(e)}")
        return
    
    print()
    print("🎉 Feature extraction completed successfully!")
    print("=" * 50)
    
    # Display sample information
    if image_embeddings:
        sample_key = list(image_embeddings.keys())[0]
        sample_features = image_embeddings[sample_key]
        print(f"📊 Sample embedding shape: {sample_features.shape}")
        print(f"📊 Sample embedding range: [{sample_features.min():.3f}, {sample_features.max():.3f}]")
        print(f"📊 Sample image: {sample_key}")

if __name__ == "__main__":
    main()
