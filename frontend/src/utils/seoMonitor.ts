// SEO monitoring and testing utilities

export interface SEOMetrics {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  keywords: string;
  keywordCount: number;
  hasCanonical: boolean;
  hasStructuredData: boolean;
  hasOpenGraph: boolean;
  hasTwitterCards: boolean;
  hasRobotsMeta: boolean;
  imageOptimization: {
    hasAlt: boolean;
    count: number;
    missingAlt: number;
  };
  linkAnalysis: {
    internal: number;
    external: number;
    nofollow: number;
  };
  performance: {
    loadTime: number;
    domReady: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
  mobileOptimization: {
    hasViewport: boolean;
    isResponsive: boolean;
  };
  accessibility: {
    hasLang: boolean;
    headingStructure: boolean;
    skipNavigation: boolean;
  };
}

// Check if current page meets SEO best practices
export const analyzeSEO = (): SEOMetrics => {
  const title = document.title || '';
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
  const canonical = document.querySelector('link[rel="canonical"]');
  const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  const robotsMeta = document.querySelector('meta[name="robots"]');
  const viewport = document.querySelector('meta[name="viewport"]');
  const htmlLang = document.documentElement.getAttribute('lang');

  // Analyze images
  const images = document.querySelectorAll('img');
  let missingAlt = 0;
  images.forEach(img => {
    if (!img.getAttribute('alt')) missingAlt++;
  });

  // Analyze links
  const links = document.querySelectorAll('a[href]');
  let internalLinks = 0;
  let externalLinks = 0;
  let nofollowLinks = 0;
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    const rel = link.getAttribute('rel');
    
    if (href?.startsWith('http') && !href.includes(window.location.hostname)) {
      externalLinks++;
    } else if (href?.startsWith('/') || href?.startsWith('#')) {
      internalLinks++;
    }
    
    if (rel?.includes('nofollow')) {
      nofollowLinks++;
    }
  });

  // Check heading structure
  const h1Count = document.querySelectorAll('h1').length;
  const hasProperHeadings = h1Count === 1;

  // Performance metrics
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const loadTime = navigation ? (navigation.loadEventEnd - navigation.startTime) : 0;
  const domReady = navigation ? (navigation.domContentLoadedEventEnd - navigation.startTime) : 0;

  return {
    title,
    titleLength: title.length,
    description: metaDescription,
    descriptionLength: metaDescription.length,
    keywords: metaKeywords,
    keywordCount: metaKeywords.split(',').filter(k => k.trim()).length,
    hasCanonical: !!canonical,
    hasStructuredData: structuredData.length > 0,
    hasOpenGraph: !!ogTitle,
    hasTwitterCards: !!twitterCard,
    hasRobotsMeta: !!robotsMeta,
    imageOptimization: {
      hasAlt: missingAlt === 0,
      count: images.length,
      missingAlt
    },
    linkAnalysis: {
      internal: internalLinks,
      external: externalLinks,
      nofollow: nofollowLinks
    },
    performance: {
      loadTime: Math.round(loadTime),
      domReady: Math.round(domReady)
    },
    mobileOptimization: {
      hasViewport: !!viewport,
      isResponsive: window.innerWidth <= 768 // Basic check
    },
    accessibility: {
      hasLang: !!htmlLang,
      headingStructure: hasProperHeadings,
      skipNavigation: !!document.querySelector('a[href="#main"], a[href="#content"]')
    }
  };
};

