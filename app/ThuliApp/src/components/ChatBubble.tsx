import React from 'react';
import {
  Box,
  Text,
  Spinner,
  Divider,
  UserIcon,
  MessageCircleIcon,
  ImageIcon,
  FileTextIcon,
  VideoIcon,
  ClockIcon,
} from '@razorpay/blade/components';

import { Message } from '../types';
import { formatTime, truncateText } from '../utils/helpers';

interface ChatBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  maxWidth?: string;
  onAttachmentPress?: (attachment: any) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  showAvatar = true,
  showTimestamp = true,
  maxWidth = '80%',
  onAttachmentPress,
}) => {
  const isUser = message.isUser;
  const isTyping = message.isTyping;

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('video/')) return VideoIcon;
    return FileTextIcon;
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <Box marginTop="spacing.3">
        {message.attachments.map((attachment, index) => {
          const AttachmentIcon = getAttachmentIcon(attachment.type);
          
          return (
            <Box key={attachment.id}>
              {index > 0 && <Divider marginY="spacing.2" />}
              <Box
                flexDirection="row"
                alignItems="center"
                padding="spacing.2"
                backgroundColor={isUser ? "surface.background.gray.subtle" : "surface.background.gray.moderate"}
                borderRadius="medium"
              >
                <AttachmentIcon
                  size="small"
                  color="interactive.icon.gray.muted"
                  marginRight="spacing.2"
                />
                <Box flex={1}>
                  <Text
                    size="small"
                    weight="medium"
                    color="surface.text.gray.normal"
                    marginBottom="spacing.1"
                  >
                    {truncateText(attachment.name, 20)}
                  </Text>
                  <Text
                    size="small"
                    color="surface.text.gray.muted"
                  >
                    {attachment.type} • {(attachment.size / 1024).toFixed(1)} KB
                  </Text>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderTypingIndicator = () => (
    <Box flexDirection="row" alignItems="center">
      <Spinner size="medium" color="primary" accessibilityLabel="Loading" />
      <Text marginLeft="spacing.2" color="surface.text.gray.muted" size="small">
        AI is thinking...
      </Text>
    </Box>
  );

  return (
    <Box
      flexDirection="row"
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
      alignItems="flex-start"
      marginBottom="spacing.4"
    >
      {/* Left Avatar */}
      {!isUser && showAvatar && (
        <Box
          backgroundColor="surface.background.primary.subtle"
          borderRadius="round"
          padding="spacing.2"
          marginRight="spacing.3"
          marginTop="spacing.1"
        >
          <MessageCircleIcon size="small" color="interactive.icon.primary.muted" />
        </Box>
      )}

      {/* Message Bubble */}
      <Box
        backgroundColor={
          isUser 
            ? "surface.background.primary.subtle" 
            : "surface.background.gray.subtle"
        }
        borderRadius="large"
        padding="spacing.4"
        marginX="spacing.2"
        borderTopLeftRadius={!isUser && showAvatar ? "small" : "large"}
        borderTopRightRadius={isUser && showAvatar ? "small" : "large"}
      >
        {/* Message Content */}
        {isTyping ? (
          renderTypingIndicator()
        ) : (
          <>
            {/* Message Text */}
            {message.text && (
              <Text
                color="surface.text.gray.normal"
                marginBottom={message.attachments ? "spacing.2" : undefined}
              >
                {message.text}
              </Text>
            )}

            {/* Attachments */}
            {renderAttachments()}

            {/* Timestamp */}
            {showTimestamp && (
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="flex-end"
                marginTop="spacing.2"
              >
                <ClockIcon
                  size="small"
                  color="interactive.icon.gray.muted"
                  marginRight="spacing.1"
                />
                <Text
                  size="small"
                  color="surface.text.gray.muted"
                >
                  {formatTime(message.timestamp)}
                </Text>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Right Avatar */}
      {isUser && showAvatar && (
        <Box
          backgroundColor="surface.background.gray.subtle"
          borderRadius="round"
          padding="spacing.2"
          marginLeft="spacing.3"
          marginTop="spacing.1"
        >
          <UserIcon size="small" color="interactive.icon.gray.muted" />
        </Box>
      )}
    </Box>
  );
};

export default ChatBubble;
