# Thuli App - AI/CV Hackathon Prototype

A React Native app built with Razorpay's Blade Design System for AI and Computer Vision hackathon.

## Features

- **Home Dashboard**: Overview of files, messages, and quick actions
- **File Upload**: Multi-file picker with validation and progress tracking
- **Camera**: Photo/video capture with AI-ready processing
- **AI Chat**: Interactive chatbot with file attachment support
- **Blade UI**: Consistent design system throughout

## Tech Stack

- React Native 0.81.1
- TypeScript
- Razorpay Blade Design System
- Zustand (State Management)
- React Navigation 6
- React Native Vision Camera
- React Native Document Picker
- Axios (Network layer)

## Setup Instructions

### Prerequisites

- Node.js >= 20
- React Native development environment
- Android SDK (for Android development)

### Installation

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Android setup:**
   ```bash
   npx react-native run-android
   ```

3. **Start Metro bundler:**
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── components/           # Reusable Blade-wrapped components
│   ├── FileCard.tsx     # File display component
│   ├── ChatBubble.tsx   # Chat message component
│   ├── CameraControls.tsx # Camera UI controls
│   ├── LoadingOverlay.tsx # Loading indicator
│   └── ErrorBoundary.tsx  # Error handling
├── screens/             # Main feature screens
│   ├── HomeScreen.tsx   # Dashboard with stats and quick actions
│   ├── UploadScreen.tsx # File picker and upload management
│   ├── CameraScreen.tsx # Camera interface
│   └── ChatScreen.tsx   # AI chat interface
├── services/            # API and utility services
│   ├── api.ts          # Network layer with mock data
│   ├── camera.ts       # Camera service wrapper
│   └── files.ts        # File handling utilities
├── store/              # Zustand state management
│   └── index.ts        # Global app state
├── types/              # TypeScript definitions
│   └── index.ts        # Type definitions
├── utils/              # Helper functions
│   ├── constants.ts    # App constants
│   └── helpers.ts      # Utility functions
└── navigation/         # React Navigation setup
    └── AppNavigator.tsx # Tab navigation
```

## Key Components

### State Management (Zustand)
- Global app state with persistence
- File management actions
- Chat message handling
- UI state tracking

### Services Layer
- **API Service**: HTTP client with mock responses for development
- **Camera Service**: Vision camera wrapper with permissions
- **File Service**: Document picker with validation

### Design System Integration
- Blade components used throughout
- Theme-aware color schemes
- Consistent spacing and typography
- Accessibility support

## Development Features

- **Mock API**: Pre-built responses for rapid development
- **Error Boundaries**: Graceful error handling
- **TypeScript**: Full type safety
- **Hot Reload**: Fast development iteration
- **Modular Architecture**: Easy team collaboration

## Permissions Required

- Camera access (for photo/video capture)
- Storage access (for file selection)
- Network access (for API calls)

## Hackathon-Ready Features

- **Demo Data**: Pre-loaded mock content
- **Quick Setup**: Single command installation
- **Team-Friendly**: Modular components for parallel development
- **Extensible**: Easy to add new AI/CV features
- **Professional UI**: Polished Blade design system

## Known Issues

- Some Blade components may have React 19 compatibility warnings (resolved with --legacy-peer-deps)
- Camera permissions need to be granted manually on first launch
- File upload progress is simulated (replace with real implementation)

## Next Steps

1. Replace mock API with real backend endpoints
2. Implement actual AI/CV processing
3. Add more camera features (filters, effects)
4. Enhanced error handling and offline support
5. Add unit tests and integration tests

## Architecture Highlights

- **Separation of Concerns**: Clear separation between UI, state, and services
- **Type Safety**: Comprehensive TypeScript definitions
- **Error Handling**: Robust error boundaries and user feedback
- **Performance**: Optimized components and navigation
- **Accessibility**: Blade's built-in a11y support

Perfect for hackathon rapid development with production-ready architecture foundations.