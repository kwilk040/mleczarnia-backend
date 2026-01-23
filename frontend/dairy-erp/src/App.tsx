import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterCompanyPage } from './pages/RegisterCompanyPage';
import { OrdersPage } from './pages/OrdersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { WarehousePage } from './pages/WarehousePage';
import { StockMovementsPage } from './pages/StockMovementsPage';
import { UsersPage } from './pages/UsersPage';
import { NewOrderPage } from './pages/client/NewOrderPage';
import { ClientOrdersPage } from './pages/client/ClientOrdersPage';
import { ClientInvoicesPage } from './pages/client/ClientInvoicesPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-company" element={<RegisterCompanyPage />} />
          
          {/* Protected routes */}
          <Route element={<MainLayout />}>
            {/* Staff & Admin routes */}
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            
            {/* Warehouse routes */}
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/warehouse/movements" element={<StockMovementsPage />} />
            
            {/* Admin only routes */}
            <Route path="/users" element={<UsersPage />} />
            
            {/* Client routes */}
            <Route path="/client/new-order" element={<NewOrderPage />} />
            <Route path="/client/orders" element={<ClientOrdersPage />} />
            <Route path="/client/invoices" element={<ClientInvoicesPage />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
