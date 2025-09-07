import { FILE_TYPES, MAX_FILE_SIZE } from './constants';
import { FileData } from '../types';

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (mimeType: string): 'image' | 'document' | 'video' | 'other' => {
  if (FILE_TYPES.IMAGE.includes(mimeType as any)) return 'image';
  if (FILE_TYPES.DOCUMENT.includes(mimeType as any)) return 'document';
  if (FILE_TYPES.VIDEO.includes(mimeType as any)) return 'video';
  return 'other';
};

export const validateFileSize = (file: FileData): boolean => {
  const fileType = getFileType(file.type);
  switch (fileType) {
    case 'image':
      return file.size <= MAX_FILE_SIZE.IMAGE;
    case 'document':
      return file.size <= MAX_FILE_SIZE.DOCUMENT;
    case 'video':
      return file.size <= MAX_FILE_SIZE.VIDEO;
    default:
      return file.size <= MAX_FILE_SIZE.DOCUMENT;
  }
};

export const getFileIcon = (mimeType: string): string => {
  const fileType = getFileType(mimeType);
  switch (fileType) {
    case 'image':
      return 'image';
    case 'document':
      return 'file-text';
    case 'video':
      return 'video';
    default:
      return 'file';
  }
};

// Date utilities
export const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  
  if (diff < minute) {
    return 'Just now';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  } else if (diff < week) {
    return `${Math.floor(diff / day)}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Network utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await delay(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Platform utilities
export const isAndroid = (): boolean => {
  return require('react-native').Platform.OS === 'android';
};

export const isIOS = (): boolean => {
  return require('react-native').Platform.OS === 'ios';
};

// Theme utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  try {
    const { Appearance } = require('react-native');
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};
