import {
  CustomerCompany,
  CompanyAddress,
  Employee,
  UserAccount,
  Product,
  Order,
  OrderItem,
  Invoice,
  Stock,
  StockMovement,} from '../types';

// ============================================
// EMPLOYEES (Our company staff)
// ============================================
export const employees: Employee[] = [
  { id: 1, firstName: 'Jan', lastName: 'Kowalski', position: 'Administrator', active: true, hiredAt: new Date('2020-01-15'), isAtWork: true },
  { id: 2, firstName: 'Anna', lastName: 'Nowak', position: 'Księgowa', active: true, hiredAt: new Date('2019-05-20'), isAtWork: true },
  { id: 3, firstName: 'Piotr', lastName: 'Wiśniewski', position: 'Magazynier', active: true, hiredAt: new Date('2021-03-10'), isAtWork: true },
  { id: 4, firstName: 'Maria', lastName: 'Dąbrowska', position: 'Magazynier', active: true, hiredAt: new Date('2022-07-01'), isAtWork: false },
  { id: 5, firstName: 'Tomasz', lastName: 'Lewandowski', position: 'Specjalista ds. sprzedaży', active: true, hiredAt: new Date('2021-11-15'), isAtWork: true },
  { id: 6, firstName: 'Katarzyna', lastName: 'Wójcik', position: 'Kierownik magazynu', active: true, hiredAt: new Date('2018-02-28'), isAtWork: true },
  { id: 7, firstName: 'Michał', lastName: 'Kamiński', position: 'Magazynier', active: false, hiredAt: new Date('2020-09-01') },
];

// ============================================
// CUSTOMER COMPANIES
// ============================================
export const customerCompanies: CustomerCompany[] = [
  { id: 1, name: 'Delikatesy Świeżość Sp. z o.o.', taxId: '1234567890', mainEmail: 'kontakt@swiezosc.pl', phone: '+48 22 123 45 67', isActive: true, riskFlag: false, createdAt: new Date('2023-01-15') },
  { id: 2, name: 'Sklepy Mleczne "Krówka" S.A.', taxId: '9876543210', mainEmail: 'zamowienia@krowka.pl', phone: '+48 12 987 65 43', isActive: true, riskFlag: false, createdAt: new Date('2022-06-20') },
  { id: 3, name: 'Hurtownia Spożywcza Max', taxId: '5555666677', mainEmail: 'biuro@maxhurt.pl', phone: '+48 71 555 66 77', isActive: true, riskFlag: true, createdAt: new Date('2023-03-10') },
  { id: 4, name: 'Restauracje Smacznego Sp. z o.o.', taxId: '1112223334', mainEmail: 'zaopatrzenie@smacznego.pl', phone: '+48 61 111 22 33', isActive: true, riskFlag: false, createdAt: new Date('2023-08-05') },
  { id: 5, name: 'Piekarnia Złoty Kłos', taxId: '4443332221', mainEmail: 'piekarnia@zlotyklos.pl', phone: '+48 42 444 33 22', isActive: false, riskFlag: false, createdAt: new Date('2022-11-30') },
  { id: 6, name: 'Cukiernia Słodki Raj', taxId: '7778889990', mainEmail: 'slodkiraj@email.pl', phone: '+48 32 777 88 99', isActive: true, riskFlag: false, createdAt: new Date('2024-01-10') },
];

