/**
 * RTL-Aware Component Example
 * Demonstrates how to build components that work with both LTR and RTL languages
 */

import React from 'react';
import { ChevronRight, ArrowRight, Send } from 'lucide-react';
import { useRTL, getIconRotation } from '@/utils/rtl';
import { cn } from '@/lib/utils';
import { Button } from './button';

/**
 * Example of an RTL-aware card component
 */
export function RTLAwareCard({ 
  title, 
  description, 
  onClick 
}: { 
  title: string; 
  description: string; 
  onClick?: () => void;
}) {
  const { isRTL, textAlign, marginStart, paddingStart } = useRTL();
  
  return (
    <div 
      className={cn(
        "border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer",
        isRTL ? "text-right" : "text-left"
      )}
      onClick={onClick}
      style={textAlign}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
        <ChevronRight 
          className={cn(
            "w-5 h-5 text-gray-400",
            isRTL && "rtl-flip"
          )}
          style={{ transform: getIconRotation('chevron-right', isRTL) }}
        />
      </div>
    </div>
  );
}

/**
 * Example of an RTL-aware navigation item
 */
export function RTLAwareNavItem({ 
  icon: Icon, 
  label, 
  href, 
  isActive 
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
}) {
  const { isRTL } = useRTL();
  
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
        isActive 
          ? "bg-blue-50 text-blue-600" 
          : "hover:bg-gray-100 text-gray-700",
        // Use logical properties for margin
        "ms-2 me-2"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1 text-start">{label}</span>
      {isActive && (
        <div className={cn(
          "w-1 h-full bg-blue-600 absolute",
          isRTL ? "rounded-s" : "rounded-e",
          isRTL ? "end-0" : "start-0"
        )} />
      )}
    </a>
  );
}

/**
 * Example of an RTL-aware form
 */
export function RTLAwareForm() {
  const { isRTL, textAlign } = useRTL();
  
  return (
    <form className="space-y-4" style={textAlign}>
      <div>
        <label className="block text-sm font-medium mb-1 text-start">
          Name
        </label>
        <input
          type="text"
          className={cn(
            "w-full px-3 py-2 border rounded-lg",
            "text-start"
          )}
          placeholder="Enter your name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1 text-start">
          Email
        </label>
        <input
          type="email"
          className={cn(
            "w-full px-3 py-2 border rounded-lg",
            "text-start"
          )}
          placeholder="your@email.com"
          dir="ltr" // Email should always be LTR
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="terms"
          className={cn(
            isRTL ? "me-2" : "ms-2"
          )}
        />
        <label htmlFor="terms" className="text-sm">
          I agree to the terms and conditions
        </label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2"
      >
        <span>Submit</span>
        <Send 
          className={cn(
            "w-4 h-4",
            isRTL && "rtl-flip"
          )}
          style={{ transform: getIconRotation('send', isRTL) }}
        />
      </Button>
    </form>
  );
}

/**
 * Example of RTL-aware breadcrumbs
 */
export function RTLAwareBreadcrumbs({ 
  items 
}: { 
  items: { label: string; href?: string }[] 
}) {
  const { isRTL } = useRTL();
  
  return (
    <nav className="flex items-center space-x-2">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight 
              className={cn(
                "w-4 h-4 text-gray-400",
                isRTL && "rotate-180"
              )}
            />
          )}
          {item.href ? (
            <a 
              href={item.href} 
              className="text-blue-600 hover:underline"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-700">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/**
 * Example of RTL-aware progress bar
 */
export function RTLAwareProgressBar({ 
  value, 
  max = 100 
}: { 
  value: number; 
  max?: number;
}) {
  const { isRTL } = useRTL();
  const percentage = (value / max) * 100;
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={cn(
          "bg-blue-600 h-2 rounded-full transition-all",
          isRTL ? "rounded-e-full" : "rounded-s-full"
        )}
        style={{ 
          width: `${percentage}%`,
          transformOrigin: isRTL ? 'right' : 'left'
        }}
      />
    </div>
  );
}

/**
 * Example usage component
 */
export function RTLExamplePage() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-start mb-4">
        RTL-Aware Components Examples
      </h1>
      
      <section>
        <h2 className="text-xl font-semibold mb-4 text-start">Card Component</h2>
        <RTLAwareCard
          title="Project Alpha"
          description="Modern residential complex in Kuala Lumpur"
          onClick={() => console.log('Card clicked')}
        />
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4 text-start">Breadcrumbs</h2>
        <RTLAwareBreadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'Project Alpha' }
          ]}
        />
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4 text-start">Progress Bar</h2>
        <RTLAwareProgressBar value={65} />
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4 text-start">Form</h2>
        <div className="max-w-md">
          <RTLAwareForm />
        </div>
      </section>
    </div>
  );
}