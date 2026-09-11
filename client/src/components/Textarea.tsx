import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-brand-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full rounded-xl border bg-white px-3 py-2.5 text-sm resize-none
            transition-all duration-150
            placeholder:text-brand-400
            ${error
              ? "border-red-200 bg-red-50/50 focus:border-red-400 focus:ring-red-100"
              : "border-brand-200 focus:border-brand-400 focus:ring-brand-100"
            }
            ${props.disabled ? "bg-brand-50 text-brand-500 cursor-not-allowed" : "text-brand-900"}
            ${className}
          `}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" /></svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
