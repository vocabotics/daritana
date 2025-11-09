/**
 * SEO Head Component
 * Dynamic meta tags and structured data for pages
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoManager, SEOMetaTags, StructuredData } from '@/utils/seo';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'profile' | 'product';
  structuredData?: StructuredData;
  canonical?: string;
  robots?: string;
  noindex?: boolean;
}

export function SEOHead({
  title,
  description,
  keywords,
  image,
  type = 'website',
  structuredData,
  canonical,
  robots,
  noindex = false,
}: SEOHeadProps) {
  const location = useLocation();

  useEffect(() => {
    // Build meta tags
    const meta: SEOMetaTags = {
      title: title
        ? `${title} | Daritana`
        : 'Daritana - Architecture Project Management Platform',
      description,
      keywords,
      image,
      type,
      canonical: canonical || `${window.location.origin}${location.pathname}`,
      robots: noindex ? 'noindex, nofollow' : robots || 'index, follow',
    };

    // Update meta tags
    seoManager.updateMetaTags(meta);

    // Add structured data if provided
    if (structuredData) {
      seoManager.addStructuredData(structuredData);
    }

    // Add default organization schema on homepage
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      seoManager.addStructuredData(seoManager.getOrganizationSchema());
    }
  }, [title, description, keywords, image, type, canonical, robots, noindex, location, structuredData]);

  return null; // This component doesn't render anything
}

/**
 * SEO component for project pages
 */
export function ProjectSEO({ project }: { project: any }) {
  return (
    <SEOHead
      title={project.name}
      description={project.description || `Architecture project: ${project.name}`}
      keywords={[
        project.type,
        'architecture',
        'design',
        'project',
        project.location,
      ].filter(Boolean)}
      image={project.image}
      type="article"
      structuredData={seoManager.getBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Projects', url: '/projects' },
        { name: project.name, url: `/projects/${project.id}` },
      ])}
    />
  );
}

/**
 * SEO component for marketplace products
 */
export function ProductSEO({ product }: { product: any }) {
  return (
    <SEOHead
      title={product.name}
      description={product.description}
      keywords={[product.category, 'building materials', 'architecture', 'Malaysia'].filter(Boolean)}
      image={product.image}
      type="product"
      structuredData={seoManager.getProductSchema({
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        currency: 'MYR',
        availability: product.inStock ? 'InStock' : 'OutOfStock',
        sku: product.sku,
        brand: product.brand,
      })}
    />
  );
}

/**
 * SEO component for dashboard pages
 */
export function DashboardSEO() {
  return (
    <SEOHead
      title="Dashboard"
      description="Manage your architecture projects, tasks, team, and finances from your central dashboard."
      keywords={[
        'project dashboard',
        'architecture management',
        'team collaboration',
        'project analytics',
      ]}
    />
  );
}

/**
 * SEO component for tasks/kanban
 */
export function TasksSEO() {
  return (
    <SEOHead
      title="Tasks & Kanban Board"
      description="Organize and track project tasks with our powerful kanban board and task management system."
      keywords={['task management', 'kanban board', 'project tasks', 'team collaboration']}
    />
  );
}

/**
 * SEO component for marketplace
 */
export function MarketplaceSEO() {
  return (
    <SEOHead
      title="Marketplace - Building Materials & Services"
      description="Browse thousands of building materials, tools, and services from verified Malaysian suppliers. Find everything you need for your architecture projects."
      keywords={[
        'building materials',
        'architecture products',
        'construction supplies',
        'Malaysia suppliers',
        'design materials',
      ]}
    />
  );
}

/**
 * SEO component for community
 */
export function CommunitySEO() {
  return (
    <SEOHead
      title="Community - Connect with Architects"
      description="Join the largest community of architects, designers, and construction professionals in Malaysia. Share projects, get inspiration, and network."
      keywords={[
        'architecture community',
        'designer network',
        'professional network',
        'Malaysia architects',
      ]}
    />
  );
}

/**
 * SEO component for financial pages
 */
export function FinancialSEO() {
  return (
    <SEOHead
      title="Financial Management"
      description="Track invoices, expenses, budgets, and financial analytics for your architecture projects."
      keywords={['financial management', 'project accounting', 'invoices', 'budgets', 'expenses']}
    />
  );
}

/**
 * SEO component for help/support pages
 */
export function HelpSEO() {
  const faqs = [
    {
      question: 'How do I create a new project in Daritana?',
      answer:
        'To create a new project, go to the Projects page and click the "Create Project" button. Fill in the project details including name, type, client, and team members.',
    },
    {
      question: 'Can I collaborate with my team in real-time?',
      answer:
        'Yes! Daritana supports real-time collaboration with live cursors, comments, and presence indicators. You can see who is viewing and editing simultaneously.',
    },
    {
      question: 'Does Daritana support Malaysian compliance standards?',
      answer:
        'Absolutely. Daritana includes built-in support for Malaysian building codes, UBBL compliance, and local regulatory requirements.',
    },
    {
      question: 'What payment methods are supported?',
      answer:
        'We support multiple payment methods including credit cards via Stripe and Malaysian FPX online banking.',
    },
  ];

  return (
    <SEOHead
      title="Help & Support"
      description="Get help with Daritana. Browse FAQs, tutorials, and documentation for architecture project management."
      keywords={['help', 'support', 'documentation', 'tutorials', 'FAQ']}
      structuredData={seoManager.getFAQSchema(faqs)}
    />
  );
}

export default SEOHead;
