import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { InvoiceStatusBadge } from '../components/ui/Badge';
import { Search, Download, Eye, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { Invoice } from '../types';
import { invoices, orders, customerCompanies } from '../data/mockData';

export const InvoicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Enrich invoices with order and customer data
  const enrichedInvoices = invoices.map(invoice => {
    const order = orders.find(o => o.id === invoice.orderId);
    const customer = order ? customerCompanies.find(c => c.id === order.customerId) : null;
    return { ...invoice, order, customer };
  });

  const filteredInvoices = enrichedInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.order?.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice Number',
      render: (invoice: typeof enrichedInvoices[0]) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText size={18} className="text-gray-500" />
          </div>
          <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (invoice: typeof enrichedInvoices[0]) => (
        <div>
          <p className="font-medium text-gray-900">{invoice.customer?.name || '-'}</p>
          <p className="text-xs text-gray-500">Order: {invoice.order?.orderNumber}</p>
        </div>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      render: (invoice: Invoice) => (
        <span className="text-gray-600">
          {new Date(invoice.issueDate).toLocaleDateString('pl-PL')}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (invoice: Invoice) => {
        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {new Date(invoice.dueDate).toLocaleDateString('pl-PL')}
            {isOverdue && <AlertTriangle size={14} className="inline ml-1" />}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice: Invoice) => <InvoiceStatusBadge status={invoice.status} />,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (invoice: Invoice) => (
        <span className="font-semibold text-gray-900">
          {invoice.totalAmount.toLocaleString('pl-PL')} zł
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (invoice: typeof enrichedInvoices[0]) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInvoice(invoice);
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
              alert('Pobieranie PDF: ' + invoice.pdfFilePath);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download size={18} className="text-gray-500" />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'UNPAID', label: 'Unpaid' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

  const totalUnpaid = enrichedInvoices
    .filter(i => i.status !== 'PAID')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Invoices" 
        subtitle="Manage invoices and payments"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
          <p className="text-emerald-100 text-sm">Paid</p>
          <p className="text-3xl font-bold mt-1">
            {invoices.filter(i => i.status === 'PAID').length}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-700 text-white border-0">
          <p className="text-amber-100 text-sm">Unpaid</p>
          <p className="text-3xl font-bold mt-1">
            {invoices.filter(i => i.status === 'UNPAID').length}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-700 text-white border-0">
          <p className="text-red-100 text-sm">Overdue</p>
          <p className="text-3xl font-bold mt-1">
            {invoices.filter(i => i.status === 'OVERDUE').length}
          </p>
        </Card>
        <Card>
          <p className="text-gray-500 text-sm">Total to Pay</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalUnpaid.toLocaleString('pl-PL')} zł
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by invoice number, customer..."
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

      {/* Invoices table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={filteredInvoices}
          keyExtractor={(invoice) => invoice.id}
          onRowClick={(invoice) => {
            setSelectedInvoice(invoice);
            setIsDetailModalOpen(true);
          }}
          emptyMessage="No invoices to display"
        />
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Invoice ${selectedInvoice?.invoiceNumber}`}
        size="md"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <InvoiceStatusBadge status={selectedInvoice.status} />
              <Button 
                variant="secondary" 
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => alert('Pobieranie PDF...')}
              >
                Download PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900">
                  {(selectedInvoice as typeof enrichedInvoices[0]).customer?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nr zamówienia</p>
                <p className="font-medium text-gray-900">
                  {(selectedInvoice as typeof enrichedInvoices[0]).order?.orderNumber || '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Issue Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedInvoice.issueDate).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Amount to Pay</p>
              <p className="text-3xl font-bold text-gray-900">
                {selectedInvoice.totalAmount.toLocaleString('pl-PL')} zł
              </p>
            </div>

            {selectedInvoice.status !== 'PAID' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="success" 
                  className="flex-1"
                  onClick={() => {
                    alert('Faktura oznaczona jako opłacona');
                    setIsDetailModalOpen(false);
                  }}
                >
                  Mark as Paid
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

