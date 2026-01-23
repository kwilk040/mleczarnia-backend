import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { CustomerStatusBadge } from '../components/ui/Badge';
import { Search, Plus, Eye, Edit, Building2, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { CustomerCompany, CustomerStatus } from '../types';
import { createCompany, listCompanies, listCompanyAddresses } from '../api/companies';
import { listOrders } from '../api/orders';

export const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCompany | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for adding new customer
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    taxId: '',
    mainEmail: '',
    phone: '',
    isActive: true,
    riskFlag: false,
    createUser: false,
    userEmail: '',
    userPassword: '',
  });

  // Load customers from API
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        const [apiCustomers, apiOrders] = await Promise.all([
          listCompanies(),
          listOrders(),
        ]);
        
        // Load addresses for each customer
        const customersWithData = await Promise.all(
          apiCustomers.map(async (customer) => {
            try {
              const addresses = await listCompanyAddresses(customer.id);
              const customerOrders = apiOrders.filter(order => order.customer?.id === customer.id);
              
              const status: CustomerStatus = customer.riskFlag ? 'ryzyko' : (customer.isActive ? 'aktywny' : 'nieaktywny');
              return {
                ...customer,
                phone: customer.phone || null,
                status,
                addresses: addresses,
                orders: customerOrders,
              };
            } catch (error) {
              console.error(`Błąd podczas ładowania danych dla klienta ${customer.id}:`, error);
              const status: CustomerStatus = customer.riskFlag ? 'ryzyko' : (customer.isActive ? 'aktywny' : 'nieaktywny');
              return {
                ...customer,
                phone: customer.phone || null,
                status,
                addresses: [],
                orders: [],
              };
            }
          })
        );
        
        setCustomers(customersWithData);
      } catch (error) {
        console.error('Błąd podczas ładowania klientów:', error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.taxId.includes(searchTerm) ||
      customer.mainEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'aktywny' && customer.isActive && !customer.riskFlag) ||
      (statusFilter === 'nieaktywny' && !customer.isActive) ||
      (statusFilter === 'ryzyko' && customer.riskFlag);
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (customer: CustomerCompany) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Building2 size={18} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{customer.name}</p>
            <p className="text-xs text-gray-500">Tax ID: {customer.taxId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (customer: CustomerCompany) => (
        <div>
          <p className="text-gray-900">{customer.mainEmail}</p>
          <p className="text-xs text-gray-500">{customer.phone || '-'}</p>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (customer: CustomerCompany) => {
        const orders = customer.orders || [];
        return (
          <span className="font-medium text-gray-900">{orders.length}</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer: CustomerCompany) => (
        <CustomerStatusBadge isActive={customer.isActive} riskFlag={customer.riskFlag} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Registration Date',
      render: (customer: CustomerCompany) => (
        <span className="text-gray-600">
          {new Date(customer.createdAt).toLocaleDateString('pl-PL')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (customer: CustomerCompany) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomer(customer);
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
              alert('Edit customer: ' + customer.name);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edytuj"
          >
            <Edit size={18} className="text-gray-500" />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'aktywny', label: 'Active' },
    { value: 'nieaktywny', label: 'Inactive' },
    { value: 'ryzyko', label: 'Risky' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Customers" 
        subtitle="Manage customer companies"
        action={
          <Button 
            leftIcon={<Plus size={18} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Customer
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
          <p className="text-green-100 text-sm">Total Customers</p>
          <p className="text-3xl font-bold mt-1">{customers.length}</p>
        </Card>
        <Card>
          <p className="text-gray-500 text-sm">Aktywnych</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {customers.filter(c => c.isActive && !c.riskFlag).length}
          </p>
        </Card>
        <Card>
          <p className="text-gray-500 text-sm">Inactive</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">
            {customers.filter(c => !c.isActive).length}
          </p>
        </Card>
        <Card className={customers.filter(c => c.riskFlag).length > 0 ? 'bg-red-50 border-red-200' : ''}>
          <p className="text-gray-500 text-sm">Risky</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {customers.filter(c => c.riskFlag).length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, Tax ID or email..."
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

      {/* Customers table */}
      <Card padding="none">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Ładowanie klientów...
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredCustomers}
            keyExtractor={(customer) => customer.id}
            onRowClick={(customer) => {
              setSelectedCustomer(customer);
              setIsDetailModalOpen(true);
            }}
            emptyMessage="No customers to display"
          />
        )}
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewCustomerForm({
            name: '',
            taxId: '',
            mainEmail: '',
            phone: '',
            isActive: true,
            riskFlag: false,
            createUser: false,
            userEmail: '',
            userPassword: '',
          });
        }}
        title="Dodaj nowego klienta"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nazwa firmy"
            value={newCustomerForm.name}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
            placeholder="Nazwa firmy"
            leftIcon={<Building2 size={18} />}
          />

          <Input
            label="Tax ID"
            value={newCustomerForm.taxId}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, taxId: e.target.value })}
            placeholder="1234567890"
          />

          <Input
            label="Email główny"
            type="email"
            value={newCustomerForm.mainEmail}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, mainEmail: e.target.value })}
            placeholder="kontakt@firma.pl"
            leftIcon={<Mail size={18} />}
          />

          <Input
            label="Telefon"
            type="tel"
            value={newCustomerForm.phone}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
            placeholder="+48 22 123 45 67"
            leftIcon={<Phone size={18} />}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input 
                type="checkbox" 
                id="isActiveNew"
                checked={newCustomerForm.isActive}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isActiveNew" className="text-sm text-gray-700">
                Klient aktywny
              </label>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input 
                type="checkbox" 
                id="riskFlagNew"
                checked={newCustomerForm.riskFlag}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, riskFlag: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="riskFlagNew" className="text-sm text-gray-700">
                Oznacz jako ryzykowny
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-4">
              <input 
                type="checkbox" 
                id="createUserCustomer"
                checked={newCustomerForm.createUser}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, createUser: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="createUserCustomer" className="text-sm font-medium text-gray-700">
                Create user account for this company
              </label>
            </div>

            {newCustomerForm.createUser && (
              <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                <Input
                  label="Email użytkownika"
                  type="email"
                  value={newCustomerForm.userEmail}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, userEmail: e.target.value })}
                  placeholder="email@firma.pl"
                  leftIcon={<Mail size={18} />}
                />

                <Input
                  label="Password"
                  type="password"
                  value={newCustomerForm.userPassword}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, userPassword: e.target.value })}
                  placeholder="Wprowadź hasło"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsAddModalOpen(false);
                setNewCustomerForm({
                  name: '',
                  taxId: '',
                  mainEmail: '',
                  phone: '',
                  isActive: true,
                  riskFlag: false,
                  createUser: false,
                  userEmail: '',
                  userPassword: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!newCustomerForm.name || !newCustomerForm.taxId || !newCustomerForm.mainEmail) {
                  alert('Please fill in all required fields (name, Tax ID, email)');
                  return;
                }
                
                // Walidacja emaila
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(newCustomerForm.mainEmail)) {
                  alert('Proszę podać poprawny adres email');
                  return;
                }
                
                if (newCustomerForm.createUser) {
                  if (!newCustomerForm.userEmail || !newCustomerForm.userPassword) {
                    alert('Proszę wypełnić dane konta użytkownika');
                    return;
                  }
                  if (!emailRegex.test(newCustomerForm.userEmail)) {
                    alert('Proszę podać poprawny adres email dla konta użytkownika');
                    return;
                  }
                  // TODO: Implementacja tworzenia użytkownika dla klienta
                  alert('Creating user account for customer is not yet implemented');
                  return;
                }

                setIsSubmitting(true);
                try {
                  await createCompany({
                    name: newCustomerForm.name,
                    taxId: newCustomerForm.taxId,
                    mainEmail: newCustomerForm.mainEmail,
                    phoneNumber: newCustomerForm.phone || undefined,
                    isActive: newCustomerForm.isActive,
                    riskFlag: newCustomerForm.riskFlag,
                  });
                  
                  setIsAddModalOpen(false);
                  setNewCustomerForm({
                    name: '',
                    taxId: '',
                    mainEmail: '',
                    phone: '',
                    isActive: true,
                    riskFlag: false,
                    createUser: false,
                    userEmail: '',
                    userPassword: '',
                  });
                  
                  // Odśwież listę klientów z API
                  try {
                    const [apiCustomers, apiOrders] = await Promise.all([
                      listCompanies(),
                      listOrders(),
                    ]);
                    
                    const customersWithData = await Promise.all(
                      apiCustomers.map(async (customer) => {
                        try {
                          const addresses = await listCompanyAddresses(customer.id);
                          const customerOrders = apiOrders.filter(order => order.customer?.id === customer.id);
                          
                          const status: CustomerStatus = customer.riskFlag ? 'ryzyko' : (customer.isActive ? 'aktywny' : 'nieaktywny');
                          return {
                            ...customer,
                            phone: customer.phone || null,
                            status,
                            addresses: addresses,
                            orders: customerOrders,
                          };
                        } catch (error) {
                          console.error(`Błąd podczas ładowania danych dla klienta ${customer.id}:`, error);
                          const status: CustomerStatus = customer.riskFlag ? 'ryzyko' : (customer.isActive ? 'aktywny' : 'nieaktywny');
                          return {
                            ...customer,
                            phone: customer.phone || null,
                            status,
                            addresses: [],
                            orders: [],
                          };
                        }
                      })
                    );
                    
                    setCustomers(customersWithData);
                  } catch (error) {
                    console.error('Błąd podczas odświeżania listy klientów:', error);
                  }
                } catch (error) {
                  console.error('Błąd podczas dodawania klienta:', error);
                  alert(`Błąd podczas dodawania klienta: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCustomer?.name || 'Customer Details'}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <CustomerStatusBadge 
                isActive={selectedCustomer.isActive} 
                riskFlag={selectedCustomer.riskFlag} 
              />
              {selectedCustomer.riskFlag && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-medium">Customer marked as risky</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <CardHeader title="Dane firmy" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tax ID</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.taxId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedCustomer.mainEmail}</p>
                    </div>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Telefon</p>
                        <p className="font-medium text-gray-900">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <CardHeader title="Addresses" />
                <div className="space-y-3">
                  {(selectedCustomer.addresses || [])
                    .map(address => (
                      <div key={address.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">
                            {address.type === 'BILLING' ? 'Adres fakturowy' : 'Adres dostawy'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{address.addressLine}</p>
                        <p className="text-sm text-gray-600">
                          {address.postalCode} {address.city}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div>
              <CardHeader 
                title="Statistics" 
                subtitle={`Customer since ${new Date(selectedCustomer.createdAt).toLocaleDateString('pl-PL')}`}
              />
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedCustomer.orders || []).length}
                  </p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedCustomer.orders || [])
                      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                      .toLocaleString('pl-PL')} zł
                  </p>
                  <p className="text-xs text-gray-500">Total Value</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedCustomer.orders || []).filter(o => o.status === 'INVOICED').length}
                  </p>
                  <p className="text-xs text-gray-500">Zrealizowanych</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Button>Edytuj dane</Button>
              {selectedCustomer.isActive ? (
                <Button variant="danger">Deactivate</Button>
              ) : (
                <Button variant="success">Activate</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