// ============================================
// COMPANY ADDRESSES
// ============================================
export const companyAddresses: CompanyAddress[] = [
  { id: 1, customerCompanyId: 1, addressLine: 'ul. Handlowa 15', city: 'Warszawa', postalCode: '00-001', country: 'Polska', type: 'BILLING' },
  { id: 2, customerCompanyId: 1, addressLine: 'ul. Magazynowa 8', city: 'Warszawa', postalCode: '00-123', country: 'Polska', type: 'SHIPPING' },
  { id: 3, customerCompanyId: 2, addressLine: 'ul. Mleczna 42', city: 'Kraków', postalCode: '30-001', country: 'Polska', type: 'BILLING' },
  { id: 4, customerCompanyId: 2, addressLine: 'ul. Mleczna 42', city: 'Kraków', postalCode: '30-001', country: 'Polska', type: 'SHIPPING' },
  { id: 5, customerCompanyId: 3, addressLine: 'ul. Hurtowa 100', city: 'Wrocław', postalCode: '50-001', country: 'Polska', type: 'BILLING' },
  { id: 6, customerCompanyId: 3, addressLine: 'ul. Logistyczna 25', city: 'Wrocław', postalCode: '50-200', country: 'Polska', type: 'SHIPPING' },
  { id: 7, customerCompanyId: 4, addressLine: 'ul. Gastronomiczna 7', city: 'Poznań', postalCode: '60-001', country: 'Polska', type: 'BILLING' },
  { id: 8, customerCompanyId: 5, addressLine: 'ul. Piekarska 22', city: 'Łódź', postalCode: '90-001', country: 'Polska', type: 'BILLING' },
  { id: 9, customerCompanyId: 6, addressLine: 'ul. Cukiernicza 5', city: 'Katowice', postalCode: '40-001', country: 'Polska', type: 'BILLING' },
];

// ============================================
// USER ACCOUNTS
// ============================================
export const userAccounts: UserAccount[] = [
  // Admin
  { id: 1, email: 'admin@mleczarnia.pl', passwordHash: 'admin123', role: 'ADMIN', isActive: true, lastLoginAt: new Date('2024-12-10'), customerCompanyId: null, employeeId: 1 },
  // Staff
  { id: 2, email: 'anna.nowak@mleczarnia.pl', passwordHash: 'staff123', role: 'STAFF', isActive: true, lastLoginAt: new Date('2024-12-10'), customerCompanyId: null, employeeId: 2 },
  { id: 3, email: 'tomasz.lewandowski@mleczarnia.pl', passwordHash: 'staff123', role: 'STAFF', isActive: true, lastLoginAt: new Date('2024-12-09'), customerCompanyId: null, employeeId: 5 },
  // Warehouse
  { id: 4, email: 'piotr.wisniewski@mleczarnia.pl', passwordHash: 'magazyn123', role: 'WAREHOUSE', isActive: true, lastLoginAt: new Date('2024-12-10'), customerCompanyId: null, employeeId: 3 },
  { id: 5, email: 'katarzyna.wojcik@mleczarnia.pl', passwordHash: 'magazyn123', role: 'WAREHOUSE', isActive: true, lastLoginAt: new Date('2024-12-10'), customerCompanyId: null, employeeId: 6 },
  // Clients
  { id: 6, email: 'kontakt@swiezosc.pl', passwordHash: 'klient123', role: 'CLIENT', isActive: true, lastLoginAt: new Date('2024-12-08'), customerCompanyId: 1, employeeId: null },
  { id: 7, email: 'zamowienia@krowka.pl', passwordHash: 'klient123', role: 'CLIENT', isActive: true, lastLoginAt: new Date('2024-12-09'), customerCompanyId: 2, employeeId: null },
  { id: 8, email: 'biuro@maxhurt.pl', passwordHash: 'klient123', role: 'CLIENT', isActive: true, lastLoginAt: new Date('2024-12-07'), customerCompanyId: 3, employeeId: null },
  { id: 9, email: 'zaopatrzenie@smacznego.pl', passwordHash: 'klient123', role: 'CLIENT', isActive: true, lastLoginAt: new Date('2024-12-10'), customerCompanyId: 4, employeeId: null },
];

