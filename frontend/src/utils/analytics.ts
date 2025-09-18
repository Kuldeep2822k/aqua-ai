// Google Analytics 4 integration for SEO tracking

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;

  // Create script element for Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
    anonymize_ip: true, // GDPR compliance
    allow_google_signals: false, // Enhanced measurement control
    allow_ad_personalization_signals: false
  });

  console.log('Google Analytics initialized');
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href
  });
};

// Track custom events for SEO insights
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    custom_parameter_1: 'aqua_ai_platform'
  });
};

// Track user interactions for SEO data
export const trackUserInteraction = (interaction: string, element: string, page: string) => {
  trackEvent(interaction, 'user_interaction', `${element}_on_${page}`);
};

// Track search queries (internal search)
export const trackInternalSearch = (query: string, results_count?: number) => {
  trackEvent('search', 'internal_search', query, results_count);
};

// Track water quality data interactions
export const trackWaterQualityInteraction = (action: string, location?: string) => {
  trackEvent(action, 'water_quality', location);
};

// Track map interactions for location-based SEO
export const trackMapInteraction = (action: string, region?: string) => {
  trackEvent(action, 'map_interaction', region);
};

// Track alert interactions
export const trackAlertInteraction = (action: string, alert_type?: string) => {
  trackEvent(action, 'alerts', alert_type);
};

// Track community features
export const trackCommunityInteraction = (action: string, feature?: string) => {
  trackEvent(action, 'community', feature);
};

// Track performance metrics for Core Web Vitals (SEO factor)
export const trackWebVitals = (metric: { name: string; value: number; rating: string }) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.rating,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true
  });
};

// Track error events for SEO monitoring
export const trackError = (error: string, page: string, fatal: boolean = false) => {
  trackEvent('exception', 'javascript_error', `${error}_on_${page}`, fatal ? 1 : 0);
};

// Track download events (export functionality)
export const trackDownload = (file_type: string, file_name?: string) => {
  trackEvent('download', 'data_export', `${file_type}_${file_name || 'unknown'}`);
};

// Track outbound links for SEO link analysis
export const trackOutboundLink = (url: string, link_text?: string) => {
  trackEvent('click', 'outbound_link', `${url}_${link_text || 'unknown'}`);
};

// Enhanced ecommerce tracking (for future premium features)
export const trackEngagement = (engagement_time_seconds: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'engagement_time', {
    value: engagement_time_seconds
  });
};

// Track scroll depth for content engagement (SEO signal)
export const trackScrollDepth = (percentage: number, page: string) => {
  const thresholds = [25, 50, 75, 100];
  const threshold = thresholds.find(t => percentage >= t && percentage < t + 25);
  
  if (threshold) {
    trackEvent('scroll', 'page_engagement', `${threshold}%_${page}`, percentage);
  }
};

// Initialize scroll tracking
export const initScrollTracking = () => {
  if (typeof window === 'undefined') return;

  let maxScroll = 0;
  const page = window.location.pathname;

  const handleScroll = () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent;
      if ([25, 50, 75, 100].includes(scrollPercent)) {
        trackScrollDepth(scrollPercent, page);
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Cleanup function
  return () => window.removeEventListener('scroll', handleScroll);
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackUserInteraction,
  trackInternalSearch,
  trackWaterQualityInteraction,
  trackMapInteraction,
  trackAlertInteraction,
  trackCommunityInteraction,
  trackWebVitals,
  trackError,
  trackDownload,
  trackOutboundLink,
  trackEngagement,
  trackScrollDepth,
  initScrollTracking
};