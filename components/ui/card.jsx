import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-bg-elevated p-6 shadow-card",
        className
      )}
      {...props}
    />
  );
}
