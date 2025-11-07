// ==================== PAYMENT METHOD SELECTOR COMPONENT ====================

import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Receipt, 
  Banknote,
  Wallet,
  Info
} from 'lucide-react';
import { PaymentMethod } from '@/types/payment';
import { cn } from '@/lib/utils';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
  fees?: string;
  processingTime?: string;
  popular?: boolean;
  recommended?: boolean;
  providers?: string[];
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  amount: number;
  userType?: 'client' | 'contractor' | 'supplier' | 'staff';
  className?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodSelect,
  amount,
  userType = 'client',
  className
}) => {
  const [fees, setFees] = useState<Record<PaymentMethod, number>>({} as any);

  // Payment method options
  const paymentMethods: PaymentMethodOption[] = [
    {
      value: 'fpx',
      label: 'FPX Online Banking',
      description: 'Pay directly from your Malaysian bank account',
      icon: <Building2 className="w-5 h-5" />,
      fees: '1% + RM 1.00',
      processingTime: 'Instant',
      popular: true,
      providers: ['Maybank', 'CIMB', 'Public Bank', 'RHB', 'Hong Leong', 'AmBank', 'Bank Islam', 'Others']
    },
    {
      value: 'credit_card',
      label: 'Credit Card',
      description: 'Visa, Mastercard, American Express',
      icon: <CreditCard className="w-5 h-5" />,
      fees: '2.5%',
      processingTime: 'Instant',
      providers: ['Visa', 'Mastercard', 'AMEX']
    },
    {
      value: 'debit_card',
      label: 'Debit Card',
      description: 'Visa Debit, Mastercard Debit',
      icon: <CreditCard className="w-5 h-5" />,
      fees: '1.5%',
      processingTime: 'Instant',
      providers: ['Visa Debit', 'Mastercard Debit']
    },
    {
      value: 'ewallet_grab',
      label: 'GrabPay',
      description: 'Pay with your GrabPay wallet',
      icon: <Smartphone className="w-5 h-5" />,
      fees: '1.5%',
      processingTime: 'Instant',
      recommended: true
    },
    {
      value: 'ewallet_tng',
      label: "Touch 'n Go eWallet",
      description: 'Pay with your TNG eWallet',
      icon: <Wallet className="w-5 h-5" />,
      fees: '1.5%',
      processingTime: 'Instant',
      popular: true
    },
    {
      value: 'ewallet_boost',
      label: 'Boost',
      description: 'Pay with your Boost wallet',
      icon: <Smartphone className="w-5 h-5" />,
      fees: '1.8%',
      processingTime: 'Instant'
    },
    {
      value: 'ewallet_shopee',
      label: 'ShopeePay',
      description: 'Pay with your ShopeePay wallet',
      icon: <Smartphone className="w-5 h-5" />,
      fees: '1.8%',
      processingTime: 'Instant'
    },
    {
      value: 'jompay',
      label: 'JomPay',
      description: 'Pay via JomPay using your online banking',
      icon: <Receipt className="w-5 h-5" />,
      fees: 'No fees',
      processingTime: '1-2 business days'
    },
    {
      value: 'bank_transfer',
      label: 'Bank Transfer',
      description: 'Manual bank transfer or GIRO',
      icon: <Building2 className="w-5 h-5" />,
      fees: 'No fees',
      processingTime: '1-3 business days'
    },
    {
      value: 'duitnow',
      label: 'DuitNow',
      description: 'Instant transfer using DuitNow ID',
      icon: <Banknote className="w-5 h-5" />,
      fees: 'No fees',
      processingTime: 'Instant'
    }
  ];

  // Filter methods based on user type
  const availableMethods = paymentMethods.filter(method => {
    // Corporate methods for business users
    if (userType === 'contractor' || userType === 'supplier') {
      return !['ewallet_shopee'].includes(method.value);
    }
    return true;
  });

  // Calculate fees for each method
  useEffect(() => {
    const calculatedFees: Record<string, number> = {};
    
    availableMethods.forEach(method => {
      let fee = 0;
      
      switch (method.value) {
        case 'fpx':
          fee = amount * 0.01 + 1.00;
          break;
        case 'credit_card':
          fee = amount * 0.025;
          break;
        case 'debit_card':
          fee = amount * 0.015;
          break;
        case 'ewallet_grab':
        case 'ewallet_tng':
          fee = amount * 0.015;
          break;
        case 'ewallet_boost':
        case 'ewallet_shopee':
          fee = amount * 0.018;
          break;
        default:
          fee = 0;
      }
      
      calculatedFees[method.value] = fee;
    });
    
    setFees(calculatedFees as any);
  }, [amount]);

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={selectedMethod || ''}
        onValueChange={(value) => onMethodSelect(value as PaymentMethod)}
      >
        <div className="grid gap-3">
          {availableMethods.map((method) => (
            <Card
              key={method.value}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedMethod === method.value && "ring-2 ring-primary"
              )}
              onClick={() => onMethodSelect(method.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={method.value}
                    id={method.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-muted rounded-lg">
                          {method.icon}
                        </div>
                        <div>
                          <Label
                            htmlFor={method.value}
                            className="text-base font-medium cursor-pointer flex items-center gap-2"
                          >
                            {method.label}
                            {method.popular && (
                              <Badge variant="secondary" className="text-xs">
                                Popular
                              </Badge>
                            )}
                            {method.recommended && (
                              <Badge variant="default" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {method.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {fees[method.value] > 0 ? (
                          <div>
                            <p className="text-sm font-medium">
                              + RM {fees[method.value].toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Processing fee
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            No fees
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {selectedMethod === method.value && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-start space-x-2">
                          <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Processing time: {method.processingTime}</p>
                            {method.providers && (
                              <p>Supported: {method.providers.join(', ')}</p>
                            )}
                            {method.fees && (
                              <p>Fee structure: {method.fees}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>
      
      {selectedMethod && fees[selectedMethod] > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>RM {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing Fee</span>
                <span>RM {fees[selectedMethod].toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SST (6%)</span>
                <span>RM {(fees[selectedMethod] * 0.06).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Amount</span>
                  <span>
                    RM {(amount + fees[selectedMethod] + (fees[selectedMethod] * 0.06)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};