/**
 * SEO Utilities
 * Meta tags, Open Graph, Twitter Cards, and JSON-LD structured data
 */

export interface SEOMetaTags {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile' | 'product';
  siteName?: string;
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
  robots?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

class SEOManager {
  private defaultMeta: SEOMetaTags = {
    title: 'Daritana - Architecture Project Management Platform',
    description: 'Complete architecture and interior design project management platform for Malaysian architects, designers, and contractors. Manage projects, teams, documents, and compliance.',
    keywords: [
      'architecture',
      'project management',
      'interior design',
      'Malaysia',
      'construction',
      'design platform',
      'architectural software',
      'project collaboration',
      'building management',
      'design tools'
    ],
    author: 'Daritana',
    siteName: 'Daritana',
    locale: 'en_MY',
    type: 'website',
    robots: 'index, follow',
    twitterCard: 'summary_large_image',
  };

  private baseUrl = import.meta.env.VITE_APP_URL || 'https://daritana.com';

  /**
   * Update page meta tags
   */
  updateMetaTags(meta: SEOMetaTags): void {
    const merged = { ...this.defaultMeta, ...meta };

    // Update title
    if (merged.title) {
      document.title = merged.title;
      this.setMetaTag('og:title', merged.title);
      this.setMetaTag('twitter:title', merged.title);
    }

    // Update description
    if (merged.description) {
      this.setMetaTag('description', merged.description);
      this.setMetaTag('og:description', merged.description);
      this.setMetaTag('twitter:description', merged.description);
    }

    // Update keywords
    if (merged.keywords) {
      this.setMetaTag('keywords', merged.keywords.join(', '));
    }

    // Update author
    if (merged.author) {
      this.setMetaTag('author', merged.author);
    }

    // Update canonical URL
    if (merged.canonical) {
      this.setLinkTag('canonical', merged.canonical);
    }

    // Open Graph tags
    this.setMetaTag('og:site_name', merged.siteName || 'Daritana');
    this.setMetaTag('og:type', merged.type || 'website');
    this.setMetaTag('og:locale', merged.locale || 'en_MY');
    this.setMetaTag('og:url', merged.canonical || window.location.href);

    // Image
    if (merged.image) {
      this.setMetaTag('og:image', this.getAbsoluteUrl(merged.image));
      this.setMetaTag('twitter:image', this.getAbsoluteUrl(merged.image));
    }

    // Article specific
    if (merged.publishedTime) {
      this.setMetaTag('article:published_time', merged.publishedTime);
    }
    if (merged.modifiedTime) {
      this.setMetaTag('article:modified_time', merged.modifiedTime);
    }

    // Robots
    if (merged.robots) {
      this.setMetaTag('robots', merged.robots);
    }

    // Twitter Card
    if (merged.twitterCard) {
      this.setMetaTag('twitter:card', merged.twitterCard);
    }
    if (merged.twitterSite) {
      this.setMetaTag('twitter:site', merged.twitterSite);
    }
    if (merged.twitterCreator) {
      this.setMetaTag('twitter:creator', merged.twitterCreator);
    }
  }

  /**
   * Add JSON-LD structured data to page
   */
  addStructuredData(data: StructuredData): void {
    // Remove existing structured data
    const existing = document.getElementById('structured-data');
    if (existing) {
      existing.remove();
    }

    // Create new script tag
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Generate organization structured data
   */
  getOrganizationSchema(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Daritana',
      description: 'Architecture Project Management Platform',
      url: this.baseUrl,
      logo: `${this.baseUrl}/logo.png`,
      sameAs: [
        'https://facebook.com/daritana',
        'https://twitter.com/daritana',
        'https://linkedin.com/company/daritana',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'support@daritana.com',
        availableLanguage: ['English', 'Bahasa Malaysia', 'Chinese'],
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'MY',
        addressRegion: 'Kuala Lumpur',
      },
    };
  }

