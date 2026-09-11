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

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-900 text-white hover:bg-brand-800 disabled:bg-brand-800/50",
  secondary: "bg-brand-100 text-brand-900 hover:bg-brand-200 disabled:bg-brand-100/50",
  ghost: "text-brand-600 hover:bg-brand-100 disabled:text-brand-300",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50",
  outline: "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 disabled:border-brand-100 disabled:text-brand-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs min-h-[32px] gap-1.5",
  md: "px-4 py-2 text-sm min-h-[40px] gap-2",
  lg: "px-5 py-2.5 text-sm min-h-[48px] gap-2 font-medium",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, iconRight, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-150
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${loading ? "opacity-80 cursor-wait" : "cursor-pointer"}
          ${disabled ? "cursor-not-allowed" : ""}
          ${variant === "outline" ? "border border-brand-200" : "rounded-xl"}
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
