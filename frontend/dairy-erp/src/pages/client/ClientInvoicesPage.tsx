import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { InvoiceStatusBadge } from '../../components/ui/Badge';
import { Search, Download, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { invoices, orders } from '../../data/mockData';

export const ClientInvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const companyId = user?.customerCompanyId;
  
  // Get invoices for this company's orders
  const myInvoices = invoices
    .filter(invoice => {
      const order = orders.find(o => o.id === invoice.orderId);
      return order?.customerId === companyId;
    })
    .map(invoice => {
      const order = orders.find(o => o.id === invoice.orderId);
      return { ...invoice, order };
    })
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  const filteredInvoices = myInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.order?.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'UNPAID', label: 'Unpaid' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

  // Stats
  const stats = {
    all: myInvoices.length,
    unpaid: myInvoices.filter(i => i.status === 'UNPAID').length,
    overdue: myInvoices.filter(i => i.status === 'OVERDUE').length,
    toPay: myInvoices
      .filter(i => i.status !== 'PAID')
      .reduce((sum, i) => sum + i.totalAmount, 0),
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="My Invoices" 
        subtitle="View and download invoices"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-gray-500 text-sm">All Invoices</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.all}</p>
        </Card>
        <Card className={stats.unpaid > 0 ? 'bg-amber-50 border-amber-200' : ''}>
          <p className="text-gray-500 text-sm">Nieopłacone</p>
          <p className={`text-2xl font-bold mt-1 ${stats.unpaid > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {stats.unpaid}
          </p>
        </Card>
        <Card className={stats.overdue > 0 ? 'bg-red-50 border-red-200' : ''}>
          <p className="text-gray-500 text-sm">Overdue</p>
          <p className={`text-2xl font-bold mt-1 ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stats.overdue}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
          <p className="text-green-100 text-sm">To Pay</p>
          <p className="text-xl font-bold mt-1">{stats.toPay.toLocaleString('pl-PL')} zł</p>
        </Card>
      </div>

      {/* Overdue warning */}
      {stats.overdue > 0 && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">
                You have {stats.overdue} {stats.overdue === 1 ? 'overdue invoice' : 'overdue invoices'}
              </p>
              <p className="text-sm text-red-700">
                Prosimy o jak najszybsze uregulowanie płatności.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by invoice number or order..."
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

      {/* Invoices list */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nie znaleziono faktur</p>
          </Card>
        ) : (
          filteredInvoices.map(invoice => {
            const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';
            
            return (
              <Card 
                key={invoice.id} 
                className={isOverdue ? 'border-red-200 bg-red-50/50' : ''}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      invoice.status === 'PAID' 
                        ? 'bg-emerald-100' 
                        : isOverdue 
                          ? 'bg-red-100' 
                          : 'bg-amber-100'
                    }`}>
                      <FileText size={24} className={
                        invoice.status === 'PAID' 
                          ? 'text-emerald-600' 
                          : isOverdue 
                            ? 'text-red-600' 
                            : 'text-amber-600'
                      } />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-gray-900 text-lg">{invoice.invoiceNumber}</span>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                        Order: {invoice.order?.orderNumber}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Issued: {new Date(invoice.issueDate).toLocaleDateString('pl-PL')}
                        </span>
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                          <Calendar size={12} />
                          Due: {new Date(invoice.dueDate).toLocaleDateString('pl-PL')}
                          {isOverdue && <AlertTriangle size={12} />}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {invoice.totalAmount.toLocaleString('pl-PL')} zł
                      </p>
                      {invoice.status !== 'PAID' && (
                        <p className="text-xs text-gray-500">to pay</p>
                      )}
                    </div>
                    <Button 
                      variant="secondary" 
                      leftIcon={<Download size={18} />}
                      onClick={() => alert('Pobieranie PDF: ' + invoice.pdfFilePath)}
                    >
                      Pobierz PDF
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Payment info */}
      <Card className="mt-6 bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-200 rounded-lg">
            <FileText size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Payment Information</p>
            <p className="text-sm text-gray-600 mt-1">
              Payments should be made to the account number provided on the invoice. 
              Please include the invoice number in the transfer title.
              After payment is recorded, the invoice status will be automatically updated.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