  /**
   * Generate software application structured data
   */
  getSoftwareApplicationSchema(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Daritana',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '49.99',
        priceCurrency: 'MYR',
        priceValidUntil: '2025-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
      },
      description:
        'Complete architecture and interior design project management platform for Malaysian professionals',
      screenshot: `${this.baseUrl}/screenshots/dashboard.png`,
      softwareVersion: '1.0.0',
      datePublished: '2024-01-01',
      author: {
        '@type': 'Organization',
        name: 'Daritana',
      },
    };
  }

  /**
   * Generate breadcrumb structured data
   */
  getBreadcrumbSchema(items: Array<{ name: string; url: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: this.getAbsoluteUrl(item.url),
      })),
    };
  }

  /**
   * Generate FAQ structured data
   */
  getFAQSchema(faqs: Array<{ question: string; answer: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate product structured data (for marketplace)
   */
  getProductSchema(product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    sku?: string;
    brand?: string;
  }): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: this.getAbsoluteUrl(product.image),
      sku: product.sku,
      brand: product.brand
        ? {
            '@type': 'Brand',
            name: product.brand,
          }
        : undefined,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency,
        availability: `https://schema.org/${product.availability}`,
        url: window.location.href,
      },
    };
  }

  /**
   * Set meta tag
   */
  private setMetaTag(name: string, content: string): void {
    let element: HTMLMetaElement | null = null;

    // Check if it's a property (og:, twitter:) or name attribute
    if (name.includes(':')) {
      element = document.querySelector(`meta[property="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', name);
        document.head.appendChild(element);
      }
    } else {
      element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
    }

    element.setAttribute('content', content);
  }

  /**
   * Set link tag (canonical, alternate, etc.)
   */
  private setLinkTag(rel: string, href: string): void {
    let element: HTMLLinkElement | null = document.querySelector(`link[rel="${rel}"]`);

    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', rel);
      document.head.appendChild(element);
    }

    element.setAttribute('href', href);
  }

  /**
   * Get absolute URL
   */
  private getAbsoluteUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  /**
   * Generate sitemap entry
   */
  generateSitemapEntry(
    url: string,
    lastmod?: string,
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
    priority?: number
  ): string {
    const loc = this.getAbsoluteUrl(url);
    const mod = lastmod || new Date().toISOString().split('T')[0];
    const freq = changefreq || 'weekly';
    const prio = priority !== undefined ? priority : 0.5;

    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`;
  }

  /**
   * Generate complete sitemap XML
   */
  generateSitemap(): string {
    const urls = [
      { url: '/', changefreq: 'daily' as const, priority: 1.0 },
      { url: '/dashboard', changefreq: 'daily' as const, priority: 0.9 },
      { url: '/projects', changefreq: 'daily' as const, priority: 0.9 },
      { url: '/tasks', changefreq: 'daily' as const, priority: 0.8 },
      { url: '/kanban', changefreq: 'daily' as const, priority: 0.8 },
      { url: '/timeline', changefreq: 'weekly' as const, priority: 0.7 },
      { url: '/calendar', changefreq: 'weekly' as const, priority: 0.7 },
      { url: '/team', changefreq: 'weekly' as const, priority: 0.7 },
      { url: '/financial', changefreq: 'weekly' as const, priority: 0.8 },
      { url: '/marketplace', changefreq: 'daily' as const, priority: 0.8 },
      { url: '/community', changefreq: 'daily' as const, priority: 0.7 },
      { url: '/files', changefreq: 'weekly' as const, priority: 0.6 },
      { url: '/settings', changefreq: 'monthly' as const, priority: 0.5 },
      { url: '/help', changefreq: 'monthly' as const, priority: 0.6 },
    ];

    const entries = urls.map((item) =>
      this.generateSitemapEntry(item.url, undefined, item.changefreq, item.priority)
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('')}
</urlset>`;
  }
}

export const seoManager = new SEOManager();
export default seoManager;
