import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative overflow-hidden rounded-xl">
          {leftIcon && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl border bg-white
              text-gray-900 placeholder:text-gray-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
              text-base
              ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'}
              ${leftIcon ? 'pl-14 pr-6 py-3' : 'pl-8 pr-6 py-3'}
              ${rightIcon ? 'pr-14' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative overflow-hidden rounded-xl">
          <select
            ref={ref}
            className={`
              w-full pl-8 pr-6 py-3 rounded-xl border bg-white
              text-gray-900 text-base
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
              ${error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}
              ${className}
            `}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
