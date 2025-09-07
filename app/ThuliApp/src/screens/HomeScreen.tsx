import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import {
  Box,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Badge,
  Heading,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
} from '@razorpay/blade/components';
import {
  UploadCloudIcon,
  CameraIcon,
  MessageCircleIcon,
  WifiOffIcon,
  TrendingUpIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
} from '@razorpay/blade/components';

import { useFiles, useMessages, useUser, useNetworkStatus, useLoading } from '../store';
import { getFiles } from '../services/api';
import { formatDate, formatFileSize, getFileType } from '../utils/helpers';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../types';

type HomeScreenProps = BottomTabScreenProps<BottomTabParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const files = useFiles();
  const messages = useMessages();
  const user = useUser();
  const networkStatus = useNetworkStatus();
  const isLoading = useLoading();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    imageCount: 0,
    documentCount: 0,
    videoCount: 0,
    messageCount: 0,
  });

  // Calculate statistics
  useEffect(() => {
    const imageCount = files.filter(f => getFileType(f.type) === 'image').length;
    const documentCount = files.filter(f => getFileType(f.type) === 'document').length;
    const videoCount = files.filter(f => getFileType(f.type) === 'video').length;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    setStats({
      totalFiles: files.length,
      totalSize,
      imageCount,
      documentCount,
      videoCount,
      messageCount: messages.length,
    });
  }, [files, messages]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh data here
      await getFiles();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const navigateToScreen = (screen: keyof BottomTabParamList) => {
    navigation.navigate(screen);
  };

  const renderNetworkStatus = () => {
    if (networkStatus === 'offline') {
      return (
        <Alert color="negative" marginBottom="spacing.5">
          <AlertIcon icon={WifiOffIcon} />
          <AlertDescription>
            You're currently offline. Some features may not be available.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: React.ComponentType<any>,
    color: 'primary' | 'positive' | 'information' | 'notice' = 'primary'
  ) => (
    <Card marginBottom="spacing.4">
      <CardBody padding="spacing.4">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Text size="small" color="surface.text.gray.muted" marginBottom="spacing.1">
              {title}
            </Text>
            <Text size="large" weight="semibold" color="surface.text.gray.normal">
              {value}
            </Text>
          </Box>
          <Box
            backgroundColor={`surface.background.${color}.subtle`}
            padding="spacing.3"
            borderRadius="medium"
          >
            {React.createElement(icon, { 
              color: `interactive.icon.${color}.default`,
              size: 'medium' 
            })}
          </Box>
        </Box>
      </CardBody>
    </Card>
  );

  const renderQuickActions = () => (
    <Card marginBottom="spacing.6">
      <CardHeader>
        <Heading size="medium">Quick Actions</Heading>
      </CardHeader>
      <CardBody>
        <Box flexDirection="row" justifyContent="space-between">
          <Button
            variant="secondary"
            size="medium"
            icon={UploadCloudIcon}
            iconPosition="left"
            onPress={() => navigateToScreen('Upload')}
            marginRight="spacing.2"
            flex={1}
          >
            Upload Files
          </Button>
          <Button
            variant="secondary"
            size="medium"
            icon={CameraIcon}
            iconPosition="left"
            onPress={() => navigateToScreen('Camera')}
            marginHorizontal="spacing.2"
            flex={1}
          >
            Camera
          </Button>
          <Button
            variant="secondary"
            size="medium"
            icon={MessageCircleIcon}
            iconPosition="left"
            onPress={() => navigateToScreen('Chat')}
            marginLeft="spacing.2"
            flex={1}
          >
            AI Chat
          </Button>
        </Box>
      </CardBody>
    </Card>
  );

  const renderRecentActivity = () => {
    const recentFiles = files.slice(-3).reverse();
    const recentMessages = messages.slice(-3).reverse();

    if (recentFiles.length === 0 && recentMessages.length === 0) {
      return (
        <Card marginBottom="spacing.6">
          <CardHeader>
            <Heading size="medium">Recent Activity</Heading>
          </CardHeader>
          <CardBody>
            <Box alignItems="center" padding="spacing.6">
              <Text color="surface.text.gray.muted" textAlign="center">
                No recent activity. Start by uploading files or chatting with AI!
              </Text>
            </Box>
          </CardBody>
        </Card>
      );
    }

    return (
      <Card marginBottom="spacing.6">
        <CardHeader>
          <Heading size="medium">Recent Activity</Heading>
        </CardHeader>
        <CardBody>
          {recentFiles.map((file, index) => (
            <Box key={`file-${file.id}`}>
              <Box flexDirection="row" alignItems="center" paddingY="spacing.3">
                <Box marginRight="spacing.3">
                  {getFileType(file.type) === 'image' && <ImageIcon size="medium" />}
                  {getFileType(file.type) === 'document' && <FileTextIcon size="medium" />}
                  {getFileType(file.type) === 'video' && <VideoIcon size="medium" />}
                </Box>
                <Box flex={1}>
                  <Text weight="medium" marginBottom="spacing.1">
                    {file.name}
                  </Text>
                  <Text size="small" color="surface.text.gray.muted">
                    Uploaded {formatDate(file.createdAt)} • {formatFileSize(file.size)}
                  </Text>
                </Box>
                <Badge color="positive" size="small">
                  File
                </Badge>
              </Box>
              {index < recentFiles.length - 1 && <Divider marginY="spacing.2" />}
            </Box>
          ))}
          
          {recentMessages.map((message, index) => (
            <Box key={`message-${message.id}`}>
              {recentFiles.length > 0 && index === 0 && <Divider marginY="spacing.2" />}
              <Box flexDirection="row" alignItems="center" paddingY="spacing.3">
                <Box marginRight="spacing.3">
                  <MessageCircleIcon size="medium" />
                </Box>
                <Box flex={1}>
                  <Text weight="medium" marginBottom="spacing.1">
                    {message.isUser ? 'You' : 'AI Assistant'}
                  </Text>
                  <Text size="small" color="surface.text.gray.muted" numberOfLines={2}>
                    {message.text.substring(0, 80)}...
                  </Text>
                  <Text size="small" color="surface.text.gray.muted">
                    {formatDate(message.timestamp)}
                  </Text>
                </Box>
                <Badge color="information" size="small">
                  Chat
                </Badge>
              </Box>
              {index < recentMessages.length - 1 && <Divider marginY="spacing.2" />}
            </Box>
          ))}
        </CardBody>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
        <Text marginTop="spacing.4">Loading...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="surface.background.gray.intense">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderNetworkStatus()}
        
        {/* Welcome Section */}
        <Box marginBottom="spacing.6">
          <Heading size="large" marginBottom="spacing.2">
            Welcome back, {user.name}! 👋
          </Heading>
          <Text color="surface.text.gray.muted">
            Here's what's happening with your AI-powered workspace
          </Text>
        </Box>

        {/* Statistics */}
        <Box marginBottom="spacing.6">
          <Heading size="medium" marginBottom="spacing.4">
            Overview
          </Heading>
          <Box flexDirection="row" marginBottom="spacing.4">
            <Box flex={1} marginRight="spacing.2">
              {renderStatCard('Total Files', stats.totalFiles, TrendingUpIcon, 'primary')}
            </Box>
            <Box flex={1} marginLeft="spacing.2">
              {renderStatCard('Storage Used', formatFileSize(stats.totalSize), TrendingUpIcon, 'information')}
            </Box>
          </Box>
          <Box flexDirection="row">
            <Box flex={1} marginRight="spacing.2">
              {renderStatCard('Images', stats.imageCount, ImageIcon, 'positive')}
            </Box>
            <Box flex={1} marginHorizontal="spacing.2">
              {renderStatCard('Documents', stats.documentCount, FileTextIcon, 'notice')}
            </Box>
            <Box flex={1} marginLeft="spacing.2">
              {renderStatCard('Messages', stats.messageCount, MessageCircleIcon, 'information')}
            </Box>
          </Box>
        </Box>

        {renderQuickActions()}
        {renderRecentActivity()}
        
        {/* App Info */}
        <Box marginTop="spacing.4" paddingY="spacing.4">
          <Text size="small" color="surface.text.gray.muted" textAlign="center">
            Thuli AI/CV Hackathon App v1.0.0
          </Text>
          <Text size="small" color="surface.text.gray.muted" textAlign="center">
            Powered by Razorpay Blade Design System
          </Text>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default HomeScreen;



