"use client";

import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-white text-slate-900 hover:bg-slate-100",
  outline: "border border-slate-700 text-white hover:bg-slate-900",
  ghost: "text-slate-200 hover:bg-slate-900",
  danger: "bg-rose-500 text-white hover:bg-rose-400"
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
