const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Optimize bundle splitting for production
      if (env === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // Vendor chunk for React and core libraries
              vendor: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|@mui|@emotion)[\\/]/,
                name: 'vendor',
                chunks: 'all',
                priority: 20,
              },
              // Leaflet and map-related libraries
              maps: {
                test: /[\\/]node_modules[\\/](leaflet|react-leaflet|maplibre-gl|react-map-gl)[\\/]/,
                name: 'maps',
                chunks: 'all',
                priority: 15,
              },
              // Chart libraries
              charts: {
                test: /[\\/]node_modules[\\/](echarts|recharts|echarts-for-react)[\\/]/,
                name: 'charts',
                chunks: 'all',
                priority: 15,
              },
              // Utilities and smaller libraries
              utils: {
                test: /[\\/]node_modules[\\/]/,
                name: 'utils',
                chunks: 'all',
                minChunks: 2,
                priority: 10,
                enforce: true,
              },
              // Default chunk for common code
              default: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
              },
            },
          },
          // Minimize chunking overhead
          runtimeChunk: {
            name: 'runtime',
          },
        };

        // Add performance optimizations
        webpackConfig.performance = {
          ...webpackConfig.performance,
          maxAssetSize: 3000000, // 3MB
          maxEntrypointSize: 3000000, // 3MB
          hints: false, // Disable hints to prevent CI build failures
        };
      }

      // Add resolve alias for cleaner imports
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
      };

      return webpackConfig;
    },
  },
  babel: {
    plugins: [
      // Add babel plugins for better tree shaking and optimization
      [
        'import',
        {
          libraryName: '@mui/material',
          libraryDirectory: '',
          camel2DashComponentName: false,
        },
        'core',
      ],
      [
        'import',
        {
          libraryName: '@mui/icons-material',
          libraryDirectory: '',
          camel2DashComponentName: false,
        },
        'icons',
      ],
      [
        'import',
        {
          libraryName: '@mui/x-data-grid',
          libraryDirectory: '',
          camel2DashComponentName: false,
        },
        'data-grid',
      ],
      [
        'import',
        {
          libraryName: '@mui/x-date-pickers',
          libraryDirectory: '',
          camel2DashComponentName: false,
        },
        'date-pickers',
      ],
    ],
  },
  devServer: {
    // Enable compression for development
    compress: true,
    // Enable caching for better performance
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  jest: {
    configure: {
      transformIgnorePatterns: [
        'node_modules/(?!(axios|leaflet|react-leaflet|@react-leaflet)/)',
      ],
      moduleNameMapper: {
        '^axios$': require.resolve('axios'),
      },
    },
  },
};
