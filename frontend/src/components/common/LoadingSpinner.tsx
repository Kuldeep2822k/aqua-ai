import React from 'react';
import { Box, Typography } from '@mui/material';
import { WaterDrop } from '@mui/icons-material';
import { LoadingSpinnerProps } from '../../types/components';

// Custom loading animations using CSS-in-JS
const spinAnimation = {
  '@keyframes spin': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
};

const pulseAnimation = {
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '50%': {
      opacity: 0.5,
      transform: 'scale(0.95)',
    },
  },
};

const rippleAnimation = {
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(0)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(4)',
      opacity: 0,
    },
  },
};

export default function LoadingSpinner({
  size = 'medium',
  text = 'Loading...',
  overlay = false,
  className,
  style
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: 32,
    medium: 50,
    large: 72,
  };

  const spinnerSize = sizeMap[size];

  const spinner = (
    <Box
      className={className}
      style={style}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 3,
        position: 'relative',
        ...(overlay && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
        }),
      }}
    >
      {/* Modern Spinner */}
      <Box
        sx={{
          position: 'relative',
          width: spinnerSize,
          height: spinnerSize,
        }}
      >
        {/* Outer Ring */}
        <Box
          sx={{
            ...spinAnimation,
            position: 'absolute',
            width: spinnerSize,
            height: spinnerSize,
            border: '3px solid rgba(0, 168, 232, 0.2)',
            borderRadius: '50%',
            borderTop: '3px solid #00A8E8',
            animation: 'spin 1.5s linear infinite',
          }}
        />

        {/* Inner Ring */}
        <Box
          sx={{
            ...spinAnimation,
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: spinnerSize * 0.6,
            height: spinnerSize * 0.6,
            transform: 'translate(-50%, -50%)',
            border: '2px solid rgba(0, 102, 204, 0.3)',
            borderRadius: '50%',
            borderBottom: '2px solid #0066cc',
            animation: 'spin 1s linear infinite reverse',
          }}
        />

        {/* Center Icon */}
        <Box
          sx={{
            ...pulseAnimation,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <WaterDrop
            sx={{
              fontSize: spinnerSize * 0.4,
              color: overlay ? '#ffffff' : '#0066cc',
              filter: `drop-shadow(0 0 8px rgba(${overlay ? '255, 255, 255' : '0, 102, 204'}, 0.3))`,
            }}
          />
        </Box>

        {/* Ripple Effect */}
        <Box
          sx={{
            ...rippleAnimation,
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 6,
            height: 6,
            background: overlay ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 168, 232, 0.6)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 3s ease-out infinite',
          }}
        />
      </Box>

      {text && (
        <Typography
          variant={size === 'small' ? 'body2' : 'body1'}
          sx={{
            ...pulseAnimation,
            color: overlay ? 'white' : 'text.primary',
            fontWeight: 500,
            letterSpacing: '0.5px',
            animation: 'pulse 2s ease-in-out infinite',
            textAlign: 'center',
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  return spinner;
}
