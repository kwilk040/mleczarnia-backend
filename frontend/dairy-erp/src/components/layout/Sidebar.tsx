import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Milk,
  ShoppingCart,
  FileText,
  Users,
  Package,
  Warehouse,
  UserCog,
  Building2,
  LogOut,
  ChevronRight,
  History,
} from 'lucide-react';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  // Staff & Admin
  { label: 'Zamówienia', path: '/orders', icon: <ShoppingCart size={18} />, roles: ['ADMIN', 'STAFF'] },
  { label: 'Faktury', path: '/invoices', icon: <FileText size={18} />, roles: ['ADMIN', 'STAFF'] },
  { label: 'Klienci', path: '/customers', icon: <Building2 size={18} />, roles: ['ADMIN', 'STAFF'] },
  { label: 'Produkty', path: '/products', icon: <Package size={18} />, roles: ['ADMIN', 'STAFF'] },
  
  // Warehouse
  { label: 'Magazyn', path: '/warehouse', icon: <Warehouse size={18} />, roles: ['ADMIN', 'WAREHOUSE'] },
  { label: 'Ruchy magazynowe', path: '/warehouse/movements', icon: <History size={18} />, roles: ['ADMIN', 'WAREHOUSE'] },
  
  // Admin only
  { label: 'Użytkownicy', path: '/users', icon: <UserCog size={18} />, roles: ['ADMIN'] },
  
  // Client
  { label: 'Nowe zamówienie', path: '/client/new-order', icon: <ShoppingCart size={18} />, roles: ['CLIENT'] },
  { label: 'Moje zamówienia', path: '/client/orders', icon: <History size={18} />, roles: ['CLIENT'] },
  { label: 'Moje faktury', path: '/client/invoices', icon: <FileText size={18} />, roles: ['CLIENT'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const getRoleName = (role: UserRole): string => {
    const names: Record<UserRole, string> = {
      ADMIN: 'Administrator',
      STAFF: 'Pracownik',
      WAREHOUSE: 'Magazynier',
      CLIENT: 'Klient',
    };
    return names[role];
  };

  const getRoleColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'bg-violet-100 text-violet-700',
      STAFF: 'bg-sky-100 text-sky-700',
      WAREHOUSE: 'bg-amber-100 text-amber-700',
      CLIENT: 'bg-emerald-100 text-emerald-700',
    };
    return colors[role];
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Logo */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-700 rounded-xl">
            <Milk size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Mleczarnia</h1>
            <p className="text-xs text-gray-400">System ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                <ChevronRight 
                  size={14} 
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" 
                />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200">
        <div className="p-2 bg-gray-50 rounded-lg mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.employee 
                  ? `${user.employee.firstName} ${user.employee.lastName}`
                  : user?.customerCompany?.name || user?.email
                }
              </p>
              <span className={`inline-flex text-xs px-1.5 py-0.5 rounded-full ${getRoleColor(user?.role || 'CLIENT')}`}>
                {getRoleName(user?.role || 'CLIENT')}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
            text-gray-600 hover:text-red-600 hover:bg-red-50
            transition-colors duration-200 text-sm"
        >
          <LogOut size={16} />
          <span>Wyloguj</span>
        </button>
      </div>
    </aside>
  );
};
