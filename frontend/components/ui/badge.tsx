import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variantStyles = {
    default: "border-transparent bg-primary text-white hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-white hover:bg-secondary/80",
    destructive: "border-transparent bg-error text-white hover:bg-error/80",
    outline: "text-foreground",
    success: "border-transparent bg-success text-white hover:bg-success/80",
    warning: "border-transparent bg-warning text-white hover:bg-warning/80",
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} {...props} />
  );
}

export { Badge };
