import React from 'react';
import {
  Box,
  Spinner,
  Text,
  Button,
} from '@razorpay/blade/components';
import { XIcon } from '@razorpay/blade/components';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  showCancel = false,
  onCancel,
  size = 'large',
  color = 'primary',
}) => {
  if (!visible) return null;

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.5)"
      justifyContent="center"
      alignItems="center"
      zIndex={1000}
    >
      <Box
        backgroundColor="surface.background.gray.intense"
        borderRadius="large"
        padding="spacing.6"
        alignItems="center"
        minWidth="200px"
      >
        <Spinner size={size} color={`surface.text.${color}.default`} />
        <Text
          marginTop="spacing.4"
          textAlign="center"
          color={`surface.text.${color}.normal`}
          weight="medium"
        >
          {message}
        </Text>
        
        {showCancel && onCancel && (
          <Button
            variant="tertiary"
            size="medium"
            icon={XIcon}
            onPress={onCancel}
            marginTop="spacing.4"
          >
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LoadingOverlay;



