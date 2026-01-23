import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { Search, Package, Download, Eye, FileText } from 'lucide-react';
import { Order } from '../../types';
import { orders, getOrderItemsByOrderId, getProductById, getInvoiceByOrderId } from '../../data/mockData';

export const ClientOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const companyId = user?.customerCompanyId;
  const myOrders = orders
    .filter(o => o.customerId === companyId)
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  const filteredOrders = myOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'Wszystkie statusy' },
    { value: 'NEW', label: 'Nowe' },
    { value: 'IN_PREPARATION', label: 'W przygotowaniu' },
    { value: 'SHIPPED', label: 'Wysłane' },
    { value: 'INVOICED', label: 'Zafakturowane' },
    { value: 'CANCELLED', label: 'Anulowane' },
  ];

  // Stats
  const stats = {
    all: myOrders.length,
    pending: myOrders.filter(o => o.status === 'NEW' || o.status === 'IN_PREPARATION').length,
    completed: myOrders.filter(o => o.status === 'INVOICED').length,
    total: myOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Historia zamówień" 
        subtitle="Przeglądaj swoje zamówienia"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-gray-500 text-sm">Wszystkie zamówienia</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.all}</p>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <p className="text-amber-700 text-sm">W realizacji</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</p>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <p className="text-emerald-700 text-sm">Zrealizowane</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</p>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
          <p className="text-green-100 text-sm">Suma zamówień</p>
          <p className="text-xl font-bold mt-1">{stats.total.toLocaleString('pl-PL')} zł</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Szukaj po numerze zamówienia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nie znaleziono zamówień</p>
          </Card>
        ) : (
          filteredOrders.map(order => {
            const items = getOrderItemsByOrderId(order.id);
            const invoice = getInvoiceByOrderId(order.id);
            
            return (
              <Card key={order.id} hover className="cursor-pointer" onClick={() => {
                setSelectedOrder(order);
                setIsDetailModalOpen(true);
              }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900 text-lg">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString('pl-PL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {items.slice(0, 3).map(item => {
                        const product = getProductById(item.productId);
                        return (
                          <span 
                            key={item.id}
                            className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600"
                          >
                            {item.quantity}× {product?.name.split('(')[0].trim()}
                          </span>
                        );
                      })}
                      {items.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-400">
                          +{items.length - 3} więcej
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {order.totalAmount.toLocaleString('pl-PL')} zł
                      </p>
                      <p className="text-xs text-gray-500">{items.length} pozycji</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" leftIcon={<Eye size={16} />}>
                        Szczegóły
                      </Button>
                      {invoice && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          leftIcon={<Download size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Pobieranie faktury: ' + invoice.invoiceNumber);
                          }}
                        >
                          Faktura
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Zamówienie ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <OrderStatusBadge status={selectedOrder.status} />
              <span className="text-sm text-gray-500">
                {new Date(selectedOrder.orderDate).toLocaleDateString('pl-PL')}
              </span>
            </div>

            <div>
              <CardHeader title="Produkty" />
              <div className="space-y-3">
                {getOrderItemsByOrderId(selectedOrder.id).map(item => {
                  const product = getProductById(item.productId);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <Package size={18} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product?.name}</p>
                          <p className="text-xs text-gray-500">{product?.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{item.quantity} {product?.unit}</p>
                        <p className="text-sm text-gray-500">{item.lineTotal.toLocaleString('pl-PL')} zł</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Suma zamówienia</span>
                <span className="text-2xl font-bold text-gray-900">
                  {selectedOrder.totalAmount.toLocaleString('pl-PL')} zł
                </span>
              </div>
            </div>

            {/* Invoice section */}
            {(() => {
              const invoice = getInvoiceByOrderId(selectedOrder.id);
              if (invoice) {
                return (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-emerald-600" />
                        <div>
                          <p className="font-medium text-emerald-900">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-emerald-700">
                            Termin płatności: {new Date(invoice.dueDate).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        leftIcon={<Download size={16} />}
                        onClick={() => alert('Pobieranie PDF...')}
                      >
                        Pobierz PDF
                      </Button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Zamknij
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

