import { cn } from "@/lib/utils";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("text-xs font-medium uppercase tracking-[0.2em] text-ink-faint", className)}
      {...props}
    />
  );
}
