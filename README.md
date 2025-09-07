# Thuli AI – Personalized Fashion Recommendations

A React Native + FastAPI project that delivers Tinder‑like fashion recommendations powered by FAISS ANN search, VGG16 visual embeddings, style archetypes, and a lightweight online learning loop. The app supports image uploads and natural‑language style descriptions (Gemini) to quickly steer results.

## What’s included
- React Native app (TypeScript) with a minimal home and a swipeable recommendation screen
- FastAPI backend with filtered FAISS similarity search and preference learning
- VGG16 visual similarity (upload a photo → find closest match)
- Gemini‑powered style parsing for natural‑language descriptions
- Session‑scoped seen‑items tracking and catalog‑exhaustion detection


## Architecture overview
- Frontend (`app/ThuliApp`)
  - Loads/updates a 463‑dim user preference vector client‑side
  - Calls backend for recommendations and learning updates
  - Tinder‑style card UI (like / dislike / superlike)
  - Feedback button appears after ≥3 dislikes: upload a photo or describe style
- Backend (`backend`)
  - Builds initial vector from gender + country + clothing types using style archetypes
  - Filters candidates (gender + clothing) before FAISS ANN search
  - Tracks seen items per `user_id` and never repeats them; detects catalog exhaustion
  - Optional VGG16 flow for visual similarity; optional Gemini for parsing style text

## Directory layout
```
thuli/
├── app/ThuliApp/                      # React Native app
│   ├── App.tsx                        # App entry
│   ├── index.js                       # RN entrypoint
│   ├── metro.config.js                # Metro config
│   ├── src/
│   │   ├── components/
│   │   │   └── TinderRecommendationScreen.tsx
│   │   └── services/
│   │       ├── fashionRecommendation.ts
│   │       └── userProfile.ts
│   └── android/ ios/                  # Native projects
├── backend/
│   ├── fashion_api.py                 # FastAPI server
├── data/
│   └── list_attr_cloth.txt            # 463 DeepFashion attribute names
├── embeddings/
│   ├── fashion_attributes.index       # FAISS index (dim=463)
│   ├── fashion_item_ids.pkl           # Item id list aligned to FAISS index
│   └── vgg16_embeddings.pkl           # Optional: path→VGG16 embedding
└── scripts/
    └── preprocess_images.py           # Build vgg16_embeddings.pkl from images/
```

## Data Source
https://mmlab.ie.cuhk.edu.hk/projects/DeepFashion/InShopRetrieval.html  

## Backend
### Requirements
- Python 3.10
- macOS note: TensorFlow is pinned to CPU; fork safety is handled in code; SSL relaxed for model download if needed

### Install & run
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -U pip wheel
# Core deps (install if not already present)
pip install fastapi uvicorn[standard] faiss-cpu numpy pydantic==2.* python-multipart tensorflow google-generativeai

# Run (macOS fork safety env)
OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES python3 fashion_api.py
# Server: http://0.0.0.0:5001
```

### Environment
```
# Enables /api/describe-style
GEMINI_API_KEY=your_key
```

### Data/embeddings expected (relative to backend/)
- `../embeddings/fashion_attributes.index`
- `../embeddings/fashion_item_ids.pkl`
- `../data/list_attr_cloth.txt`
- Optional: `../embeddings/vgg16_embeddings.pkl` for the upload flow

### API
Base URL: `http://<HOST>:5001`

Health
```bash
GET /api/health
```

Construct initial preference vector
```bash
GET /api/constructpreferencevector?gender=MEN|WOMEN&country=US&clothing_options=Dresses,Shirts
# → { success, preference_vector[463], user_id, clothing_preferences }
```

Get next recommendation (filtered + never‑repeat)
```bash
GET /api/recommendations?preference_vector=comma,separated,463,values
# → { success, message, recommendation: { item_id|null, item_vector, similarity_score,
#      image_paths[], attributes[], catalog_exhausted, total_items_seen, total_filtered_items } }
```

Apply action (online learning)
```bash
GET /api/action?preference_vector=...&item_vector=...&action=like|dislike|superlike
# → { success, updated_preference_vector, action }
```

Upload image → VGG16 match → update vector → fresh rec
```bash
POST /api/upload-image?user_id=default&current_preference_vector=...
Content-Type: multipart/form-data
file=@/path/to/photo.jpg
# → { success, match_result, updated_preference_vector, new_recommendation }
```

Describe style (Gemini) → adjust vector → fresh rec
```bash
POST /api/describe-style?description=I%20like%20casual...&user_id=default&current_preference_vector=...
# → { success, analysis_result, updated_preference_vector, new_recommendation }
```

Seen‑items utilities (optional/testing)
```bash
POST /api/reset-seen-items?user_id=default
GET  /api/seen-items-status?user_id=default
```

Backend behavior highlights
- Candidate set filtered by gender + clothing preferences before ANN search
- `user_id → seen item_ids` set avoids repeats; returns `catalog_exhausted: true` when done
- Gender + clothing weights amplified in initial vector
- Moving‑average update: `learning_rate = 0.1`, `superlike_weight = 2.5`
- Dynamic image path resolution (DeepFashion‑like layout)

## Frontend
### Requirements
- Node 20+
- React Native CLI toolchain (Android Studio / Xcode)

### Install & run
```bash
cd app/ThuliApp
npm install

# Start Metro (kill anything on 8081 first)
npx react-native start --reset-cache

# In another terminal: build & run
a) Android: npx react-native run-android
b) iOS:     npx react-native run-ios
```

### API base URL
Edit `app/ThuliApp/src/services/fashionRecommendation.ts` and set your backend IP:
```ts
constructor(baseUrl: string = 'http://192.168.1.9:5001') { /* update to your LAN IP */ }
```

### Key flows
- App launches straight to recommendations once a profile exists
- `TinderRecommendationScreen.tsx`
  - Builds preference vector (463‑dim)
  - Loads immediate recommendation
  - Like / Dislike / Superlike → `/api/action` → fetch next
  - Feedback button (after ≥3 dislikes)
    - Upload Image → opens native picker → `/api/upload-image`
    - Describe Style → preset options → `/api/describe-style`
  - Handles `catalog_exhausted` state

### Android permissions
- `INTERNET`, `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- Image picker: `react-native-image-picker`

## Scripts
Build VGG16 embeddings (optional visual similarity):
```bash
cd scripts
python3 preprocess_images.py   # reads ../data/img → writes ../embeddings/vgg16_embeddings.pkl
```

## Troubleshooting
Ports busy
```bash
# Metro 8081
lsof -ti:8081 | xargs kill -9
# Backend 5001
lsof -ti:5001 | xargs kill -9
```

React Native cache
```bash
npx react-native start --reset-cache
rm -rf app/ThuliApp/node_modules/.cache
```

Android build
```bash
cd app/ThuliApp/android && ./gradlew clean && cd ..
npx react-native run-android
```

Backend: upload requires `python-multipart`
```bash
source backend/venv/bin/activate
pip install python-multipart
```

macOS TensorFlow / fork safety
```bash
OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES python3 backend/fashion_api.py
```

HTTP 500 on `/api/describe-style`
- Ensure `GEMINI_API_KEY` is set and valid
- Verify backend stdout for Gemini errors; the endpoint returns a helpful fallback when parsing fails

Image picker not opening
- Rebuild after permission changes: `npx react-native run-android`
- Ensure `react-native-image-picker` is installed and linked

## Demo checklist
- Backend running; logs show items/attributes loaded
- Frontend `baseUrl` set to backend IP
- Dislike ≥3 items → feedback button appears
- Test both "Upload Image" and "Describe Style"; observe updated recommendations

