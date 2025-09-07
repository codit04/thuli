import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import userProfileService from '../services/userProfile';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => Promise<string>;
  isLoading?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  isLoading = false 
}) => {
  const getInitialMessage = (): string => {
    const profile = userProfileService.getProfile();
    if (profile) {
      const recommendations = userProfileService.getPersonalizedRecommendations();
      return `👋 Hi! I'm your personalized fashion assistant powered by Gemini. I know you're interested in ${recommendations.gender} fashion, specifically ${recommendations.clothingTypes.join(', ')}. I can help you with:\n\n• Styling advice for ${recommendations.ageGroup}\n• Fashion trends in ${recommendations.location}\n• Recommendations for your favorite categories\n• Age-appropriate styling tips\n\nWhat would you like to know?`;
    }
    return "👋 Hello! I'm your AI assistant powered by Gemini. I can help you with:\n\n• React Native development\n• AI integration questions\n• Computer vision concepts\n• Hackathon project ideas\n\nWhat would you like to explore?";
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getInitialMessage(),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const generateId = () => Date.now().toString() + Math.random().toString(36);

  const addMessage = (text: string, isUser: boolean, isTyping?: boolean) => {
    const newMessage: Message = {
      id: generateId(),
      text,
      isUser,
      timestamp: new Date(),
      isTyping,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const removeTypingMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleSendMessage = async () => {
    const messageText = inputText.trim();
    if (!messageText || isSending) return;

    // Clear input immediately
    setInputText('');
    setIsSending(true);

    // Add user message
    addMessage(messageText, true);

    try {
      // Add typing indicator
      const typingId = addMessage('', false, true);

      let response: string;
      
      if (onSendMessage) {
        // Use custom message handler
        response = await onSendMessage(messageText);
      } else {
        // Default mock response
        await new Promise<void>(resolve => setTimeout(resolve, 1500)); // Simulate thinking
        response = getMockResponse(messageText);
      }

      // Remove typing indicator and add response
      removeTypingMessage(typingId);
      addMessage(response, false);
    } catch (error) {
      console.error('Chat error:', error);
      // Remove typing indicator if it exists
      const typingMessage = messages.find(m => m.isTyping);
      if (typingMessage) {
        removeTypingMessage(typingMessage.id);
      }
      addMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
      setIsSending(false);
    }
  };

  const getMockResponse = (message: string): string => {
    const responses = [
      "That's an interesting question! Let me help you with that.",
      "Great point! Here's what I think about that topic.",
      "I'd be happy to help you explore that further.",
      "That's a common challenge in AI development. Here's my perspective.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isTyping) {
      return (
        <View style={[styles.messageContainer, styles.aiMessageContainer]}>
          <View style={styles.messageBubble}>
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            item.isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.aiTimestamp
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([{
              id: '1',
              text: '👋 Chat cleared! How can I help you today?',
              isUser: false,
              timestamp: new Date(),
            }]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Powered by Gemini</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
          <Text style={styles.clearButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              editable={!isSending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.sendButtonText}>📤</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Character count */}
          <Text style={styles.charCount}>
            {inputText.length}/500
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
  },
  
  // Chat Container
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  
  // Messages
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#999',
  },
  
  // Typing Indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  
  // Input Area
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default ChatInterface;