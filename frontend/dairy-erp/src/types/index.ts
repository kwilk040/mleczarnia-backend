// ============================================
// TYPES BASED ON UML SPECIFICATION
// ============================================

// User roles in the system
export type UserRole = 'CLIENT' | 'WAREHOUSE' | 'STAFF' | 'ADMIN';

// Order statuses
export type OrderStatus = 'NEW' | 'IN_PREPARATION' | 'SHIPPED' | 'INVOICED' | 'CANCELLED';

// Invoice statuses
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE';

// Stock movement types
export type MovementType = 'INBOUND' | 'DISPATCH' | 'RETURN' | 'LOSS' | 'ADJUSTMENT';

// Address types
export type AddressType = 'BILLING' | 'SHIPPING';

// Customer status
export type CustomerStatus = 'aktywny' | 'nieaktywny' | 'ryzyko';

// ============================================
// TABLE: CustomerCompany
// ============================================
export interface CustomerCompany {
  id: number;
  name: string;
  taxId: string; // NIP
  mainEmail: string;
  phone: string | null;
  isActive: boolean;
  riskFlag: boolean;
  createdAt: Date;
  // Virtual fields for display
  status?: CustomerStatus;
  addresses?: CompanyAddress[];
  users?: UserAccount[];
  orders?: Order[];
}

// ============================================
// TABLE: CompanyAddress
// ============================================
export interface CompanyAddress {
  id: number;
  customerCompanyId: number;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  type: AddressType;
}

// ============================================
// TABLE: Employee
// ============================================
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  active: boolean;
  hiredAt: Date;
  // Virtual field
  isAtWork?: boolean;
}

// ============================================
// TABLE: UserAccount
// ============================================
export interface UserAccount {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  customerCompanyId: number | null;
  employeeId: number | null;
  // Virtual fields
  employee?: Employee;
  customerCompany?: CustomerCompany;
}

// ============================================
// TABLE: Product
// ============================================
export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  defaultPrice: number;
  isActive: boolean;
  // Virtual field
  stock?: Stock;
}

// ============================================
// TABLE: Order
// ============================================
export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  orderDate: Date;
  status: OrderStatus;
  totalAmount: number;
  // Virtual fields
  customer?: CustomerCompany;
  items?: OrderItem[];
  invoice?: Invoice;
}

// ============================================
// TABLE: OrderItem
// ============================================
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  // Virtual field
  product?: Product;
}

// ============================================
// TABLE: Invoice
// ============================================
export interface Invoice {
  id: number;
  orderId: number;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  status: InvoiceStatus;
  pdfFilePath: string;
  // Virtual fields
  order?: Order;
}

// ============================================
// TABLE: Stock
// ============================================
export interface Stock {
  id: number;
  productId: number;
  quantity: number;
  minQuantity: number;
  // Virtual fields
  product?: Product;
  damagedQuantity?: number;
  returnedQuantity?: number;
}

// ============================================
// TABLE: StockMovement
// ============================================
export interface StockMovement {
  id: number;
  productId: number;
  quantityChange: number;
  movementType: MovementType;
  relatedOrderId: number | null;
  reason: string | null;
  createdAt: Date;
  employeeId: number | null;
  // Virtual fields
  product?: Product;
  employee?: Employee;
  order?: Order;
}


// ============================================
// AUTH CONTEXT TYPE
// ============================================
export interface AuthState {
  user: UserAccount | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}


