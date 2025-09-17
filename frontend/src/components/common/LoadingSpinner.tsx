import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LoadingSpinnerProps } from '../../types/components';

export default function LoadingSpinner({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false,
  className,
  style 
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinner = (
    <Box
      className={className}
      style={style}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        ...(overlay && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
        }),
      }}
    >
      <CircularProgress size={sizeMap[size]} />
      {text && (
        <Typography 
          variant={size === 'small' ? 'body2' : 'body1'} 
          color={overlay ? 'white' : 'textSecondary'}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  return spinner;
}