// ============================================
// PRODUCTS
// ============================================
export const products: Product[] = [
  { id: 1, name: 'Mleko 2% 1L (paleta 480szt)', category: 'Mleko', unit: 'paleta', defaultPrice: 1920.00, isActive: true },
  { id: 2, name: 'Mleko 3.2% 1L (paleta 480szt)', category: 'Mleko', unit: 'paleta', defaultPrice: 2016.00, isActive: true },
  { id: 3, name: 'Jogurt naturalny 400g (paleta 600szt)', category: 'Jogurty', unit: 'paleta', defaultPrice: 2400.00, isActive: true },
  { id: 4, name: 'Jogurt truskawkowy 150g (paleta 1200szt)', category: 'Jogurty', unit: 'paleta', defaultPrice: 3600.00, isActive: true },
  { id: 5, name: 'Jogurt grecki 400g (paleta 600szt)', category: 'Jogurty', unit: 'paleta', defaultPrice: 3000.00, isActive: true },
  { id: 6, name: 'Serek wiejski 200g (paleta 800szt)', category: 'Serki', unit: 'paleta', defaultPrice: 2800.00, isActive: true },
  { id: 7, name: 'Serek homogenizowany 150g (paleta 1000szt)', category: 'Serki', unit: 'paleta', defaultPrice: 2500.00, isActive: true },
  { id: 8, name: 'Masło extra 200g (paleta 600szt)', category: 'Masło', unit: 'paleta', defaultPrice: 4200.00, isActive: true },
  { id: 9, name: 'Masło klarowane 500g (paleta 400szt)', category: 'Masło', unit: 'paleta', defaultPrice: 4800.00, isActive: true },
  { id: 10, name: 'Śmietana 18% 400ml (paleta 720szt)', category: 'Śmietana', unit: 'paleta', defaultPrice: 2880.00, isActive: true },
  { id: 11, name: 'Śmietana 30% 200ml (paleta 960szt)', category: 'Śmietana', unit: 'paleta', defaultPrice: 3360.00, isActive: true },
  { id: 12, name: 'Kefir 1L (paleta 480szt)', category: 'Napoje', unit: 'paleta', defaultPrice: 1680.00, isActive: true },
];

// ============================================
// STOCK
// ============================================
export const stocks: Stock[] = [
  { id: 1, productId: 1, quantity: 45, minQuantity: 10, damagedQuantity: 2, returnedQuantity: 1 },
  { id: 2, productId: 2, quantity: 38, minQuantity: 10, damagedQuantity: 0, returnedQuantity: 0 },
  { id: 3, productId: 3, quantity: 8, minQuantity: 15, damagedQuantity: 1, returnedQuantity: 2 },
  { id: 4, productId: 4, quantity: 52, minQuantity: 20, damagedQuantity: 0, returnedQuantity: 0 },
  { id: 5, productId: 5, quantity: 23, minQuantity: 10, damagedQuantity: 0, returnedQuantity: 1 },
  { id: 6, productId: 6, quantity: 31, minQuantity: 10, damagedQuantity: 1, returnedQuantity: 0 },
  { id: 7, productId: 7, quantity: 5, minQuantity: 15, damagedQuantity: 0, returnedQuantity: 0 },
  { id: 8, productId: 8, quantity: 18, minQuantity: 8, damagedQuantity: 0, returnedQuantity: 0 },
  { id: 9, productId: 9, quantity: 12, minQuantity: 5, damagedQuantity: 1, returnedQuantity: 0 },
  { id: 10, productId: 10, quantity: 27, minQuantity: 10, damagedQuantity: 0, returnedQuantity: 1 },
  { id: 11, productId: 11, quantity: 15, minQuantity: 8, damagedQuantity: 0, returnedQuantity: 0 },
  { id: 12, productId: 12, quantity: 42, minQuantity: 12, damagedQuantity: 2, returnedQuantity: 0 },
];

// ============================================
// ORDERS
// ============================================
export const orders: Order[] = [
  { id: 1, orderNumber: 'ZAM/2024/0001', customerId: 1, orderDate: new Date('2024-12-01'), status: 'INVOICED', totalAmount: 12960.00 },
  { id: 2, orderNumber: 'ZAM/2024/0002', customerId: 2, orderDate: new Date('2024-12-03'), status: 'SHIPPED', totalAmount: 19200.00 },
  { id: 3, orderNumber: 'ZAM/2024/0003', customerId: 3, orderDate: new Date('2024-12-05'), status: 'SHIPPED', totalAmount: 8400.00 },
  { id: 4, orderNumber: 'ZAM/2024/0004', customerId: 1, orderDate: new Date('2024-12-07'), status: 'IN_PREPARATION', totalAmount: 15120.00 },
  { id: 5, orderNumber: 'ZAM/2024/0005', customerId: 4, orderDate: new Date('2024-12-08'), status: 'NEW', totalAmount: 7200.00 },
  { id: 6, orderNumber: 'ZAM/2024/0006', customerId: 2, orderDate: new Date('2024-12-09'), status: 'NEW', totalAmount: 11520.00 },
  { id: 7, orderNumber: 'ZAM/2024/0007', customerId: 6, orderDate: new Date('2024-12-10'), status: 'NEW', totalAmount: 5600.00 },
  { id: 8, orderNumber: 'ZAM/2024/0008', customerId: 1, orderDate: new Date('2024-12-10'), status: 'NEW', totalAmount: 9600.00 },
  { id: 9, orderNumber: 'ZAM/2023/0045', customerId: 3, orderDate: new Date('2023-10-15'), status: 'CANCELLED', totalAmount: 4800.00 },
];

