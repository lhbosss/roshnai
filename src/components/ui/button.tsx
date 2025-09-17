import * as React from "react";

type Variant = "default" | "secondary" | "ghost";

export function Button({ className = "", variant = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<Variant, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 hover:bg-gray-200",
    ghost: "hover:bg-gray-100",
  };
  return <button className={`${base} px-3 py-2 ${variants[variant]} ${className}`} {...props} />;
}
