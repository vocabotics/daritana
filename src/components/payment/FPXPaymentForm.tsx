// ==================== FPX PAYMENT FORM COMPONENT ====================

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Search, 
  Shield, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { usePaymentStore } from '@/store/paymentStore';
import { FPXBank } from '@/types/payment';
import { cn } from '@/lib/utils';

// Form validation schema
const fpxPaymentSchema = z.object({
  buyerName: z.string().min(3, 'Name must be at least 3 characters'),
  buyerEmail: z.string().email('Invalid email address'),
  buyerPhone: z.string().regex(/^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/, 'Invalid Malaysian phone number'),
  buyerBankId: z.string().min(1, 'Please select a bank'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms')
});

type FPXPaymentFormData = z.infer<typeof fpxPaymentSchema>;

interface FPXPaymentFormProps {
  amount: number;
  description: string;
  projectId?: string;
  invoiceId?: string;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
  userType?: 'individual' | 'corporate';
}

export const FPXPaymentForm: React.FC<FPXPaymentFormProps> = ({
  amount,
  description,
  projectId,
  invoiceId,
  onSuccess,
  onCancel,
  userType = 'individual'
}) => {
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllBanks, setShowAllBanks] = useState(false);
  
  const {
    fpxBanks,
    isLoadingBanks,
    isProcessing,
    error,
    loadFPXBanks,
    refreshFPXBanks,
    createPayment,
    calculateFees,
    formatCurrency,
    clearError
  } = usePaymentStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<FPXPaymentFormData>({
    resolver: zodResolver(fpxPaymentSchema),
    mode: 'onChange'
  });

  // Load banks on mount
  useEffect(() => {
    loadFPXBanks(userType);
  }, [userType]);

  // Auto-refresh banks every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFPXBanks();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate fees
  const fees = calculateFees(amount, 'fpx');
  const totalAmount = amount + fees.total;

  // Get banks list
  const banks = fpxBanks[userType] || [];
  const popularBanks = ['MBB0228', 'CIMB0104', 'PBB0233', 'RHB0218', 'HLB0224'];
  
  // Filter banks based on search
  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Separate popular and other banks
  const popularBanksList = filteredBanks.filter(bank => 
    popularBanks.includes(bank.code)
  );
  const otherBanksList = filteredBanks.filter(bank => 
    !popularBanks.includes(bank.code)
  );

  // Handle form submission
  const onSubmit = async (data: FPXPaymentFormData) => {
    try {
      clearError();
      
      const transaction = await createPayment({
        amount,
        currency: 'MYR',
        method: 'fpx',
        purpose: invoiceId ? 'invoice_payment' : 'project_payment',
        description,
        userId: 'current-user', // Get from auth store
        userType: 'client',
        projectId,
        invoiceId,
        metadata: {
          buyerName: data.buyerName,
          buyerEmail: data.buyerEmail,
          buyerPhone: data.buyerPhone,
          buyerBankId: data.buyerBankId
        }
      });
      
      // Redirect to FPX payment page
      // In production, this would redirect to the actual FPX URL
      console.log('Redirecting to FPX...', transaction);
      
      if (onSuccess) {
        onSuccess(transaction.id);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing Fee</span>
              <span>{formatCurrency(fees.gateway + fees.processing)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SST (6%)</span>
              <span>{formatCurrency(fees.sst)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FPX Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              FPX Online Banking
            </CardTitle>
            <CardDescription>
              Pay securely through your Malaysian bank account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buyer Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buyerName">Full Name *</Label>
                <Input
                  id="buyerName"
                  placeholder="As per bank account"
                  {...register('buyerName')}
                  disabled={isProcessing}
                />
                {errors.buyerName && (
                  <p className="text-sm text-destructive">{errors.buyerName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Email Address *</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  placeholder="your@email.com"
                  {...register('buyerEmail')}
                  disabled={isProcessing}
                />
                {errors.buyerEmail && (
                  <p className="text-sm text-destructive">{errors.buyerEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buyerPhone">Phone Number *</Label>
                <Input
                  id="buyerPhone"
                  placeholder="012-3456789"
                  {...register('buyerPhone')}
                  disabled={isProcessing}
                />
                {errors.buyerPhone && (
                  <p className="text-sm text-destructive">{errors.buyerPhone.message}</p>
                )}
              </div>
            </div>

            {/* Bank Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Your Bank *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshFPXBanks()}
                  disabled={isLoadingBanks}
                >
                  <RefreshCw className={cn(
                    "w-4 h-4 mr-1",
                    isLoadingBanks && "animate-spin"
                  )} />
                  Refresh Banks
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  disabled={isProcessing}
                />
              </div>
              
              {isLoadingBanks ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px] border rounded-lg p-2">
                  <RadioGroup
                    value={selectedBank}
                    onValueChange={(value) => {
                      setSelectedBank(value);
                      setValue('buyerBankId', value, { shouldValidate: true });
                    }}
                    disabled={isProcessing}
                  >
                    {/* Popular Banks */}
                    {popularBanksList.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-muted-foreground px-2">
                          Popular Banks
                        </p>
                        {popularBanksList.map((bank) => (
                          <BankOption key={bank.code} bank={bank} />
                        ))}
                      </div>
                    )}
                    
                    {/* Other Banks */}
                    {otherBanksList.length > 0 && (
                      <div className="space-y-2">
                        {popularBanksList.length > 0 && (
                          <p className="text-sm font-medium text-muted-foreground px-2">
                            Other Banks
                          </p>
                        )}
                        {(showAllBanks ? otherBanksList : otherBanksList.slice(0, 5)).map((bank) => (
                          <BankOption key={bank.code} bank={bank} />
                        ))}
                        
                        {!showAllBanks && otherBanksList.length > 5 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllBanks(true)}
                            className="w-full"
                          >
                            Show {otherBanksList.length - 5} more banks
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {filteredBanks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No banks found matching "{searchTerm}"
                      </div>
                    )}
                  </RadioGroup>
                </ScrollArea>
              )}
              
              {errors.buyerBankId && (
                <p className="text-sm text-destructive">{errors.buyerBankId.message}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  {...register('agreeToTerms')}
                  className="mt-1"
                  disabled={isProcessing}
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary hover:underline" target="_blank">
                    Terms and Conditions
                  </a>
                  {' '}and authorize this payment transaction
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <strong>Secure Payment:</strong> You will be redirected to your bank's secure payment page.
            Your banking credentials are never stored or accessed by our system.
          </AlertDescription>
        </Alert>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isValid || isProcessing || !selectedBank}
            className="min-w-[150px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay {formatCurrency(totalAmount)}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Bank Option Component
const BankOption: React.FC<{ bank: FPXBank }> = ({ bank }) => {
  return (
    <Label
      htmlFor={bank.code}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
        "hover:bg-muted",
        bank.status === 'offline' && "opacity-50 cursor-not-allowed"
      )}
    >
      <RadioGroupItem 
        value={bank.code} 
        id={bank.code}
        disabled={bank.status === 'offline'}
      />
      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {bank.logo ? (
            <img src={bank.logo} alt={bank.name} className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          )}
          <span className="font-medium">{bank.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {bank.status === 'online' ? (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Online
            </Badge>
          ) : bank.status === 'maintenance' ? (
            <Badge variant="outline" className="text-yellow-600">
              <Clock className="w-3 h-3 mr-1" />
              Maintenance
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>
    </Label>
  );
};