export interface PageSEOConfig {
  title: string;
  description: string;
  keywords: string;
  url: string;
  image?: string;
  section?: string;
  tags?: string[];
}

export const seoConfig: Record<string, PageSEOConfig> = {
  home: {
    title: 'Aqua-AI: AI-Powered Water Quality Monitoring Platform for India',
    description: 'Real-time water quality monitoring platform powered by AI. Track pollution, get alerts, and access government data for India\'s water bodies. Professional environmental intelligence solution.',
    keywords: 'water quality, India, AI, pollution monitoring, environmental data, government APIs, real-time alerts, water safety, CPCB, water analytics',
    url: '/',
    section: 'homepage'
  },
  
  dashboard: {
    title: 'Water Quality Dashboard - Real-time Monitoring | Aqua-AI',
    description: 'Monitor India\'s water quality in real-time with AI-powered insights. View metrics, alerts, and environmental data from government sources with interactive dashboards.',
    keywords: 'water quality dashboard, real-time monitoring, India water data, CPCB dashboard, environmental metrics, water pollution alerts',
    url: '/dashboard',
    section: 'dashboard',
    tags: ['dashboard', 'monitoring', 'real-time', 'metrics']
  },
  
  map: {
    title: 'Interactive Water Quality Map - India Coverage | Aqua-AI',
    description: 'Explore water quality data across India with interactive maps. View pollution levels, monitoring stations, and government data with advanced filtering and visualization.',
    keywords: 'water quality map, India water pollution, interactive map, monitoring stations, environmental visualization, CPCB locations',
    url: '/map',
    section: 'mapping',
    tags: ['map', 'visualization', 'location', 'pollution']
  },
  
  analytics: {
    title: 'Water Quality Analytics & Insights | Aqua-AI',
    description: 'Advanced analytics and AI insights for water quality trends. Analyze pollution patterns, predict quality changes, and access detailed environmental reports.',
    keywords: 'water quality analytics, pollution trends, AI insights, environmental reports, data analysis, water quality predictions',
    url: '/analytics',
    section: 'analytics',
    tags: ['analytics', 'trends', 'AI', 'insights', 'reports']
  },
  
  alerts: {
    title: 'Water Quality Alerts & Notifications | Aqua-AI',
    description: 'Get real-time alerts for water quality issues, pollution events, and environmental hazards. Stay informed with AI-powered notification system.',
    keywords: 'water quality alerts, pollution notifications, environmental alerts, water safety warnings, real-time alerts',
    url: '/alerts',
    section: 'alerts',
    tags: ['alerts', 'notifications', 'safety', 'warnings']
  },
  
  community: {
    title: 'Water Quality Community & Citizen Reports | Aqua-AI',
    description: 'Join the water quality community. Report issues, share insights, and collaborate on environmental monitoring with fellow citizens and experts.',
    keywords: 'water quality community, citizen reports, environmental collaboration, water monitoring community, pollution reporting',
    url: '/community',
    section: 'community',
    tags: ['community', 'citizen-science', 'reporting', 'collaboration']
  },
  
  research: {
    title: 'Water Quality Research & Studies | Aqua-AI',
    description: 'Access latest research, studies, and scientific insights on water quality in India. Evidence-based environmental intelligence and academic resources.',
    keywords: 'water quality research, environmental studies, scientific research, water pollution studies, academic resources, research papers',
    url: '/research',
    section: 'research',
    tags: ['research', 'studies', 'science', 'academic']
  },
  
  sustainability: {
    title: 'Water Sustainability & Conservation | Aqua-AI',
    description: 'Learn about water sustainability initiatives, conservation strategies, and environmental protection measures. Contribute to sustainable water management.',
    keywords: 'water sustainability, conservation, environmental protection, sustainable development, water management, green initiatives',
    url: '/sustainability',
    section: 'sustainability',
    tags: ['sustainability', 'conservation', 'environment', 'green']
  },
  
  settings: {
    title: 'Account Settings & Preferences | Aqua-AI',
    description: 'Manage your Aqua-AI account settings, notification preferences, and personalize your water quality monitoring experience.',
    keywords: 'account settings, user preferences, notifications, profile settings, customization',
    url: '/settings',
    section: 'settings',
    tags: ['settings', 'account', 'preferences'],
  }
};

// Generate breadcrumb structured data
export const generateBreadcrumbSchema = (path: string) => {
  const pathSegments = path.split('/').filter(segment => segment);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    ...pathSegments.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      url: '/' + pathSegments.slice(0, index + 1).join('/')
    }))
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://aqua-9ddsff2nt-nicejob.vercel.app${item.url}`
    }))
  };
};

// Generate FAQ schema for pages
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

// Common FAQs for the platform
export const platformFAQs = [
  {
    question: 'What is Aqua-AI and how does it work?',
    answer: 'Aqua-AI is an AI-powered water quality monitoring platform for India. It integrates government data sources, real-time monitoring, and machine learning to provide comprehensive water quality insights, predictions, and alerts.'
  },
  {
    question: 'How accurate is the water quality data?',
    answer: 'Our platform sources data from official government agencies like CPCB and uses AI algorithms to ensure data accuracy. We provide real-time updates and validate information through multiple sources.'
  },
  {
    question: 'Can I report water quality issues through the platform?',
    answer: 'Yes, our community feature allows citizens to report water quality issues, upload photos, and share observations. This crowdsourced data helps improve our monitoring coverage.'
  },
  {
    question: 'Is Aqua-AI free to use?',
    answer: 'Yes, Aqua-AI is completely free for basic usage. We believe environmental data should be accessible to everyone to promote water safety and environmental awareness.'
  },
  {
    question: 'How often is the data updated?',
    answer: 'Water quality data is updated in real-time from government monitoring stations. Community reports are processed immediately, and AI predictions are updated daily.'
  }
];

export default seoConfig;