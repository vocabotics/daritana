import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguageStore } from '@/store/languageStore';
import { supportedLanguages } from '@/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'select' | 'cards' | 'compact';
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
  className 
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const { currentLanguage, setLanguage, getCurrentLanguageInfo } = useLanguageStore();
  
  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    toast.success(t('success.languageChanged'));
  };

  const currentLangInfo = getCurrentLanguageInfo();

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={cn("flex items-center gap-2", className)}
          >
            <Globe className="h-4 w-4" />
            {showFlags && currentLangInfo?.flag}
            <span className="hidden sm:inline">
              {showNativeNames ? currentLangInfo?.nativeName : currentLangInfo?.name}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-48">
          {supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {showFlags && <span>{language.flag}</span>}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {showNativeNames ? language.nativeName : language.name}
                  </span>
                  {showNativeNames && language.nativeName !== language.name && (
                    <span className="text-xs text-muted-foreground">
                      {language.name}
                    </span>
                  )}
                </div>
              </div>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'select') {
    return (
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className={cn("w-full", className)}>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                {showFlags && <span>{language.flag}</span>}
                <span>
                  {showNativeNames ? language.nativeName : language.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {supportedLanguages.map((language) => (
          <Card 
            key={language.code}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              currentLanguage === language.code 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            )}
            onClick={() => handleLanguageChange(language.code)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showFlags && (
                    <span className="text-2xl">{language.flag}</span>
                  )}
                  <div>
                    <div className="font-medium">
                      {showNativeNames ? language.nativeName : language.name}
                    </div>
                    {showNativeNames && language.nativeName !== language.name && (
                      <div className="text-sm text-muted-foreground">
                        {language.name}
                      </div>
                    )}
                  </div>
                </div>
                {currentLanguage === language.code && (
                  <Badge variant="default" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {t('common.active')}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {supportedLanguages.map((language) => (
          <Button
            key={language.code}
            variant={currentLanguage === language.code ? "default" : "ghost"}
            size="sm"
            onClick={() => handleLanguageChange(language.code)}
            className="h-8 px-2"
          >
            {showFlags ? language.flag : language.code.toUpperCase()}
          </Button>
        ))}
      </div>
    );
  }

  return null;
}

export function LanguageSettings() {
  const { t } = useTranslation();
  const { currentLanguage, getCurrentLanguageInfo } = useLanguageStore();
  
  const currentLangInfo = getCurrentLanguageInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.languageSelection')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">
            {t('settings.selectLanguage')}
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Choose your preferred language for the interface
          </p>
          <LanguageSwitcher variant="cards" />
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('settings.defaultLanguage')}:
            </span>
            <div className="flex items-center gap-2">
              <span>{currentLangInfo?.flag}</span>
              <span className="font-medium">{currentLangInfo?.nativeName}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Language changes apply immediately to the interface. 
            All dates, numbers, and currency will be formatted according to Malaysian 
            standards regardless of language selection.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function HeaderLanguageSwitcher() {
  const { getCurrentLanguageInfo } = useLanguageStore();
  const currentLangInfo = getCurrentLanguageInfo();

  return (
    <LanguageSwitcher 
      variant="dropdown" 
      showFlags={true}
      showNativeNames={false}
      className="hidden lg:flex"
    />
  );
}

export function MobileLanguageSwitcher() {
  return (
    <LanguageSwitcher 
      variant="compact" 
      showFlags={true}
      className="lg:hidden"
    />
  );
}