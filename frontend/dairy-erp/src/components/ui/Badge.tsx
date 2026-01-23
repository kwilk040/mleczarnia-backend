import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  purple: 'bg-violet-100 text-violet-700',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  purple: 'bg-violet-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant]}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

// Status badge helpers
export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    NEW: { variant: 'info', label: 'New' },
    IN_PREPARATION: { variant: 'warning', label: 'In Preparation' },
    SHIPPED: { variant: 'purple', label: 'Shipped' },
    INVOICED: { variant: 'success', label: 'Invoiced' },
    CANCELLED: { variant: 'danger', label: 'Cancelled' },
  };

  const { variant, label } = config[status] || { variant: 'default', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
};

export const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    UNPAID: { variant: 'warning', label: 'Unpaid' },
    PAID: { variant: 'success', label: 'Paid' },
    OVERDUE: { variant: 'danger', label: 'Overdue' },
  };

  const { variant, label } = config[status] || { variant: 'default', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
};

export const CustomerStatusBadge: React.FC<{ isActive: boolean; riskFlag: boolean }> = ({ isActive, riskFlag }) => {
  if (riskFlag) {
    return <Badge variant="danger" dot>Ryzyko</Badge>;
  }
  if (!isActive) {
    return <Badge variant="default" dot>Nieaktywny</Badge>;
  }
  return <Badge variant="success" dot>Aktywny</Badge>;
};
