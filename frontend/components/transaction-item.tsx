"use client";

import { Transaction } from "@/lib/types";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const getIcon = () => {
    switch (transaction.type) {
      case "buy":
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case "sell":
        return <TrendingDown className="h-5 w-5 text-error" />;
      case "earnings":
        return <TrendingUp className="h-5 w-5 text-success" />;
      case "stake":
        return <Zap className="h-5 w-5 text-warning" />;
      case "unstake":
        return <Zap className="h-5 w-5 text-muted" />;
      default:
        return null;
    }
  };

  const getTypeLabel = () => {
    switch (transaction.type) {
      case "buy":
        return "Bought Shares";
      case "sell":
        return "Sold Shares";
      case "earnings":
        return "Earnings Received";
      case "stake":
        return "Staked";
      case "unstake":
        return "Unstaked";
      default:
        return transaction.type;
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          {getIcon()}
        </div>
        <div>
          <p className="text-sm font-medium">{getTypeLabel()}</p>
          <p className="text-xs text-muted">{formatDateTime(transaction.timestamp)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold">{formatCurrency(transaction.amount)}</p>
          <Badge variant={transaction.status === "completed" ? "success" : "warning"} className="text-xs mt-1">
            {transaction.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
