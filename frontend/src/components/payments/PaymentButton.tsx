// src/components/payments/PaymentButton.tsx
"use client";
import { useState } from "react";
import { useCreatePaymentMutation } from "@/redux/paymentApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Smartphone, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

const paymentMethods = [
  {
    value: "CREDIT_CARD",
    label: "Credit Card",
    icon: CreditCard,
    description: "Pay with your credit card",
  },
  {
    value: "DEBIT_CARD",
    label: "Debit Card",
    icon: CreditCard,
    description: "Pay with your debit card",
  },
  {
    value: "MOBILE_MONEY",
    label: "Mobile Money",
    icon: Smartphone,
    description: "Pay with mobile money",
  },
] as const;

type PaymentMethod = (typeof paymentMethods)[number]["value"];

interface IPaymentButtonProps {
  bookingId: number;
  amount: number;
  currency?: string;
  disabled?: boolean;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PaymentButton({
  bookingId,
  amount,
  currency = "GHS",
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
}: IPaymentButtonProps) {
  const [createPayment, { isLoading }] = useCreatePaymentMutation();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PaymentMethod | ""
  >("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      const result = await createPayment({
        bookingId,
        paymentMethod: selectedPaymentMethod,
      }).unwrap();

      if (result.data.authorization_url) {
        window.location.href = result.data.authorization_url;
      } else {
        toast.success("Payment initialized successfully");
      }

      setIsDialogOpen(false);
      setSelectedPaymentMethod("");
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment initialization failed");
    }
  };

  const selectedMethod = paymentMethods.find(
    (method) => method.value === selectedPaymentMethod
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isLoading}
          className={className}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Pay Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method to complete your booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Amount */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Amount to Pay:
                </span>
                <span className="text-lg font-semibold text-primary">
                  {currency} {amount.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={selectedPaymentMethod}
              onValueChange={(val) =>
                setSelectedPaymentMethod(val as PaymentMethod)
              }
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <method.icon className="h-4 w-4" />
                      <span>{method.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMethod && (
              <p className="text-xs text-muted-foreground">
                {selectedMethod.description}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || isLoading}
          >
            {isLoading
              ? "Processing..."
              : `Pay ${currency} ${amount.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
