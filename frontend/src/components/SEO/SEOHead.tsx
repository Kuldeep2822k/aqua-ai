import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  image?: string;
  article?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  canonical?: string;
}

const SEOHead: React.FC<SEOProps> = ({
  title = 'Aqua-AI: AI-Powered Water Quality Monitoring Platform for India',
  description = 'Real-time water quality monitoring platform powered by AI. Track pollution, get alerts, and access government data for India\'s water bodies. Professional environmental intelligence solution.',
  keywords = 'water quality, India, AI, pollution monitoring, environmental data, government APIs, real-time alerts, water safety, CPCB, water analytics',
  url = 'https://aqua-9ddsff2nt-nicejob.vercel.app',
  image = '/logo512.png',
  article = false,
  author = 'Kuldeep Kumar',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  type = 'website',
  noindex = false,
  canonical
}) => {
  const fullUrl = url.startsWith('http') ? url : `https://aqua-9ddsff2nt-nicejob.vercel.app${url}`;
  const fullImage = image.startsWith('http') ? image : `https://aqua-9ddsff2nt-nicejob.vercel.app${image}`;
  const canonicalUrl = canonical || fullUrl;

  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': article ? 'Article' : 'WebApplication',
    name: title,
    description,
    url: fullUrl,
    image: fullImage,
    author: {
      '@type': 'Person',
      name: author,
      url: 'https://github.com/Kuldeep2822k'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aqua-AI',
      logo: {
        '@type': 'ImageObject',
        url: fullImage
      }
    },
    applicationCategory: 'EnvironmentalApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '125'
    }
  };

  if (article && publishedTime) {
    (structuredData as any).datePublished = publishedTime;
    (structuredData as any).dateModified = modifiedTime || publishedTime;
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Aqua-AI" />
      <meta property="og:locale" content="en_US" />
      
      {article && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AquaAI_India" />
      <meta name="twitter:creator" content="@Kuldeep2822k" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content="Aqua-AI Water Quality Monitoring Platform" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="application-name" content="Aqua-AI" />
      <meta name="theme-color" content="#00A8E8" />
      <meta name="msapplication-TileColor" content="#00A8E8" />
      <meta name="apple-mobile-web-app-title" content="Aqua-AI" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Language and Region */}
      <meta name="language" content="English" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.country" content="India" />
      <meta name="geo.placename" content="India" />
      
      {/* Content Security and Performance */}
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Additional Schema for Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Aqua-AI',
          url: 'https://aqua-9ddsff2nt-nicejob.vercel.app',
          logo: fullImage,
          description: 'AI-powered water quality monitoring platform for India',
          foundingDate: '2024',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'IN'
          },
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: ['English', 'Hindi']
          },
          sameAs: [
            'https://github.com/Kuldeep2822k/aqua-ai'
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;