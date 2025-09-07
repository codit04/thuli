// Application constants

export const COLORS = {
  primary: '#1E90FF',
  secondary: '#32CD32',
  accent: '#FF6347',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  error: '#DC3545',
  warning: '#FFC107',
  success: '#28A745',
  info: '#17A2B8',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
} as const;

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const SCREEN_NAMES = {
  HOME: 'Home',
  UPLOAD: 'Upload',
  CAMERA: 'Camera',
  CHAT: 'Chat',
} as const;

export const API_ENDPOINTS = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.thuli.com',
  UPLOAD: '/files/upload',
  CHAT: '/chat/message',
  USER: '/user',
} as const;

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime'],
} as const;

export const MAX_FILE_SIZE = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  VIDEO: 100 * 1024 * 1024, // 100MB
} as const;

export const CAMERA_SETTINGS = {
  PHOTO: {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  VIDEO: {
    quality: 'high',
    maxDuration: 60, // seconds
  },
} as const;

export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_TIMEOUT: 3000,
  MAX_ATTACHMENTS: 5,
} as const;

export const PERMISSIONS = {
  CAMERA: 'android.permission.CAMERA',
  WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
  RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
} as const;



