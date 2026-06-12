import { cn } from "@/lib/utils";

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-transparent",
        className
      )}
    />
  );
}
