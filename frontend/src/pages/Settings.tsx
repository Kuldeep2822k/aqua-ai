import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Box,
  Switch,
  FormControlLabel,
  Button,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  Security,
  Palette,
} from '@mui/icons-material';

import { useThemeContext } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { mode, toggleColorMode } = useThemeContext();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings & Preferences
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Notifications sx={{ mr: 1 }} />
                <Typography variant="h6">Notifications</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Email alerts for critical water quality issues"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Daily summary reports"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Weekly analytics digest"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Palette sx={{ mr: 1 }} />
                <Typography variant="h6">Display</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'dark'}
                      onChange={toggleColorMode}
                    />
                  }
                  label="Dark mode"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="High contrast mode"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Show data tooltips"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Security</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" fullWidth>
                  Change Password
                </Button>
                <Button variant="outlined" fullWidth>
                  Enable Two-Factor Authentication
                </Button>
                <Button variant="outlined" fullWidth>
                  Download Account Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">General</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Auto-refresh data"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Remember map position"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Show beta features"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Management
            </Typography>
            <Typography color="textSecondary" paragraph>
              Manage your data preferences and export options. You can control
              what data is collected, how long it's stored, and export your
              personal data at any time.
            </Typography>
            <Button variant="contained" sx={{ mr: 2 }}>
              Save Settings
            </Button>
            <Button variant="outlined">Reset to Defaults</Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings;
