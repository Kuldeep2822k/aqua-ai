import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../../services/waterQualityApi';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  Dashboard,
  WaterDrop,
  Search as SearchIcon,
} from '@mui/icons-material';
import { NavbarProps } from '../../types/components';

export default function Navbar({
  onSidebarToggle,
  title = 'Aqua-AI',
}: NavbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Fetch active alerts count from API
  const { data: alertStats } = useQuery({
    queryKey: ['alerts-stats-navbar'],
    queryFn: async () => alertsApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const notificationCount = alertStats?.data?.active_alerts || 0;

  // Handle scroll effect for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: scrolled
          ? 'linear-gradient(135deg, rgba(0, 102, 204, 0.95) 0%, rgba(0, 168, 232, 0.95) 100%)'
          : 'linear-gradient(135deg, #0066cc 0%, #00A8E8 100%)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        boxShadow: scrolled
          ? '0 8px 32px rgba(0, 0, 0, 0.1)'
          : '0 4px 16px rgba(0, 102, 204, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onSidebarToggle}
          edge="start"
          sx={{
            mr: 2,
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
          <WaterDrop
            sx={{
              mr: 1,
              fontSize: 28,
              color: '#ffffff',
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
            }}
          />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#ffffff',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            {title}
          </Typography>
          <Chip
            label="Beta"
            size="small"
            sx={{
              ml: 1,
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Status Indicator */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            mr: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              mr: 1,
              animation: 'glow-pulse 2s ease-in-out infinite alternate',
              boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)',
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            System Online
          </Typography>
        </Box>

        {/* Action Icons */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          {/* Search Icon */}
          <Tooltip title="Search">
            <IconButton
              color="inherit"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                padding: { xs: 1, sm: 1.5 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              sx={{
                padding: { xs: 1, sm: 1.5 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Badge
                badgeContent={notificationCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    animation:
                      notificationCount > 0
                        ? 'glow-pulse 2s ease-in-out infinite alternate'
                        : 'none',
                    boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)',
                  },
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title="Profile">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls={
                isMenuOpen ? 'primary-search-account-menu' : undefined
              }
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{
                padding: { xs: 1, sm: 1.5 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 0 12px rgba(255, 255, 255, 0.2)',
                }}
              >
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          id="primary-search-account-menu"
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isMenuOpen}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              mt: 1,
            },
          }}
        >
          <MenuItem onClick={handleMenuClose} sx={{ gap: 2 }}>
            <Dashboard fontSize="small" />
            <Typography>Dashboard</Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ gap: 2 }}>
            <Settings fontSize="small" />
            <Typography>Settings</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose} sx={{ gap: 2 }}>
            <Logout fontSize="small" />
            <Typography>Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
