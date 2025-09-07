import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@shopify/restyle';
import { 
  HomeIcon,
  UploadCloudIcon,
  CameraIcon,
  MessageCircleIcon
} from '@razorpay/blade/components';

import HomeScreen from '../screens/HomeScreen';
import UploadScreen from '../screens/UploadScreen';
import CameraScreen from '../screens/CameraScreen';
import ChatScreen from '../screens/ChatScreen';
import { BottomTabParamList } from '../types';
import { SCREEN_NAMES } from '../utils/constants';
import { useUIActions } from '../store';

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Icon components moved outside of render
const HomeTabIcon = ({ color, size }: { color: string; size: number }) => (
  <HomeIcon color={color} size={size} />
);

const UploadTabIcon = ({ color, size }: { color: string; size: number }) => (
  <UploadCloudIcon color={color} size={size} />
);

const CameraTabIcon = ({ color, size }: { color: string; size: number }) => (
  <CameraIcon color={color} size={size} />
);

const ChatTabIcon = ({ color, size }: { color: string; size: number }) => (
  <MessageCircleIcon color={color} size={size} />
);

const AppNavigator: React.FC = () => {
  const theme = useTheme();
  const { setActiveScreen } = useUIActions();

  const handleTabPress = (routeName: string) => {
    setActiveScreen(routeName);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.background.gray.subtle,
          borderTopWidth: 1,
          borderTopColor: theme.colors.surface.border.gray.muted,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: theme.colors.interactive.icon.primary.default,
        tabBarInactiveTintColor: theme.colors.interactive.icon.gray.default,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          const routeName = e.target?.split('-')[0] || '';
          handleTabPress(routeName);
        },
      }}
    >
      <Tab.Screen
        name={SCREEN_NAMES.HOME}
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.UPLOAD}
        component={UploadScreen}
        options={{
          title: 'Upload',
          tabBarIcon: UploadTabIcon,
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.CAMERA}
        component={CameraScreen}
        options={{
          title: 'Camera',
          tabBarIcon: CameraTabIcon,
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.CHAT}
        component={ChatScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ChatTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
