import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, FileData, Message, UserData } from '../types';
import { generateId } from '../utils/helpers';

interface AppStore extends AppState {
  // File actions
  addFile: (file: Omit<FileData, 'id' | 'createdAt'>) => void;
  removeFile: (fileId: string) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  clearFiles: () => void;
  
  // Chat actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;
  setTyping: (isTyping: boolean) => void;
  
  // User actions
  setUser: (user: UserData) => void;
  updateUser: (updates: Partial<UserData>) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setActiveScreen: (screen: string) => void;
  setNetworkStatus: (status: 'online' | 'offline') => void;
  
  // Reset actions
  reset: () => void;
}

const initialState: AppState = {
  files: [],
  chatMessages: [],
  user: {
    id: generateId(),
    name: 'User',
    email: '',
    avatar: '',
  },
  ui: {
    isLoading: false,
    theme: 'auto',
    activeScreen: 'Home',
    networkStatus: 'online',
  },
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // File actions
      addFile: (fileData) => {
        const newFile: FileData = {
          ...fileData,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          files: [...state.files, newFile],
        }));
      },
      
      removeFile: (fileId) => {
        set((state) => ({
          files: state.files.filter(f => f.id !== fileId),
        }));
      },
      
      updateFileProgress: (fileId, progress) => {
        set((state) => ({
          files: state.files.map(f =>
            f.id === fileId ? { ...f, uploadProgress: progress } : f
          ),
        }));
      },
      
      clearFiles: () => {
        set({ files: [] });
      },
      
      // Chat actions
      addMessage: (messageData) => {
        const newMessage: Message = {
          ...messageData,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => ({
          chatMessages: [...state.chatMessages, newMessage],
        }));
      },
      
      removeMessage: (messageId) => {
        set((state) => ({
          chatMessages: state.chatMessages.filter(m => m.id !== messageId),
        }));
      },
      
      clearMessages: () => {
        set({ chatMessages: [] });
      },
      
      setTyping: (isTyping) => {
        const typingMessage: Message = {
          id: 'typing',
          text: '',
          isUser: false,
          timestamp: new Date(),
          isTyping: true,
        };
        
        set((state) => {
          const messagesWithoutTyping = state.chatMessages.filter(m => m.id !== 'typing');
          return {
            chatMessages: isTyping 
              ? [...messagesWithoutTyping, typingMessage]
              : messagesWithoutTyping,
          };
        });
      },
      
      // User actions
      setUser: (user) => {
        set({ user });
      },
      
      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
        }));
      },
      
      // UI actions
      setLoading: (isLoading) => {
        set((state) => ({
          ui: { ...state.ui, isLoading },
        }));
      },
      
      setTheme: (theme) => {
        set((state) => ({
          ui: { ...state.ui, theme },
        }));
      },
      
      setActiveScreen: (activeScreen) => {
        set((state) => ({
          ui: { ...state.ui, activeScreen },
        }));
      },
      
      setNetworkStatus: (networkStatus) => {
        set((state) => ({
          ui: { ...state.ui, networkStatus },
        }));
      },
      
      // Reset actions
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'thuli-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        ui: {
          theme: state.ui.theme,
        },
        // Don't persist files and messages for now
      }),
    }
  )
);

// Selectors for better performance
export const useFiles = () => useAppStore((state) => state.files);
export const useMessages = () => useAppStore((state) => state.chatMessages);
export const useUser = () => useAppStore((state) => state.user);
export const useUI = () => useAppStore((state) => state.ui);
export const useTheme = () => useAppStore((state) => state.ui.theme);
export const useLoading = () => useAppStore((state) => state.ui.isLoading);
export const useNetworkStatus = () => useAppStore((state) => state.ui.networkStatus);

// Actions selectors
export const useFileActions = () => useAppStore((state) => ({
  addFile: state.addFile,
  removeFile: state.removeFile,
  updateFileProgress: state.updateFileProgress,
  clearFiles: state.clearFiles,
}));

export const useChatActions = () => useAppStore((state) => ({
  addMessage: state.addMessage,
  removeMessage: state.removeMessage,
  clearMessages: state.clearMessages,
  setTyping: state.setTyping,
}));

export const useUserActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  updateUser: state.updateUser,
}));

export const useUIActions = () => useAppStore((state) => ({
  setLoading: state.setLoading,
  setTheme: state.setTheme,
  setActiveScreen: state.setActiveScreen,
  setNetworkStatus: state.setNetworkStatus,
}));



