import { cn } from "@/utils/cn";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlighted";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 shadow-sm",
        variant === "default" && "bg-white border border-gray-200",
        variant === "highlighted" && "bg-emerald-50 border-2 border-emerald-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
