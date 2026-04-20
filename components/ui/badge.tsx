import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[#1d4ed8]/30 text-[#93c5fd]",
        success: "bg-[#065f46]/40 text-[#6ee7b7]",
        warning: "bg-[#92400e]/35 text-[#fdba74]",
        danger: "bg-[#991b1b]/35 text-[#fca5a5]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
