import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-brand-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full rounded-xl border bg-white px-3 py-2.5 pr-10 text-sm appearance-none cursor-pointer
              transition-all duration-150
              ${error
                ? "border-red-200 bg-red-50/50 focus:border-red-400 focus:ring-red-100"
                : "border-brand-200 focus:border-brand-400 focus:ring-brand-100"
              }
              ${props.disabled ? "bg-brand-50 text-brand-500 cursor-not-allowed" : "text-brand-900"}
              ${className}
              bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23475569%22%3E%3Cpath%20d%3D%22M5.5%208l4.5%204.5L17.5%207%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat
            `}
            aria-invalid={!!error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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

Select.displayName = "Select";
