// src/components/payments/PaymentListItem.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone } from "lucide-react";
import { IPaymentResponse } from "@/types/payment.types";

const paymentMethodIcons = {
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  MOBILE_MONEY: Smartphone,
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    case "refunded":
      return "outline";
    default:
      return "default";
  }
};

export default function PaymentListItem({
  payment,
}: {
  payment: IPaymentResponse;
}) {
  const PaymentIcon = paymentMethodIcons[payment.paymentMethod];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <PaymentIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">Payment #{payment.id}</p>
                <Badge
                  variant={getStatusColor(payment.status)}
                  className="text-xs"
                >
                  {payment.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {payment.paymentMethod.replace("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(payment.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-primary">
              {payment.currency} {payment.amount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Booking #{payment.bookingId}
            </p>
          </div>
        </div>
        {payment.transactionReference && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Ref: {payment.transactionReference}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
