import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// We'll handle lazy loading through hooks instead

interface MapWrapperProps {
  children: React.ReactNode;
  height?: number | string;
  fallbackText?: string;
}

const MapLoadingSpinner: React.FC<{ height?: number | string; text?: string }> = ({ 
  height = 400, 
  text = "Loading map..." 
}) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    height={height}
    sx={{ 
      bgcolor: 'grey.50',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'grey.200',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <CircularProgress size={48} sx={{ mb: 2 }} />
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
      Preparing interactive map components...
    </Typography>
  </Box>
);

export const LazyMap: React.FC<MapWrapperProps> = ({ 
  children, 
  height = 400,
  fallbackText = "Loading map components..."
}) => {
  return (
    <Suspense fallback={<MapLoadingSpinner height={height} text={fallbackText} />}>
      {children}
    </Suspense>
  );
};

// Hook for accessing leaflet components with dynamic loading
export const useLeafletComponents = () => {
  const [components, setComponents] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Load both leaflet and react-leaflet
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ])
      .then(([leaflet, reactLeaflet]) => {
        // Fix for default markers
        try {
          delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
          leaflet.default.Icon.Default.mergeOptions({
            iconRetinaUrl: '/static/media/marker-icon-2x.png',
            iconUrl: '/static/media/marker-icon.png',
            shadowUrl: '/static/media/marker-shadow.png',
          });
        } catch (err) {
          console.warn('Could not set leaflet marker icons:', err);
        }

        setComponents({
          L: leaflet.default,
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          Marker: reactLeaflet.Marker,
          Popup: reactLeaflet.Popup,
          Circle: reactLeaflet.Circle,
          CircleMarker: reactLeaflet.CircleMarker,
          Polygon: reactLeaflet.Polygon,
          Polyline: reactLeaflet.Polyline,
          Rectangle: reactLeaflet.Rectangle,
          LayerGroup: reactLeaflet.LayerGroup,
          FeatureGroup: reactLeaflet.FeatureGroup,
          Pane: reactLeaflet.Pane,
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { components, loading, error };
};

// Hook for loading heavy map features (heatmaps, clustering) conditionally
export const useHeavyMapFeatures = () => {
  const [features, setFeatures] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Only load heavy features when specifically requested
    Promise.all([
      import('leaflet.heat' as any),
      import('leaflet.markercluster' as any)
    ])
      .then(([heat, cluster]) => {
        setFeatures({
          heat: heat?.default || heat,
          cluster: cluster?.default || cluster
        });
        setLoading(false);
      })
      .catch(err => {
        console.warn('Heavy map features not available:', err);
        setFeatures(null);
        setLoading(false);
      });
  }, []);

  return { features, loading, error };
};

// Function to preload map assets
export const preloadMapAssets = () => {
  // Preload leaflet CSS if not already loaded
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  // Preload common map images
  const imagesToPreload = [
    '/static/media/marker-icon.png',
    '/static/media/marker-icon-2x.png',
    '/static/media/marker-shadow.png'
  ];

  imagesToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onerror = () => {
      console.warn(`Failed to preload map image: ${src}`);
    };
  });
};

export default LazyMap;