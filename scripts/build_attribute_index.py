#!/usr/bin/env python3
"""
Fashion Attribute Index Builder
===============================

This script loads the DeepFashion attribute data and creates a Faiss index
for fast similarity search based on clothing attributes. The index enables
finding similar fashion items based on their 463-dimensional attribute vectors.

Features:
- Loads attribute data from list_attr_items.txt
- Creates 2D NumPy array (7982 items × 463 attributes)
- Builds Faiss IndexFlatL2 for L2 distance similarity
- Saves index and item IDs for fast loading
- Handles data preprocessing and validation

Author: Thuli AI Hackathon Team
Date: 2024
"""

import os
import pickle
import numpy as np
import faiss
from tqdm import tqdm

def load_attribute_data(file_path):
    """
    Load attribute data from list_attr_items.txt file.
    
    Args:
        file_path (str): Path to the attribute items file
        
    Returns:
        tuple: (item_ids, attribute_matrix) where attribute_matrix is (N, 463)
    """
    print(f"📁 Loading attribute data from: {file_path}")
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Attribute file not found: {file_path}")
    
    item_ids = []
    attribute_vectors = []
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Skip header lines (first 2 lines)
    data_lines = lines[2:]
    
    print(f"📊 Processing {len(data_lines)} items...")
    
    for line in tqdm(data_lines, desc="Loading attributes", unit="item"):
        parts = line.strip().split()
        if len(parts) < 2:
            continue
            
        item_id = parts[0]
        attributes = parts[1:]
        
        # Convert attributes to float32
        try:
            attr_vector = np.array([float(x) for x in attributes], dtype=np.float32)
            item_ids.append(item_id)
            attribute_vectors.append(attr_vector)
        except ValueError as e:
            print(f"⚠️  Skipping invalid line: {line.strip()}")
            continue
    
    # Convert to numpy array
    attribute_matrix = np.array(attribute_vectors, dtype=np.float32)
    
    print(f"✅ Loaded {len(item_ids)} items with {attribute_matrix.shape[1]} attributes each")
    print(f"📊 Data shape: {attribute_matrix.shape}")
    print(f"📊 Data type: {attribute_matrix.dtype}")
    print(f"📊 Value range: [{attribute_matrix.min():.3f}, {attribute_matrix.max():.3f}]")
    
    return item_ids, attribute_matrix

def build_faiss_index(attribute_matrix, index_type='L2'):
    """
    Build Faiss index for attribute similarity search.
    
    Args:
        attribute_matrix (np.ndarray): 2D array of shape (N, 463)
        index_type (str): Type of index ('L2' or 'IP' for inner product)
        
    Returns:
        faiss.Index: Built Faiss index
    """
    print(f"🔨 Building Faiss {index_type} index...")
    
    dimension = attribute_matrix.shape[1]
    print(f"📐 Dimension: {dimension}")
    
    if index_type == 'L2':
        index = faiss.IndexFlatL2(dimension)
    elif index_type == 'IP':
        index = faiss.IndexFlatIP(dimension)
    else:
        raise ValueError("index_type must be 'L2' or 'IP'")
    
    # Add vectors to index
    print("📥 Adding vectors to index...")
    index.add(attribute_matrix)
    
    print(f"✅ Index built successfully!")
    print(f"📊 Index size: {index.ntotal} vectors")
    print(f"📊 Index dimension: {index.d}")
    
    return index

def save_index_and_ids(index, item_ids, index_file, ids_file):
    """
    Save Faiss index and item IDs to files.
    
    Args:
        index (faiss.Index): Faiss index to save
        item_ids (list): List of item IDs
        index_file (str): Path to save index file
        ids_file (str): Path to save item IDs file
    """
    print("💾 Saving index and item IDs...")
    
    # Save Faiss index
    faiss.write_index(index, index_file)
    print(f"✅ Index saved to: {index_file}")
    
    # Save item IDs
    with open(ids_file, 'wb') as f:
        pickle.dump(item_ids, f)
    print(f"✅ Item IDs saved to: {ids_file}")
    
    # Calculate file sizes
    index_size = os.path.getsize(index_file)
    ids_size = os.path.getsize(ids_file)
    
    print(f"📁 Index file size: {index_size / (1024*1024):.1f} MB")
    print(f"📁 IDs file size: {ids_size / 1024:.1f} KB")

def test_index(index, item_ids, attribute_matrix, num_tests=5):
    """
    Test the built index with sample queries.
    
    Args:
        index (faiss.Index): Faiss index
        item_ids (list): List of item IDs
        attribute_matrix (np.ndarray): Attribute matrix
        num_tests (int): Number of test queries
    """
    print(f"🧪 Testing index with {num_tests} sample queries...")
    
    for i in range(min(num_tests, len(item_ids))):
        query_vector = attribute_matrix[i:i+1]  # Single query
        query_id = item_ids[i]
        
        # Search for top 5 similar items
        distances, indices = index.search(query_vector, 5)
        
        print(f"\n🔍 Query Item: {query_id}")
        print("📋 Top 5 Similar Items:")
        for j, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            similar_id = item_ids[idx]
            print(f"  {j+1}. {similar_id} (distance: {dist:.3f})")

def main():
    """
    Main function to build fashion attribute index.
    """
    print("🚀 Fashion Attribute Index Builder")
    print("=" * 50)
    
    # Configuration
    ATTRIBUTE_FILE = '../data/list_attr_items.txt'
    INDEX_FILE = '../embeddings/fashion_attributes.index'
    IDS_FILE = '../embeddings/fashion_item_ids.pkl'
    INDEX_TYPE = 'IP'  # Use inner product (cosine similarity) for fashion attributes
    
    print(f"📁 Attribute file: {ATTRIBUTE_FILE}")
    print(f"💾 Index file: {INDEX_FILE}")
    print(f"💾 IDs file: {IDS_FILE}")
    print(f"🔧 Index type: {INDEX_TYPE}")
    print()
    
    try:
        # Load attribute data
        item_ids, attribute_matrix = load_attribute_data(ATTRIBUTE_FILE)
        print()
        
        # Build Faiss index
        index = build_faiss_index(attribute_matrix, INDEX_TYPE)
        print()
        
        # Save index and item IDs
        save_index_and_ids(index, item_ids, INDEX_FILE, IDS_FILE)
        print()
        
        # Test the index
        test_index(index, item_ids, attribute_matrix)
        print()
        
        print("🎉 Index building completed successfully!")
        print("=" * 50)
        
        # Display summary statistics
        print("📊 Summary Statistics:")
        print(f"  • Total items: {len(item_ids)}")
        print(f"  • Attributes per item: {attribute_matrix.shape[1]}")
        print(f"  • Index type: {INDEX_TYPE}")
        print(f"  • Memory usage: ~{attribute_matrix.nbytes / (1024*1024):.1f} MB")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
