# Thuli AI – System Design Summary

This document outlines the architecture and core logic of the Thuli AI fashion recommendation engine, a hybrid system I designed for rapid, personalized, and adaptive discovery.

---

### **Goal**

To deliver a state-of-the-art mobile recommendation experience that provides high-quality, personalized fashion suggestions from the first interaction and intelligently course-corrects based on real-time user feedback.

---

### **System Architecture: A Hybrid Two-Tower Model**

The engine is built on a **Two-Tower neural network architecture**, which I designed to learn a shared embedding space where user preferences and item attributes can be directly compared.

-   **User Tower:** This tower takes user profile information (gender, country, clothing preferences) and learns to generate a dense **user vector** (463-dim) representing a unique style profile. For new users, this is initialized using pre-computed **Style Archetypes**.
-   **Item Tower:** This tower ingests the 463-dimension attribute vector for each clothing item and learns to generate a corresponding **item vector** in the same shared embedding space.
-   **Core Task:** The model is trained to maximize the cosine similarity between a user's vector and the vectors of items they would like. This powerful architecture forms the foundation of my recommendation logic.

---

### **Core Recommendation & Learning Flow**

1.  **Onboarding → Initial Vector (Cold Start Solution):**
    -   **Inputs:** The user provides gender, country, and preferred clothing types.
    -   **Logic:** The backend matches these inputs to a pre-computed **Style Archetype vector**. This vector—representing a taste profile like "Classic Menswear" or "Trendy Womenswear"—serves as the user's initial position in the embedding space, ensuring immediate personalization.

2.  **Recommendation via ANN Search:**
    -   The user's current vector is used to query a **FAISS (IndexFlatIP)** index containing all item vectors.
    -   This Approximate Nearest Neighbor (ANN) search instantly retrieves the top `k` items with the highest cosine similarity, ensuring a fast and scalable retrieval process.
    -   The system then applies strict filtering (gender, seen items) to the candidate set before returning the top unseen match.

3.  **Real-Time Learning (Moving Average):**
    -   User actions (like, dislike, superlike) are sent to the `/api/action` endpoint.
    -   The backend updates the user's vector using a stable **moving average formula**, which smoothly adapts their profile based on feedback. A `superlike_weight` of **2.5** ensures that strong positive signals have a decisive impact on the user's vector.

---

### **Intelligent Course-Correction: Multi-Modal Feedback**

To handle scenarios where a user is dissatisfied with the recommendations, I've integrated two powerful feedback loops that allow for both visual and textual steering.

#### **1. The VGG16 Visual Escape Hatch**

-   **Trigger:** After a user dislikes a set number of items (e.g., 3), a "Show me something different" button appears, allowing them to upload an image of a style they like.
-   **Visual Search:**
    1.  The uploaded image is processed by a **pre-trained VGG16 model** to extract a rich visual embedding.
    2.  This visual embedding is used to find the most visually similar item in the catalog.
    3.  **The crucial step:** The attribute vector of this visually-matched item is then treated as a **strong "superlike"**, which significantly adjusts the user's position in the main Two-Tower embedding space.
-   **Outcome:** This "escape hatch" allows users to break out of a recommendation loop they dislike and steer the system in a completely new stylistic direction using purely visual input.

#### **2. Natural Language Steering with Gemini**

-   **Trigger:** Alongside the visual option, the user can also choose to describe their desired style in plain text (e.g., "a casual floral dress for a summer party").
-   **Gemini-Powered Extraction:**
    1.  The user's text is sent to the **Gemini API**.
    2.  I instruct the model to act as a fashion expert and extract key fashion attributes (like color, style, occasion, fit, material, pattern) from the text, mapping them to the known 463-dimension attribute space.
    3.  **The crucial step:** The extracted attributes are used to create a "steering vector" which is then applied as a **strong "superlike"** to the user's profile.
-   **Outcome:** This feature provides an intuitive, conversational way for users to articulate their preferences and receive immediate, highly relevant recommendations.

---

### **API & Engineering Highlights**

-   **API Endpoints:**
    -   `GET /api/constructpreferencevector` → initial vector
    -   `GET /api/recommendations` → next single recommendation (filtered + unseen)
    -   `GET /api/action` → update vector via like/dislike/superlike
    -   `POST /api/upload-image` → visual similarity update + recommendation
    -   `POST /api/describe-style` → Gemini‑driven update + recommendation
    -   **Utilities:** `POST /api/reset-seen-items`, `GET /api/seen-items-status`, `GET /api/health`
-   **Technical Decisions:**
    -   **Two-Tower Model** for state-of-the-art, preference-based retrieval.
    -   **FAISS (IndexFlatIP)** for millisecond-latency ANN search on the CPU.
    -   **Moving-average learning** for stable and interpretable online updates.
    -   **Session-scoped state** for a lightweight and responsive demo.
    -   **Strict filtering logic** to ensure recommendation relevance and avoid repetition.

---

### **Next Steps**

-   **Server-side persistence** for user vectors to enable cross-session memory.
-   **RNN Re-ranking:** Implement a GRU-based model to re-rank the candidates from the Two-Tower model, giving more weight to the user's immediate, in-session "mood."
-   **Hybrid Embeddings:** Fuse the VGG16 visual embeddings with the attribute vectors in the Item Tower for a richer, multi-modal understanding of fashion items.