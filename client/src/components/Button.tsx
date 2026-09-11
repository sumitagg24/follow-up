import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

// Slaky-style: black pill primary, hairline secondary, quiet ghost.
const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-900 text-white hover:bg-brand-800 disabled:bg-brand-300 shadow-none",
  secondary: "bg-white text-brand-900 border border-brand-200 hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50",
  ghost: "text-brand-600 hover:bg-brand-100 hover:text-brand-900 disabled:text-brand-300",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  outline: "border border-brand-200 bg-white text-brand-700 hover:border-brand-900 hover:text-brand-900 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs min-h-[32px] gap-1.5",
  md: "px-4 py-2 text-[13px] min-h-[38px] gap-2",
  lg: "px-5 py-2.5 text-sm min-h-[44px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, iconRight, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`
          inline-flex items-center justify-center font-semibold tracking-tight
          rounded-full whitespace-nowrap
          transition-colors duration-150
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${loading ? "opacity-80 cursor-wait" : "cursor-pointer"}
          ${disabled ? "cursor-not-allowed" : ""}
          ${className}
        `}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
        {icon && !loading && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
