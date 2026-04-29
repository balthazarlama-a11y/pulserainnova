import { cn } from "@/lib/utils";

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent",
        className
      )}
    />
  );
}
