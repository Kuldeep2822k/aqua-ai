import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon,
  Notifications as AlertsIcon,
  People as CommunityIcon,
  Science as ResearchIcon,
  Nature as SustainabilityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarProps } from '../../types/components';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', path: '/', icon: DashboardIcon },
  { text: 'Interactive Map', path: '/map', icon: MapIcon },
  { text: 'Analytics', path: '/analytics', icon: AnalyticsIcon },
  { text: 'Alerts', path: '/alerts', icon: AlertsIcon },
  { text: 'Community', path: '/community', icon: CommunityIcon },
  { text: 'Research', path: '/research', icon: ResearchIcon },
  { text: 'Sustainability', path: '/sustainability', icon: SustainabilityIcon },
  { text: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function Sidebar({ open, onClose, variant = 'temporary' }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleMenuItemClick(item.path)}
              >
                <ListItemIcon>
                  <Icon color={isSelected ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
}
