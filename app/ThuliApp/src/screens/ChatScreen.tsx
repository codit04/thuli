import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  Box,
  Text,
  TextInput,
  Button,
  Card,
  CardBody,
  Spinner,
  Badge,
  Divider,
} from '@razorpay/blade/components';
import {
  SendIcon,
  PaperclipIcon,
  UserIcon,
  BotIcon,
  ImageIcon,
  FileTextIcon,
  TrashIcon,
  MoreHorizontalIcon,
} from '@razorpay/blade/components';

import { useMessages, useChatActions, useFiles, useFileActions } from '../store';
import { sendChatMessage } from '../services/api';
import { fileService } from '../services/files';
import { Message, FileData, ChatScreenProps } from '../types';
import { formatDate, formatTime, truncateText } from '../utils/helpers';
import { CHAT_CONFIG } from '../utils/constants';

const ChatScreen: React.FC<ChatScreenProps> = ({ messages: propMessages, onSendMessage }) => {
  const storeMessages = useMessages();
  const { addMessage, setTyping } = useChatActions();
  const files = useFiles();
  const { addFile } = useFileActions();
  
  const messages = propMessages || storeMessages;
  const flatListRef = useRef<FlatList>(null);
  
  const [inputText, setInputText] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const messageText = inputText.trim();
    if (!messageText && selectedAttachments.length === 0) return;

    const tempInputText = inputText;
    const tempAttachments = [...selectedAttachments];
    
    // Clear input immediately
    setInputText('');
    setSelectedAttachments([]);
    setIsLoading(true);

    try {
      // Add user message
      const userMessage: Omit<Message, 'id' | 'timestamp'> = {
        text: messageText,
        isUser: true,
        attachments: tempAttachments.length > 0 ? tempAttachments : undefined,
      };

      if (onSendMessage) {
        onSendMessage(messageText, tempAttachments);
      } else {
        addMessage(userMessage);
      }

      // Show typing indicator
      setShowTyping(true);
      setTyping(true);

      // Send to API
      const response = await sendChatMessage(messageText, tempAttachments);

      if (response.success) {
        // Add AI response
        const aiMessage: Omit<Message, 'id' | 'timestamp'> = {
          text: response.data.response,
          isUser: false,
        };

        if (!onSendMessage) {
          addMessage(aiMessage);
        }
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setInputText(tempInputText);
              setSelectedAttachments(tempAttachments);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setIsLoading(false);
      setShowTyping(false);
      setTyping(false);
    }
  };

  const handleAttachFile = async () => {
    try {
      const selectedFiles = await fileService.pickAnyFile();
      if (selectedFiles.length > 0) {
        const { validFiles, invalidFiles } = fileService.validateFiles(selectedFiles);
        
        // Check attachment limit
        const totalAttachments = selectedAttachments.length + validFiles.length;
        if (totalAttachments > CHAT_CONFIG.MAX_ATTACHMENTS) {
          Alert.alert(
            'Too Many Files',
            `You can only attach up to ${CHAT_CONFIG.MAX_ATTACHMENTS} files per message.`
          );
          return;
        }

        // Add valid files to attachments
        setSelectedAttachments(prev => [...prev, ...validFiles]);
        
        // Add to files store
        validFiles.forEach(file => addFile(file));

        // Show errors for invalid files
        if (invalidFiles.length > 0) {
          const errorMessage = invalidFiles
            .map(({ file, error }) => `${file.name}: ${error}`)
            .join('\n');
          Alert.alert('Some files were rejected', errorMessage);
        }
      }
    } catch (error) {
      console.error('File attachment error:', error);
      Alert.alert('Error', 'Failed to attach files');
    }
  };

  const handleRemoveAttachment = (fileId: string) => {
    setSelectedAttachments(prev => prev.filter(f => f.id !== fileId));
  };

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const isUser = message.isUser;
    const isTyping = message.isTyping;
    const showTimestamp = index === 0 || 
      (messages[index - 1] && 
       Math.abs(message.timestamp.getTime() - messages[index - 1].timestamp.getTime()) > 300000); // 5 minutes

    return (
      <Box marginBottom="spacing.4">
        {/* Timestamp */}
        {showTimestamp && (
          <Box alignItems="center" marginBottom="spacing.3">
            <Badge color="gray" size="small">
              {formatDate(message.timestamp)} at {formatTime(message.timestamp)}
            </Badge>
          </Box>
        )}

        {/* Message */}
        <Box 
          flexDirection="row" 
          justifyContent={isUser ? 'flex-end' : 'flex-start'}
          alignItems="flex-start"
        >
          {/* Avatar */}
          {!isUser && (
            <Box
              backgroundColor="surface.background.primary.subtle"
              borderRadius="round"
              padding="spacing.2"
              marginRight="spacing.3"
              marginTop="spacing.1"
            >
              <BotIcon size="small" color="interactive.icon.primary.default" />
            </Box>
          )}

          {/* Message Content */}
          <Box
            backgroundColor={isUser ? "surface.background.primary.default" : "surface.background.gray.subtle"}
            borderRadius="large"
            padding="spacing.4"
            marginHorizontal="spacing.2"
            maxWidth="80%"
          >
            {/* Typing indicator */}
            {isTyping ? (
              <Box flexDirection="row" alignItems="center">
                <Spinner size="small" />
                <Text marginLeft="spacing.2" color="surface.text.gray.muted" size="small">
                  AI is thinking...
                </Text>
              </Box>
            ) : (
              <>
                {/* Message text */}
                {message.text && (
                  <Text
                    color={isUser ? "surface.text.white.normal" : "surface.text.gray.normal"}
                    marginBottom={message.attachments ? "spacing.3" : undefined}
                  >
                    {message.text}
                  </Text>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <Box>
                    {message.attachments.map((file, fileIndex) => (
                      <Box key={file.id}>
                        {fileIndex > 0 && <Divider marginY="spacing.2" />}
                        <Box flexDirection="row" alignItems="center">
                          <Box marginRight="spacing.2">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon size="small" color={isUser ? "interactive.icon.white.default" : "interactive.icon.gray.default"} />
                            ) : (
                              <FileTextIcon size="small" color={isUser ? "interactive.icon.white.default" : "interactive.icon.gray.default"} />
                            )}
                          </Box>
                          <Text
                            size="small"
                            color={isUser ? "surface.text.white.normal" : "surface.text.gray.normal"}
                          >
                            {truncateText(file.name, 25)}
                          </Text>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* User avatar */}
          {isUser && (
            <Box
              backgroundColor="surface.background.gray.subtle"
              borderRadius="round"
              padding="spacing.2"
              marginLeft="spacing.3"
              marginTop="spacing.1"
            >
              <UserIcon size="small" color="interactive.icon.gray.default" />
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderAttachments = () => {
    if (selectedAttachments.length === 0) return null;

    return (
      <Box
        backgroundColor="surface.background.gray.subtle"
        padding="spacing.4"
        marginBottom="spacing.2"
        borderRadius="medium"
      >
        <Text size="small" weight="medium" marginBottom="spacing.3">
          Attachments ({selectedAttachments.length})
        </Text>
        {selectedAttachments.map((file, index) => (
          <Box key={file.id}>
            {index > 0 && <Divider marginY="spacing.2" />}
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="spacing.2">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon size="small" />
                  ) : (
                    <FileTextIcon size="small" />
                  )}
                </Box>
                <Box flex={1}>
                  <Text size="small" weight="medium">
                    {truncateText(file.name, 20)}
                  </Text>
                  <Text size="small" color="surface.text.gray.muted">
                    {file.type} • {(file.size / 1024).toFixed(1)} KB
                  </Text>
                </Box>
              </Box>
              <Button
                variant="tertiary"
                size="small"
                icon={TrashIcon}
                onPress={() => handleRemoveAttachment(file.id)}
                color="negative"
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const renderInput = () => (
    <Box
      backgroundColor="surface.background.gray.subtle"
      padding="spacing.4"
      borderTopWidth={1}
      borderTopColor="surface.border.gray.muted"
    >
      {renderAttachments()}
      
      <Box flexDirection="row" alignItems="flex-end">
        {/* Attachment Button */}
        <Button
          variant="tertiary"
          size="medium"
          icon={PaperclipIcon}
          onPress={handleAttachFile}
          marginRight="spacing.3"
          isDisabled={isLoading}
        />

        {/* Text Input */}
        <Box flex={1} marginRight="spacing.3">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            multiline
            maxLength={CHAT_CONFIG.MAX_MESSAGE_LENGTH}
            textAlignVertical="top"
            isDisabled={isLoading}
          />
        </Box>

        {/* Send Button */}
        <Button
          variant={inputText.trim() || selectedAttachments.length > 0 ? "primary" : "secondary"}
          size="medium"
          icon={SendIcon}
          onPress={handleSendMessage}
          isDisabled={!inputText.trim() && selectedAttachments.length === 0}
          isLoading={isLoading}
        />
      </Box>

      {/* Character count */}
      {inputText.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH * 0.8 && (
        <Box marginTop="spacing.2" alignItems="flex-end">
          <Text
            size="small"
            color={inputText.length >= CHAT_CONFIG.MAX_MESSAGE_LENGTH ? "surface.text.negative.normal" : "surface.text.gray.muted"}
          >
            {inputText.length}/{CHAT_CONFIG.MAX_MESSAGE_LENGTH}
          </Text>
        </Box>
      )}
    </Box>
  );

  const renderEmptyState = () => (
    <Box flex={1} justifyContent="center" alignItems="center" padding="spacing.6">
      <Box
        backgroundColor="surface.background.primary.subtle"
        borderRadius="large"
        padding="spacing.4"
        marginBottom="spacing.4"
      >
        <BotIcon size="xlarge" color="interactive.icon.primary.default" />
      </Box>
      <Text size="large" weight="semibold" marginBottom="spacing.2" textAlign="center">
        Start a conversation
      </Text>
      <Text color="surface.text.gray.muted" textAlign="center" marginBottom="spacing.4">
        Ask me anything! I can help with image analysis, document processing, and general questions.
      </Text>
      <Box flexDirection="row" flexWrap="wrap" justifyContent="center">
        <Badge color="information" marginRight="spacing.2" marginBottom="spacing.2">
          Image Recognition
        </Badge>
        <Badge color="positive" marginRight="spacing.2" marginBottom="spacing.2">
          Document Analysis
        </Badge>
        <Badge color="notice" marginBottom="spacing.2">
          AI Assistant
        </Badge>
      </Box>
    </Box>
  );

  return (
    <KeyboardAvoidingView
      flex={1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      backgroundColor="surface.background.gray.intense"
    >
      {/* Header */}
      <Box
        backgroundColor="surface.background.gray.subtle"
        paddingHorizontal="spacing.4"
        paddingVertical="spacing.5"
        borderBottomWidth={1}
        borderBottomColor="surface.border.gray.muted"
      >
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flexDirection="row" alignItems="center">
            <Box
              backgroundColor="surface.background.positive.subtle"
              borderRadius="round"
              padding="spacing.2"
              marginRight="spacing.3"
            >
              <BotIcon size="medium" color="interactive.icon.positive.default" />
            </Box>
            <Box>
              <Text weight="semibold">AI Assistant</Text>
              <Box flexDirection="row" alignItems="center">
                <Box
                  width="8px"
                  height="8px"
                  backgroundColor="surface.background.positive.default"
                  borderRadius="round"
                  marginRight="spacing.2"
                />
                <Text size="small" color="surface.text.gray.muted">
                  Online
                </Text>
              </Box>
            </Box>
          </Box>
          
          <Button
            variant="tertiary"
            size="medium"
            icon={MoreHorizontalIcon}
            onPress={() => {
              // TODO: Show chat options
            }}
          />
        </Box>
      </Box>

      {/* Messages */}
      <Box flex={1}>
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </Box>

      {/* Input */}
      {renderInput()}
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;



