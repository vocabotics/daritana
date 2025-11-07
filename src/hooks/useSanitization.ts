import { useMemo, useCallback } from 'react';
import { securityManager } from '@/utils/security';
import { sanitizeInput } from '@/utils/validation';

interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  allowedAttributes?: string[];
  trimWhitespace?: boolean;
  removeEmojis?: boolean;
}

interface UseSanitizationReturn {
  sanitizeText: (input: string, options?: SanitizationOptions) => string;
  sanitizeObject: <T extends Record<string, any>>(obj: T, fieldOptions?: Record<keyof T, SanitizationOptions>) => T;
  sanitizeArray: (arr: string[], options?: SanitizationOptions) => string[];
  validateAndSanitize: <T>(input: T, validator: (input: T) => boolean, sanitizer: (input: T) => T) => { isValid: boolean; sanitized: T };
  isContentSafe: (content: string) => { safe: boolean; threats: string[] };
}

export const useSanitization = (): UseSanitizationReturn => {
  const sanitizeText = useCallback((input: string, options: SanitizationOptions = {}): string => {
    const {
      allowHtml = false,
      maxLength,
      allowedTags = [],
      allowedAttributes = [],
      trimWhitespace = true,
      removeEmojis = false,
    } = options;

    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Trim whitespace
    if (trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Remove emojis if requested
    if (removeEmojis) {
      sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    }

    // Handle HTML content
    if (!allowHtml) {
      // Strip all HTML tags and encode entities
      sanitized = securityManager.sanitizeHtml(sanitized);
    } else {
      // Allow specific HTML tags and attributes
      sanitized = sanitizeHtmlWithWhitelist(sanitized, allowedTags, allowedAttributes);
    }

    // Apply length limit
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Remove dangerous patterns
    sanitized = sanitizeInput(sanitized);

    return sanitized;
  }, []);

  const sanitizeObject = useCallback(<T extends Record<string, any>>(
    obj: T,
    fieldOptions: Record<keyof T, SanitizationOptions> = {}
  ): T => {
    const sanitized = { ...obj };

    for (const [key, value] of Object.entries(sanitized)) {
      const options = fieldOptions[key as keyof T] || {};
      
      if (typeof value === 'string') {
        sanitized[key as keyof T] = sanitizeText(value, options) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map((item: any) => 
          typeof item === 'string' ? sanitizeText(item, options) : item
        ) as T[keyof T];
      } else if (value && typeof value === 'object') {
        sanitized[key as keyof T] = sanitizeObject(value, {}) as T[keyof T];
      }
    }

    return sanitized;
  }, [sanitizeText]);

  const sanitizeArray = useCallback((arr: string[], options: SanitizationOptions = {}): string[] => {
    return arr.map(item => sanitizeText(item, options));
  }, [sanitizeText]);

  const validateAndSanitize = useCallback(<T>(
    input: T,
    validator: (input: T) => boolean,
    sanitizer: (input: T) => T
  ) => {
    const sanitized = sanitizer(input);
    const isValid = validator(sanitized);
    
    return {
      isValid,
      sanitized,
    };
  }, []);

  const isContentSafe = useCallback((content: string): { safe: boolean; threats: string[] } => {
    const threats: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, threat: 'Script tag detected' },
      { pattern: /javascript:/gi, threat: 'JavaScript protocol detected' },
      { pattern: /vbscript:/gi, threat: 'VBScript protocol detected' },
      { pattern: /on\w+\s*=/gi, threat: 'Event handler detected' },
      { pattern: /<iframe\b[^>]*>/gi, threat: 'Iframe tag detected' },
      { pattern: /<object\b[^>]*>/gi, threat: 'Object tag detected' },
      { pattern: /<embed\b[^>]*>/gi, threat: 'Embed tag detected' },
      { pattern: /eval\s*\(/gi, threat: 'Eval function detected' },
      { pattern: /document\.write/gi, threat: 'Document.write detected' },
      { pattern: /window\.location/gi, threat: 'Window.location manipulation detected' },
      { pattern: /document\.cookie/gi, threat: 'Cookie access detected' },
      { pattern: /<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, threat: 'Meta refresh detected' },
    ];

    for (const { pattern, threat } of dangerousPatterns) {
      if (pattern.test(content)) {
        threats.push(threat);
      }
    }

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s<>"]+/gi;
    const urls = content.match(urlPattern) || [];
    
    for (const url of urls) {
      if (!isUrlSafe(url)) {
        threats.push(`Suspicious URL detected: ${url}`);
      }
    }

    // Check for base64 encoded content that might be malicious
    const base64Pattern = /data:([^;]+);base64,([A-Za-z0-9+/=]+)/gi;
    const base64Matches = content.match(base64Pattern) || [];
    
    for (const match of base64Matches) {
      if (match.includes('javascript') || match.includes('script')) {
        threats.push('Suspicious base64 content detected');
      }
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  }, []);

  return {
    sanitizeText,
    sanitizeObject,
    sanitizeArray,
    validateAndSanitize,
    isContentSafe,
  };
};

// Helper functions
const sanitizeHtmlWithWhitelist = (
  html: string,
  allowedTags: string[],
  allowedAttributes: string[]
): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove all script tags and dangerous elements
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const elements = tempDiv.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // Remove dangerous attributes
  const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
  const allElements = tempDiv.querySelectorAll('*');
  
  allElements.forEach(el => {
    // Remove dangerous attributes
    dangerousAttributes.forEach(attr => {
      el.removeAttribute(attr);
    });

    // Remove href with javascript protocol
    const href = el.getAttribute('href');
    if (href && href.toLowerCase().startsWith('javascript:')) {
      el.removeAttribute('href');
    }

    // If allowedTags is specified, remove non-allowed tags
    if (allowedTags.length > 0 && !allowedTags.includes(el.tagName.toLowerCase())) {
      const textNode = document.createTextNode(el.textContent || '');
      el.parentNode?.replaceChild(textNode, el);
      return;
    }

    // If allowedAttributes is specified, remove non-allowed attributes
    if (allowedAttributes.length > 0) {
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    }
  });

  return tempDiv.innerHTML;
};

const isUrlSafe = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    if (dangerousProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // Block suspicious domains (you can expand this list)
    const suspiciousDomains = [
      'bit.ly',
      'tinyurl.com',
      'short.link',
      // Add more suspicious domains as needed
    ];

    const hostname = urlObj.hostname.toLowerCase();
    if (suspiciousDomains.some(domain => hostname.includes(domain))) {
      return false;
    }

    // Block URLs with suspicious patterns
    const suspiciousPatterns = [
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u, // Emojis in URLs
      /%[0-9a-f]{2}/i, // URL encoded characters (might be used to hide malicious content)
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    // Invalid URL
    return false;
  }
};

// Form-specific sanitization presets
export const SANITIZATION_PRESETS = {
  name: {
    maxLength: 100,
    trimWhitespace: true,
    removeEmojis: false,
  },
  email: {
    maxLength: 254,
    trimWhitespace: true,
    removeEmojis: true,
  },
  password: {
    trimWhitespace: false, // Don't trim passwords
    removeEmojis: false,
  },
  description: {
    maxLength: 1000,
    trimWhitespace: true,
    allowHtml: false,
  },
  richText: {
    maxLength: 5000,
    allowHtml: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: ['class', 'id'],
  },
  url: {
    maxLength: 2000,
    trimWhitespace: true,
  },
  search: {
    maxLength: 200,
    trimWhitespace: true,
  },
} as const;