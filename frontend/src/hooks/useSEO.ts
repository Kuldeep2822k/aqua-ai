import React from 'react';
import { useLocation } from 'react-router-dom';
import { seoConfig, generateBreadcrumbSchema, type PageSEOConfig } from '../components/SEO/seoConfig';

interface SEOData extends PageSEOConfig {
  breadcrumbSchema: object;
  fullUrl: string;
  fullImage: string;
}

export const useSEO = (customConfig?: Partial<PageSEOConfig>): SEOData => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Determine page key from pathname
  const getPageKey = (path: string): string => {
    if (path === '/') return 'home';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/map') return 'map';
    if (path === '/analytics') return 'analytics';
    if (path === '/alerts') return 'alerts';
    if (path === '/community') return 'community';
    if (path === '/research') return 'research';
    if (path === '/sustainability') return 'sustainability';
    if (path === '/settings') return 'settings';
    
    // Default for unknown routes
    return 'home';
  };
  
  const pageKey = getPageKey(pathname);
  const defaultConfig = seoConfig[pageKey] || seoConfig.home;
  
  // Merge default config with custom overrides
  const finalConfig = {
    ...defaultConfig,
    ...customConfig
  };
  
  // Generate full URLs
  const baseUrl = 'https://aqua-9ddsff2nt-nicejob.vercel.app';
  const fullUrl = `${baseUrl}${finalConfig.url}`;
  const fullImage = finalConfig.image 
    ? (finalConfig.image.startsWith('http') 
        ? finalConfig.image 
        : `${baseUrl}${finalConfig.image}`)
    : `${baseUrl}/logo512.png`;
  
  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema(pathname);
  
  return {
    ...finalConfig,
    breadcrumbSchema,
    fullUrl,
    fullImage
  };
};

// Hook for tracking page views and SEO analytics
export const useSEOAnalytics = () => {
  const location = useLocation();
  
  React.useEffect(() => {
    // Track page view for SEO analytics
    const trackPageView = () => {
      // Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: location.pathname
        });
      }
      
      // Update last modified time in meta
      const lastModified = new Date().toISOString();
      let metaModified = document.querySelector('meta[property="article:modified_time"]');
      if (!metaModified) {
        metaModified = document.createElement('meta');
        metaModified.setAttribute('property', 'article:modified_time');
        document.head.appendChild(metaModified);
      }
      metaModified.setAttribute('content', lastModified);
    };
    
    // Debounce page view tracking
    const timeoutId = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
};

// Generate dynamic keywords based on content
export const generateDynamicKeywords = (content: string[], basekeywords: string): string => {
  const commonKeywords = [
    'water quality',
    'India',
    'AI',
    'monitoring',
    'environmental',
    'pollution',
    'CPCB',
    'government data',
    'real-time'
  ];
  
  const contentKeywords = content.map(item => 
    item.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  ).filter(item => item.length > 2);
  
  const allKeywords = [
    ...basekeywords.split(',').map(k => k.trim()),
    ...commonKeywords,
    ...contentKeywords
  ];
  
  // Remove duplicates and limit to 20 keywords
  const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 20);
  
  return uniqueKeywords.join(', ');
};

export default useSEO;