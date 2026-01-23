import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Search, ArrowDown, ArrowUp, RotateCcw, AlertTriangle, Settings } from 'lucide-react';
import { stockMovements, getProductById, getEmployeeById, getOrderById } from '../data/mockData';
import type { MovementType } from '../types';

export const StockMovementsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const movements = stockMovements
    .map(m => ({
      ...m,
      product: getProductById(m.productId),
      employee: m.employeeId ? getEmployeeById(m.employeeId) : null,
      order: m.relatedOrderId ? getOrderById(m.relatedOrderId) : null,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredMovements = movements.filter(m => {
    const matchesSearch = 
      m.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || m.movementType === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeOptions = [
    { value: 'all', label: 'Wszystkie typy' },
    { value: 'INBOUND', label: 'Przyjęcia' },
    { value: 'DISPATCH', label: 'Wydania' },
    { value: 'RETURN', label: 'Zwroty' },
    { value: 'LOSS', label: 'Straty' },
    { value: 'ADJUSTMENT', label: 'Korekty' },
  ];

  const getMovementIcon = (type: MovementType) => {
    switch (type) {
      case 'INBOUND': return <ArrowDown size={14} className="text-emerald-600" />;
      case 'DISPATCH': return <ArrowUp size={14} className="text-sky-600" />;
      case 'RETURN': return <RotateCcw size={14} className="text-amber-600" />;
      case 'LOSS': return <AlertTriangle size={14} className="text-red-600" />;
      default: return <Settings size={14} className="text-gray-600" />;
    }
  };

  const getMovementBadge = (type: MovementType) => {
    const config: Record<MovementType, { variant: 'success' | 'info' | 'warning' | 'danger' | 'default'; label: string }> = {
      'INBOUND': { variant: 'success', label: 'Przyjęcie' },
      'DISPATCH': { variant: 'info', label: 'Wydanie' },
      'RETURN': { variant: 'warning', label: 'Zwrot' },
      'LOSS': { variant: 'danger', label: 'Strata' },
      'ADJUSTMENT': { variant: 'default', label: 'Korekta' },
    };
    return <Badge variant={config[type].variant} size="sm">{config[type].label}</Badge>;
  };

  // Stats
  const stats = {
    przyjecia: movements.filter(m => m.movementType === 'INBOUND').reduce((sum, m) => sum + m.quantityChange, 0),
    wydania: Math.abs(movements.filter(m => m.movementType === 'DISPATCH').reduce((sum, m) => sum + m.quantityChange, 0)),
    zwroty: movements.filter(m => m.movementType === 'RETURN').reduce((sum, m) => sum + m.quantityChange, 0),
    straty: Math.abs(movements.filter(m => m.movementType === 'LOSS').reduce((sum, m) => sum + m.quantityChange, 0)),
  };

  return (
    <div>
      <PageHeader 
        title="Ruchy magazynowe" 
        subtitle="Historia operacji magazynowych"
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-500">Przyjęcia</p>
          <p className="text-xl font-bold text-emerald-600">+{stats.przyjecia}</p>
        </Card>
        <Card className="border-l-4 border-l-sky-500">
          <p className="text-xs text-gray-500">Wydania</p>
          <p className="text-xl font-bold text-sky-600">-{stats.wydania}</p>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-500">Zwroty</p>
          <p className="text-xl font-bold text-amber-600">+{stats.zwroty}</p>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <p className="text-xs text-gray-500">Straty</p>
          <p className="text-xl font-bold text-red-600">-{stats.straty}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Szukaj po produkcie lub opisie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div className="w-48">
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Movements list */}
      <div className="space-y-2">
        {filteredMovements.map(movement => (
          <Card key={movement.id} padding="sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-1.5 bg-gray-100 rounded flex-shrink-0">
                  {getMovementIcon(movement.movementType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{movement.product?.name}</p>
                    {getMovementBadge(movement.movementType)}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{movement.reason}</p>
                  {movement.order && (
                    <p className="text-xs text-gray-400">
                      Zamówienie: {movement.order.orderNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className={`text-xl font-bold ${movement.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                </p>
                <p className="text-xs text-gray-400">palet</p>
                <p className="text-xs text-gray-400">
                  {new Date(movement.createdAt).toLocaleDateString('pl-PL')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredMovements.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-500 text-sm">Brak ruchów magazynowych</p>
        </Card>
      )}
    </div>
  );
};
