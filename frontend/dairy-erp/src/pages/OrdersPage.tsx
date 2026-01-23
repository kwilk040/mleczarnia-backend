import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { OrderStatusBadge } from '../components/ui/Badge';
import { Search, Filter, Eye, Edit, Package } from 'lucide-react';
import { Order, OrderStatus, OrderItem, Product } from '../types';
import { listOrders, getOrderItems, updateOrderStatus } from '../api/orders';
import { getProduct } from '../api/products';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<number, OrderItem[]>>({});
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await listOrders();
        setOrders(data);
        
        // Załaduj produkty dla wszystkich zamówień
        const productIds = new Set<number>();
        for (const order of data) {
          const items = await getOrderItems(order.id);
          setOrderItems(prev => ({ ...prev, [order.id]: items }));
          items.forEach(item => productIds.add(item.productId));
        }
        
        // Załaduj szczegóły produktów
        const productsMap: Record<number, Product> = {};
        for (const productId of productIds) {
          try {
            const product = await getProduct(productId);
            productsMap[productId] = product;
          } catch {
            // Ignoruj błędy pojedynczych produktów
          }
        }
        setProducts(productsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading orders');
      } finally {
        setLoading(false);
      }
    }
    
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order Number',
      render: (order: Order) => (
        <span className="font-semibold text-gray-900">{order.orderNumber}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order: Order) => (
        <div>
          <p className="font-medium text-gray-900">{order.customer?.name}</p>
          <p className="text-xs text-gray-500">Tax ID: {order.customer?.taxId}</p>
        </div>
      ),
    },
    {
      key: 'orderDate',
      header: 'Date',
      render: (order: Order) => (
        <span className="text-gray-600">
          {new Date(order.orderDate).toLocaleDateString('pl-PL')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: Order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (order: Order) => (
        <span className="font-semibold text-gray-900">
          {order.totalAmount.toLocaleString('pl-PL')} zł
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
              setIsDetailModalOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Details"
          >
            <Eye size={18} className="text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
              setIsStatusModalOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zmień status"
          >
            <Edit size={18} className="text-gray-500" />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [    { value: 'all', label: 'All Statuses' },
    { value: 'NEW', label: 'New' },
    { value: 'IN_PREPARATION', label: 'In Preparation' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'INVOICED', label: 'Invoiced' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      NEW: 'border-l-sky-500',
      IN_PREPARATION: 'border-l-amber-500',
      SHIPPED: 'border-l-violet-500',
      INVOICED: 'border-l-emerald-500',
      CANCELLED: 'border-l-red-500',
    };
    return colors[status];
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Orders" subtitle="Manage customer orders" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Orders" subtitle="Manage customer orders" />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Zamówienia" 
        subtitle="Zarządzaj zamówieniami klientów"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {(['NEW', 'IN_PREPARATION', 'SHIPPED', 'INVOICED', 'CANCELLED'] as OrderStatus[]).map(status => {
          const count = orders.filter(o => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
              className={`
                p-4 rounded-xl border-l-4 bg-white transition-all
                ${getStatusColor(status)}
                ${statusFilter === status ? 'ring-2 ring-green-500 shadow-md' : 'hover:shadow-md'}
              `}
            >
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-1">
                {statusOptions.find(s => s.value === status)?.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Szukaj po numerze lub kliencie..."
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
          <Button variant="secondary" leftIcon={<Filter size={18} />}>
            Filtry
          </Button>
        </div>
      </Card>

      {/* Orders table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={filteredOrders}
          keyExtractor={(order) => order.id}
          onRowClick={(order) => {
            setSelectedOrder(order);
            setIsDetailModalOpen(true);
          }}
          emptyMessage="Brak zamówień do wyświetlenia"
        />
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900">{selectedOrder.customer?.name}</p>
                <p className="text-sm text-gray-500">Tax ID: {selectedOrder.customer?.taxId}</p>
              </div>
              <OrderStatusBadge status={selectedOrder.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedOrder.orderDate).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-bold text-lg text-gray-900">
                  {selectedOrder.totalAmount.toLocaleString('pl-PL')} zł
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-3">Products</p>
              <div className="space-y-2">
                {(orderItems[selectedOrder.id] || []).map(item => {
                  const product = products[item.productId];
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <Package size={18} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product?.name || `Product #${item.productId}`}</p>
                          <p className="text-xs text-gray-500">{product?.category || ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{item.quantity} {product?.unit || 'pcs'}</p>
                        <p className="text-sm text-gray-500">{typeof item.lineTotal === 'number' ? item.lineTotal.toLocaleString('pl-PL') : item.lineTotal} zł</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsDetailModalOpen(false);
                setIsStatusModalOpen(true);
              }}>
                Change Status
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Zmień status zamówienia"
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Change status for order <span className="font-semibold">{selectedOrder.orderNumber}</span>
            </p>
            
            <div className="space-y-2">
              {(['NEW', 'IN_PREPARATION', 'SHIPPED', 'INVOICED', 'CANCELLED'] as OrderStatus[]).map(status => (
                <button
                  key={status}
                  className={`
                    w-full p-3 rounded-xl text-left transition-all
                    ${selectedOrder.status === status 
                      ? 'bg-green-50 border-2 border-green-500' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }
                  `}
                  onClick={async () => {
                    if (!selectedOrder) return;
                    try {
                      await updateOrderStatus(selectedOrder.id, status);
                      // Odśwież listę zamówień
                      const updatedOrders = await listOrders();
                      setOrders(updatedOrders);
                      setSelectedOrder(updatedOrders.find(o => o.id === selectedOrder.id) || null);
                      setIsStatusModalOpen(false);
                    } catch (err) {
                      alert(`Error: ${err instanceof Error ? err.message : 'Failed to change status'}`);
                    }
                  }}
                >
                  <OrderStatusBadge status={status} />
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

