/**
 * Analytics Service
 * Multi-provider analytics with Google Analytics 4 and Mixpanel
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    mixpanel?: any;
  }
}

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

interface UserProperties {
  userId?: string;
  email?: string;
  organizationId?: string;
  role?: string;
  plan?: string;
  [key: string]: any;
}

class Analytics {
  private gaEnabled: boolean;
  private mixpanelEnabled: boolean;
  private isProduction: boolean;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.gaEnabled = !!import.meta.env.VITE_GA_MEASUREMENT_ID;
    this.mixpanelEnabled = !!import.meta.env.VITE_MIXPANEL_TOKEN;

    if (this.isProduction) {
      this.initializeGA();
      this.initializeMixpanel();
    }
  }

  private initializeGA() {
    if (!this.gaEnabled) return;

    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

    // Load GA4 script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll send manually
    });
  }

  private initializeMixpanel() {
    if (!this.mixpanelEnabled) return;

    // Load Mixpanel
    const script = document.createElement('script');
    script.innerHTML = `(function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}for(var d={},e=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<j.length;c++)b(j[c]);return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);`;
    document.head.appendChild(script);

    // Initialize with token
    if (window.mixpanel) {
      window.mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN);
    }
  }

  // Page tracking
  trackPageView(path: string, title?: string) {
    if (!this.isProduction) return;

    if (this.gaEnabled && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }

    if (this.mixpanelEnabled && window.mixpanel) {
      window.mixpanel.track('Page View', {
        path,
        title: title || document.title,
      });
    }
  }

  // Event tracking
  trackEvent(event: AnalyticsEvent) {
    if (!this.isProduction) return;

    if (this.gaEnabled && window.gtag) {
      window.gtag('event', event.name, event.properties);
    }

    if (this.mixpanelEnabled && window.mixpanel) {
      window.mixpanel.track(event.name, event.properties);
    }
  }

  // User identification
  identify(userId: string, properties?: UserProperties) {
    if (!this.isProduction) return;

    if (this.gaEnabled && window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
        user_id: userId,
        user_properties: properties,
      });
    }

    if (this.mixpanelEnabled && window.mixpanel) {
      window.mixpanel.identify(userId);
      if (properties) {
        window.mixpanel.people.set(properties);
      }
    }
  }

  // Commonly used events
  trackLogin(userId: string, method: string = 'email') {
    this.trackEvent({
      name: 'login',
      properties: { method, userId },
    });
  }

  trackSignup(userId: string, plan: string = 'free') {
    this.trackEvent({
      name: 'sign_up',
      properties: { method: 'email', plan, userId },
    });
  }

  trackPurchase(transactionId: string, value: number, currency: string = 'MYR', items: any[]) {
    this.trackEvent({
      name: 'purchase',
      properties: {
        transaction_id: transactionId,
        value,
        currency,
        items,
      },
    });
  }

  trackProjectCreated(projectId: string, projectType: string) {
    this.trackEvent({
      name: 'project_created',
      properties: { projectId, projectType },
    });
  }

  trackFeatureUsed(featureName: string, properties?: Record<string, any>) {
    this.trackEvent({
      name: 'feature_used',
      properties: { feature: featureName, ...properties },
    });
  }

  trackError(errorName: string, errorMessage: string, fatal: boolean = false) {
    this.trackEvent({
      name: 'error',
      properties: {
        error_name: errorName,
        error_message: errorMessage,
        fatal,
      },
    });
  }
}

export const analytics = new Analytics();
export default analytics;