// ============================================
// ORDER ITEMS
// ============================================
export const orderItems: OrderItem[] = [
  // Order 1
  { id: 1, orderId: 1, productId: 1, quantity: 3, unitPrice: 1920.00, lineTotal: 5760.00 },
  { id: 2, orderId: 1, productId: 3, quantity: 2, unitPrice: 2400.00, lineTotal: 4800.00 },
  { id: 3, orderId: 1, productId: 10, quantity: 1, unitPrice: 2400.00, lineTotal: 2400.00 },
  // Order 2
  { id: 4, orderId: 2, productId: 2, quantity: 5, unitPrice: 2016.00, lineTotal: 10080.00 },
  { id: 5, orderId: 2, productId: 4, quantity: 2, unitPrice: 3600.00, lineTotal: 7200.00 },
  { id: 6, orderId: 2, productId: 12, quantity: 1, unitPrice: 1920.00, lineTotal: 1920.00 },
  // Order 3
  { id: 7, orderId: 3, productId: 8, quantity: 2, unitPrice: 4200.00, lineTotal: 8400.00 },
  // Order 4
  { id: 8, orderId: 4, productId: 1, quantity: 4, unitPrice: 1920.00, lineTotal: 7680.00 },
  { id: 9, orderId: 4, productId: 5, quantity: 2, unitPrice: 3000.00, lineTotal: 6000.00 },
  { id: 10, orderId: 4, productId: 12, quantity: 1, unitPrice: 1440.00, lineTotal: 1440.00 },
  // Order 5
  { id: 11, orderId: 5, productId: 3, quantity: 3, unitPrice: 2400.00, lineTotal: 7200.00 },
  // Order 6
  { id: 12, orderId: 6, productId: 6, quantity: 2, unitPrice: 2800.00, lineTotal: 5600.00 },
  { id: 13, orderId: 6, productId: 7, quantity: 2, unitPrice: 2500.00, lineTotal: 5000.00 },
  { id: 14, orderId: 6, productId: 12, quantity: 1, unitPrice: 920.00, lineTotal: 920.00 },
  // Order 7
  { id: 15, orderId: 7, productId: 6, quantity: 2, unitPrice: 2800.00, lineTotal: 5600.00 },
  // Order 8
  { id: 16, orderId: 8, productId: 1, quantity: 5, unitPrice: 1920.00, lineTotal: 9600.00 },
];

// ============================================
// INVOICES
// ============================================
export const invoices: Invoice[] = [
  { id: 1, orderId: 1, invoiceNumber: 'FV/2024/0001', issueDate: new Date('2024-12-01'), dueDate: new Date('2024-12-15'), totalAmount: 12960.00, status: 'PAID', pdfFilePath: '/invoices/FV_2024_0001.pdf' },
  { id: 2, orderId: 2, invoiceNumber: 'FV/2024/0002', issueDate: new Date('2024-12-03'), dueDate: new Date('2024-12-17'), totalAmount: 19200.00, status: 'UNPAID', pdfFilePath: '/invoices/FV_2024_0002.pdf' },
  { id: 3, orderId: 3, invoiceNumber: 'FV/2024/0003', issueDate: new Date('2024-12-05'), dueDate: new Date('2024-12-05'), totalAmount: 8400.00, status: 'OVERDUE', pdfFilePath: '/invoices/FV_2024_0003.pdf' },
];

