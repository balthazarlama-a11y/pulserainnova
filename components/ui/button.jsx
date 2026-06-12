"use client";

import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand text-ink-on-accent hover:opacity-90",
  outline: "border border-line text-ink hover:bg-surface",
  ghost: "text-ink-muted hover:bg-surface hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90"
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base"
};

export const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-full font-medium transition",
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      className
    );

    if (asChild) {
      const child = React.Children.only(children);
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
        ...props
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