// Generate SEO report
export const generateSEOReport = (): { score: number; issues: string[]; recommendations: string[] } => {
  const metrics = analyzeSEO();
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Title analysis
  if (!metrics.title) {
    score -= 20;
    issues.push('Missing page title');
    recommendations.push('Add a descriptive page title');
  } else if (metrics.titleLength < 30 || metrics.titleLength > 60) {
    score -= 10;
    issues.push('Title length not optimal (30-60 characters recommended)');
    recommendations.push('Optimize title length to 30-60 characters');
  }

  // Description analysis
  if (!metrics.description) {
    score -= 15;
    issues.push('Missing meta description');
    recommendations.push('Add a compelling meta description');
  } else if (metrics.descriptionLength < 120 || metrics.descriptionLength > 160) {
    score -= 8;
    issues.push('Meta description length not optimal (120-160 characters recommended)');
    recommendations.push('Optimize meta description length to 120-160 characters');
  }

  // Technical SEO checks
  if (!metrics.hasCanonical) {
    score -= 10;
    issues.push('Missing canonical URL');
    recommendations.push('Add canonical link tag');
  }

  if (!metrics.hasStructuredData) {
    score -= 15;
    issues.push('No structured data found');
    recommendations.push('Add JSON-LD structured data');
  }

  if (!metrics.hasOpenGraph) {
    score -= 10;
    issues.push('Missing Open Graph tags');
    recommendations.push('Add Open Graph meta tags for social media');
  }

  if (!metrics.hasTwitterCards) {
    score -= 5;
    issues.push('Missing Twitter Card tags');
    recommendations.push('Add Twitter Card meta tags');
  }

  // Image optimization
  if (metrics.imageOptimization.missingAlt > 0) {
    score -= 8;
    issues.push(`${metrics.imageOptimization.missingAlt} images missing alt text`);
    recommendations.push('Add descriptive alt text to all images');
  }

  // Mobile optimization
  if (!metrics.mobileOptimization.hasViewport) {
    score -= 15;
    issues.push('Missing viewport meta tag');
    recommendations.push('Add viewport meta tag for mobile optimization');
  }

  // Accessibility
  if (!metrics.accessibility.hasLang) {
    score -= 5;
    issues.push('Missing lang attribute on html element');
    recommendations.push('Add lang="en" to html element');
  }

  if (!metrics.accessibility.headingStructure) {
    score -= 8;
    issues.push('Improper heading structure');
    recommendations.push('Use exactly one H1 tag per page');
  }

  // Performance
  if (metrics.performance.loadTime > 3000) {
    score -= 10;
    issues.push('Slow page load time');
    recommendations.push('Optimize page load speed (target < 3 seconds)');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};

// Monitor Core Web Vitals for SEO
export const monitorWebVitals = (callback?: (metric: any) => void) => {
  if (typeof window === 'undefined') return;

  // LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        const metric = {
          name: 'LCP',
          value: lastEntry.startTime,
          rating: lastEntry.startTime > 4000 ? 'poor' : lastEntry.startTime > 2500 ? 'needs-improvement' : 'good'
        };
        
        callback?.(metric);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP monitoring not supported');
    }
  }

  // CLS (Cumulative Layout Shift) - simplified version
  let clsValue = 0;
  const sessionEntries: any[] = [];
  
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            sessionEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
        
        const metric = {
          name: 'CLS',
          value: clsValue,
          rating: clsValue > 0.25 ? 'poor' : clsValue > 0.1 ? 'needs-improvement' : 'good'
        };
        
        callback?.(metric);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS monitoring not supported');
    }
  }

  // FID (First Input Delay) - simplified
  let fidValue: number | null = null;
  
  const measureFID = (event: Event) => {
    fidValue = performance.now() - event.timeStamp;
    
    const metric = {
      name: 'FID',
      value: fidValue,
      rating: fidValue > 300 ? 'poor' : fidValue > 100 ? 'needs-improvement' : 'good'
    };
    
    callback?.(metric);
    
    // Remove listener after first interaction
    ['click', 'keydown'].forEach(type => {
      document.removeEventListener(type, measureFID, true);
    });
  };
  
  ['click', 'keydown'].forEach(type => {
    document.addEventListener(type, measureFID, true);
  });
};

// Test if page is indexable
export const testIndexability = (): { indexable: boolean; issues: string[] } => {
  const issues: string[] = [];
  let indexable = true;

  // Check robots meta
  const robotsMeta = document.querySelector('meta[name="robots"]');
  const robotsContent = robotsMeta?.getAttribute('content')?.toLowerCase() || '';
  
  if (robotsContent.includes('noindex')) {
    indexable = false;
    issues.push('Page has noindex directive');
  }

  // Check canonical
  const canonical = document.querySelector('link[rel="canonical"]');
  const currentUrl = window.location.href.split('?')[0].split('#')[0];
  const canonicalUrl = canonical?.getAttribute('href');
  
  if (canonicalUrl && canonicalUrl !== currentUrl && !canonicalUrl.startsWith(currentUrl)) {
    issues.push('Canonical URL points to different page');
  }

  // Check if page returns 200 status (would need server-side check in real implementation)
  // For client-side, we assume if we can run this code, the page loaded successfully

  return { indexable, issues };
};

// Generate sitemap data for current page
export const generatePageSitemapData = () => {
  const lastModified = document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ||
                     document.querySelector('meta[name="last-modified"]')?.getAttribute('content') ||
                     new Date().toISOString();
                     
  const priority = window.location.pathname === '/' ? '1.0' : '0.8';
  const changefreq = window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/alerts') ? 'hourly' : 'daily';

  return {
    loc: window.location.href,
    lastmod: lastModified,
    changefreq,
    priority
  };
};

export default {
  analyzeSEO,
  generateSEOReport,
  monitorWebVitals,
  testIndexability,
  generatePageSitemapData
};