// ============================================
// STOCK MOVEMENTS
// ============================================
export const stockMovements: StockMovement[] = [
  { id: 1, productId: 1, quantityChange: 50, movementType: 'INBOUND', relatedOrderId: null, reason: 'Dostawa od producenta', createdAt: new Date('2024-12-01'), employeeId: 3 },
  { id: 2, productId: 2, quantityChange: 40, movementType: 'INBOUND', relatedOrderId: null, reason: 'Dostawa od producenta', createdAt: new Date('2024-12-01'), employeeId: 3 },
  { id: 3, productId: 1, quantityChange: -3, movementType: 'DISPATCH', relatedOrderId: 1, reason: 'Zamówienie ZAM/2024/0001', createdAt: new Date('2024-12-02'), employeeId: 4 },
  { id: 4, productId: 3, quantityChange: -2, movementType: 'DISPATCH', relatedOrderId: 1, reason: 'Zamówienie ZAM/2024/0001', createdAt: new Date('2024-12-02'), employeeId: 4 },
  { id: 5, productId: 3, quantityChange: 2, movementType: 'RETURN', relatedOrderId: 1, reason: 'Zwrot z zamówienia #1 - uszkodzone opakowania', createdAt: new Date('2024-12-04'), employeeId: 3 },
  { id: 6, productId: 1, quantityChange: -2, movementType: 'LOSS', relatedOrderId: null, reason: 'Uszkodzone palety - wyciek', createdAt: new Date('2024-12-05'), employeeId: 6 },
  { id: 7, productId: 2, quantityChange: -5, movementType: 'DISPATCH', relatedOrderId: 2, reason: 'Zamówienie ZAM/2024/0002', createdAt: new Date('2024-12-06'), employeeId: 3 },
  { id: 8, productId: 4, quantityChange: -2, movementType: 'DISPATCH', relatedOrderId: 2, reason: 'Zamówienie ZAM/2024/0002', createdAt: new Date('2024-12-06'), employeeId: 3 },
  { id: 9, productId: 8, quantityChange: 20, movementType: 'INBOUND', relatedOrderId: null, reason: 'Dostawa od producenta', createdAt: new Date('2024-12-08'), employeeId: 4 },
  { id: 10, productId: 9, quantityChange: -1, movementType: 'LOSS', relatedOrderId: null, reason: 'Produkt po terminie', createdAt: new Date('2024-12-09'), employeeId: 6 },
  { id: 11, productId: 12, quantityChange: -2, movementType: 'LOSS', relatedOrderId: null, reason: 'Uszkodzone opakowania', createdAt: new Date('2024-12-10'), employeeId: 3 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getProductById = (id: number): Product | undefined => products.find(p => p.id === id);
export const getCustomerById = (id: number): CustomerCompany | undefined => customerCompanies.find(c => c.id === id);
export const getEmployeeById = (id: number): Employee | undefined => employees.find(e => e.id === id);
export const getOrderById = (id: number): Order | undefined => orders.find(o => o.id === id);
export const getStockByProductId = (productId: number): Stock | undefined => stocks.find(s => s.productId === productId);
export const getAddressesByCompanyId = (companyId: number): CompanyAddress[] => companyAddresses.filter(a => a.customerCompanyId === companyId);
export const getOrdersByCustomerId = (customerId: number): Order[] => orders.filter(o => o.customerId === customerId);
export const getOrderItemsByOrderId = (orderId: number): OrderItem[] => orderItems.filter(i => i.orderId === orderId);
export const getInvoiceByOrderId = (orderId: number): Invoice | undefined => invoices.find(i => i.orderId === orderId);
export const getMovementsByProductId = (productId: number): StockMovement[] => stockMovements.filter(m => m.productId === productId);

// Enrich data with relations
export const getEnrichedOrders = (): Order[] => {
  return orders.map(order => ({
    ...order,
    customer: getCustomerById(order.customerId),
    items: getOrderItemsByOrderId(order.id).map(item => ({
      ...item,
      product: getProductById(item.productId),
    })),
    invoice: getInvoiceByOrderId(order.id),
  }));
};

export const getEnrichedProducts = (): Product[] => {
  return products.map(product => ({
    ...product,
    stock: getStockByProductId(product.id),
  }));
};

export const getEnrichedCustomers = (): CustomerCompany[] => {
  return customerCompanies.map(company => ({
    ...company,
    addresses: getAddressesByCompanyId(company.id),
    orders: getOrdersByCustomerId(company.id),
    status: company.riskFlag ? 'ryzyko' : (company.isActive ? 'aktywny' : 'nieaktywny'),
  }));
};

