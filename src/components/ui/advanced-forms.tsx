// Advanced Form Components with 2025 Design Patterns
import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  Search, Eye, EyeOff, Upload, X, Check, AlertCircle,
  Calendar, Clock, MapPin, Phone, Mail, Globe,
  Camera, Image, File, FileText, Mic, MicOff
} from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

// Advanced Input Component
const inputVariants = cva(
  'flex w-full rounded-md border bg-background text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input focus:ring-2 focus:ring-ring focus:border-transparent',
        outline: 'border-2 focus:border-primary',
        filled: 'bg-secondary border-transparent focus:bg-background focus:border-input',
        ghost: 'border-transparent hover:bg-accent focus:bg-accent',
        glass: 'glass-morphism border-white/10 focus:border-white/20',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
        xl: 'h-14 px-5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface AdvancedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  success?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

export const AdvancedInput = React.forwardRef<HTMLInputElement, AdvancedInputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      hint,
      icon,
      iconPosition = 'left',
      loading,
      success,
      clearable,
      onClear,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const inputType = type === 'password' && showPassword ? 'text' : type;
    const isDisabled = disabled || loading;
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          {/* Input Field */}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              inputVariants({ variant, size }),
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              type === 'password' && 'pr-10',
              clearable && props.value && 'pr-10',
              error && 'border-destructive focus:ring-destructive',
              success && 'border-green-500 focus:ring-green-500',
              className
            )}
            disabled={isDisabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* Right Icons Container */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            {/* Loading Spinner */}
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            )}
            
            {/* Success Check */}
            {success && !loading && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            
            {/* Error Icon */}
            {error && !loading && !success && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            
            {/* Clear Button */}
            {clearable && props.value && !loading && (
              <button
                type="button"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {/* Password Toggle */}
            {type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            
            {/* Right Icon */}
            {icon && iconPosition === 'right' && !clearable && type !== 'password' && (
              <div className="text-muted-foreground">{icon}</div>
            )}
          </div>
        </div>
        
        {/* Hint or Error Message */}
        {(hint || error) && (
          <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

AdvancedInput.displayName = 'AdvancedInput';

// Search Input Component
interface SearchInputProps extends Omit<AdvancedInputProps, 'type' | 'icon'> {
  onSearch?: (value: string) => void;
  suggestions?: string[];
  showSuggestions?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  suggestions = [],
  showSuggestions = true,
  placeholder = 'Search...',
  ...props
}) => {
  const [value, setValue] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const handleSearch = (searchValue: string) => {
    setValue(searchValue);
    onSearch?.(searchValue);
    setShowDropdown(false);
  };
  
  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase())
  );
  
  return (
    <div className="relative">
      <AdvancedInput
        {...props}
        type="search"
        icon={<Search className="h-4 w-4" />}
        iconPosition="left"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setShowDropdown(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch(value);
          }
        }}
        placeholder={placeholder}
        clearable
        onClear={() => {
          setValue('');
          onSearch?.('');
        }}
      />
      
      {showSuggestions && showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => handleSearch(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// File Upload Component
interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onUpload?: (files: File[]) => void;
  onError?: (error: string) => void;
  variant?: 'default' | 'drag' | 'button';
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize = 10,
  onUpload,
  onError,
  variant = 'drag',
  className,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const newFiles = Array.from(fileList);
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        onError?.(`${file.name} exceeds maximum size of ${maxSize}MB`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (multiple) {
      setFiles([...files, ...validFiles]);
      onUpload?.([...files, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
      onUpload?.(validFiles.slice(0, 1));
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };
  
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload?.(newFiles);
  };
  
  if (variant === 'button') {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Upload File</span>
        </button>
        
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)}KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          'cursor-pointer'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground">
          {accept && `Accepted formats: ${accept}`}
          {maxSize && ` • Max size: ${maxSize}MB`}
          {multiple && ' • Multiple files allowed'}
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-md">
              <div className="flex items-center space-x-3">
                {file.type.startsWith('image/') ? (
                  <Image className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Rich Text Input Component
interface RichTextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  showToolbar?: boolean;
  className?: string;
}

export const RichTextInput: React.FC<RichTextInputProps> = ({
  value = '',
  onChange,
  placeholder,
  maxLength,
  rows = 4,
  showToolbar = true,
  className,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange?.(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {showToolbar && (
        <div className="flex items-center space-x-1 p-1 bg-secondary rounded-md">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="Bold"
          >
            <span className="font-bold text-sm">B</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="Italic"
          >
            <span className="italic text-sm">I</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~')}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="Strikethrough"
          >
            <span className="line-through text-sm">S</span>
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('# ')}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="Heading"
          >
            <span className="text-sm font-semibold">H</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="List"
          >
            <span className="text-sm">•</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('[', '](url)')}
            className="p-1.5 hover:bg-background rounded transition-colors"
            title="Link"
          >
            <span className="text-sm">🔗</span>
          </button>
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'w-full px-3 py-2 text-sm bg-background border rounded-md',
            'resize-none custom-scrollbar',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

// Voice Input Component
interface VoiceInputProps extends Omit<AdvancedInputProps, 'icon'> {
  onTranscript?: (text: string) => void;
  language?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  language = 'en-US',
  ...props
}) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser');
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      onTranscript?.(text);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognition.start();
    setIsRecording(true);
  };
  
  return (
    <div className="relative">
      <AdvancedInput
        {...props}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        icon={
          <button
            type="button"
            onClick={startRecording}
            className={cn(
              'transition-colors',
              isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        }
        iconPosition="right"
      />
    </div>
  );
};

export default {
  AdvancedInput,
  SearchInput,
  FileUpload,
  RichTextInput,
  VoiceInput,
};