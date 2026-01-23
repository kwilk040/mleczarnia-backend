import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Search, Plus, Package, AlertTriangle, ArrowDown, ArrowUp, Trash2, DollarSign, Tag } from 'lucide-react';
import type { MovementType, Product, Stock } from '../types';
import { listProducts, createProduct } from '../api/products';
import { listStock, createStockMovement } from '../api/warehouse';

export const WarehousePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('INBOUND');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockData, setStockData] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for adding new product
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: '',
    unit: '',
    defaultPrice: '',
  });
  
  // Available categories for new product
  const availableCategories = [
    'Nabiał',
    'Mleko',
    'Ser',
    'Jogurt',
    'Masło',
    'Śmietana',
    'Inne',
  ];

  // Load products and stock from API
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [apiProducts, apiStock] = await Promise.all([
        listProducts(),
        listStock(),
      ]);
      setProducts(apiProducts);
      setStockData(apiStock);
    } catch (error) {
      console.error('Błąd podczas ładowania danych magazynowych:', error);
      setProducts([]);
      setStockData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combine products with stock data
  const enrichedProducts = products.map(product => {
    const stock = stockData.find(s => s.productId === product.id);
    return {
      ...product,
      stock: stock ? {
        quantity: stock.quantity,
        minQuantity: stock.minQuantity,
        damagedQuantity: stock.damagedQuantity || 0,
        returnedQuantity: stock.returnedQuantity || 0,
      } : {
        quantity: 0,
        minQuantity: 0,
        damagedQuantity: 0,
        returnedQuantity: 0,
      },
    };
  });

  const categories = [...new Set(products.map(p => p.category))];
  const categoryOptions = [
    { value: 'all', label: 'Wszystkie kategorie' },
    ...categories.map(c => ({ value: c, label: c })),
  ];

  const filteredProducts = enrichedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPallets = stockData.reduce((sum, s) => sum + s.quantity, 0);
  const lowStockCount = stockData.filter(s => s.quantity <= s.minQuantity).length;
  const damagedCount = stockData.reduce((sum, s) => sum + (s.damagedQuantity || 0), 0);
  const returnedCount = stockData.reduce((sum, s) => sum + (s.returnedQuantity || 0), 0);

  const getProductById = (id: number | null): Product | undefined => {
    if (!id) return undefined;
    return products.find(p => p.id === id);
  };

  const handleMovement = async () => {
    if (!selectedProductId || !movementQuantity) {
      alert('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    const quantity = parseInt(movementQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Proszę podać poprawną ilość');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStockMovement({
        productId: selectedProductId,
        quantityChange: movementType === 'INBOUND' || movementType === 'RETURN' || movementType === 'ADJUSTMENT' ? quantity : -quantity,
        movementType: movementType,
        relatedOrderId: movementType === 'RETURN' ? null : null, // TODO: Add order selection for returns
        reason: movementReason || null,
      });
      
      setIsMovementModalOpen(false);
      setMovementQuantity('');
      setMovementReason('');
      
      // Odśwież listę produktów i stanów magazynowych z API
      await loadData();
    } catch (error) {
      console.error('Błąd podczas zapisywania ruchu magazynowego:', error);
      alert(`Błąd podczas zapisywania ruchu magazynowego: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMovementModal = (productId: number, type: MovementType) => {
    setSelectedProductId(productId);
    setMovementType(type);
    setIsMovementModalOpen(true);
  };

  return (
    <div>
      <PageHeader 
        title="Magazyn" 
        subtitle="Stany magazynowe"
        action={
          <div className="flex gap-2">
            <Button 
              size="sm" 
              leftIcon={<Plus size={14} />} 
              onClick={() => setIsAddProductModalOpen(true)}
            >
              Dodaj produkt
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              leftIcon={<Plus size={14} />} 
              onClick={() => openMovementModal(enrichedProducts[0]?.id || 1, 'INBOUND')}
            >
              Nowy ruch
            </Button>
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="text-center">
          <Package size={20} className="mx-auto text-green-600 mb-1" />
          <p className="text-xl font-bold text-gray-900">{totalPallets}</p>
          <p className="text-xs text-gray-500">Wszystkie palety</p>
        </Card>
        <Card className="text-center">
          <AlertTriangle size={20} className={`mx-auto mb-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
          <p className={`text-xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{lowStockCount}</p>
          <p className="text-xs text-gray-500">Niski stan</p>
        </Card>
        <Card className="text-center">
          <Trash2 size={20} className={`mx-auto mb-1 ${damagedCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
          <p className={`text-xl font-bold ${damagedCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{damagedCount}</p>
          <p className="text-xs text-gray-500">Uszkodzone</p>
        </Card>
        <Card className="text-center">
          <ArrowDown size={20} className={`mx-auto mb-1 ${returnedCount > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
          <p className={`text-xl font-bold ${returnedCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{returnedCount}</p>
          <p className="text-xs text-gray-500">Ze zwrotów</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Szukaj produktu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div className="w-48">
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Stock table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Produkt</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Kategoria</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Dostępne</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Minimum</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Uszkodzone</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Zwroty</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                    Ładowanie danych magazynowych...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                    Brak produktów w magazynie
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                const isLowStock = product.stock && product.stock.quantity <= product.stock.minQuantity;
                return (
                  <tr key={product.id} className={isLowStock ? 'bg-amber-50' : ''}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Package size={16} className={isLowStock ? 'text-amber-600' : 'text-gray-400'} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="default" size="sm">{product.category}</Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-base font-bold ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                        {product.stock?.quantity || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-500">
                      {product.stock?.minQuantity || 0}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-medium ${(product.stock?.damagedQuantity || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {product.stock?.damagedQuantity || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-medium ${(product.stock?.returnedQuantity || 0) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {product.stock?.returnedQuantity || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openMovementModal(product.id, 'INBOUND')}
                          className="p-1 hover:bg-emerald-100 rounded transition-colors"
                          title="Przyjęcie"
                        >
                          <ArrowDown size={16} className="text-emerald-600" />
                        </button>
                        <button
                          onClick={() => openMovementModal(product.id, 'DISPATCH')}
                          className="p-1 hover:bg-sky-100 rounded transition-colors"
                          title="Wydanie"
                        >
                          <ArrowUp size={16} className="text-sky-600" />
                        </button>
                        <button
                          onClick={() => openMovementModal(product.id, 'LOSS')}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Strata"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Nowy ruch magazynowy"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Produkt</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {getProductById(selectedProductId!)?.name}
            </p>
          </div>

          <Select
            label="Typ ruchu"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as MovementType)}
            options={[
              { value: 'INBOUND', label: '↓ Przyjęcie towaru' },
              { value: 'DISPATCH', label: '↑ Wydanie towaru' },
              { value: 'RETURN', label: '↩ Zwrot od klienta' },
              { value: 'LOSS', label: '✕ Strata / uszkodzenie' },
              { value: 'ADJUSTMENT', label: '± Korekta stanu' },
            ]}
          />

          <Input
            label="Ilość palet"
            type="number"
            min="1"
            value={movementQuantity}
            onChange={(e) => setMovementQuantity(e.target.value)}
            placeholder="Podaj ilość..."
          />

          <Input
            label="Powód / opis"
            value={movementReason}
            onChange={(e) => setMovementReason(e.target.value)}
            placeholder="np. Dostawa od producenta..."
          />

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsMovementModalOpen(false)}>
              Anuluj
            </Button>
            <Button size="sm" onClick={handleMovement} disabled={!movementQuantity || isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setNewProductForm({
            name: '',
            category: '',
            unit: '',
            defaultPrice: '',
          });
        }}
        title="Dodaj nowy produkt"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nazwa produktu"
            value={newProductForm.name}
            onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
            placeholder="np. Mleko 3,2%"
            leftIcon={<Package size={18} />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoria
            </label>
            <Select
              options={[
                { value: '', label: 'Wybierz kategorię' },
                ...availableCategories.map(c => ({ value: c, label: c })),
              ]}
              value={newProductForm.category}
              onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
            />
          </div>

          <Input
            label="Jednostka"
            value={newProductForm.unit}
            onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
            placeholder="np. litr, kg, sztuka"
            leftIcon={<Tag size={18} />}
          />

          <Input
            label="Cena domyślna"
            type="number"
            step="0.01"
            min="0"
            value={newProductForm.defaultPrice}
            onChange={(e) => setNewProductForm({ ...newProductForm, defaultPrice: e.target.value })}
            placeholder="0.00"
            leftIcon={<DollarSign size={18} />}
          />

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsAddProductModalOpen(false);
                setNewProductForm({
                  name: '',
                  category: '',
                  unit: '',
                  defaultPrice: '',
                });
              }}
            >
              Anuluj
            </Button>
            <Button 
              onClick={async () => {
                if (!newProductForm.name || !newProductForm.category || !newProductForm.unit || !newProductForm.defaultPrice) {
                  alert('Proszę wypełnić wszystkie pola');
                  return;
                }

                const price = parseFloat(newProductForm.defaultPrice);
                if (isNaN(price) || price < 0) {
                  alert('Proszę podać poprawną cenę');
                  return;
                }

                setIsSubmitting(true);
                try {
                  await createProduct({
                    name: newProductForm.name,
                    category: newProductForm.category,
                    unit: newProductForm.unit,
                    defaultPrice: price,
                  });
                  
                  setIsAddProductModalOpen(false);
                  setNewProductForm({
                    name: '',
                    category: '',
                    unit: '',
                    defaultPrice: '',
                  });
                  
                  // Odśwież listę produktów i stanów magazynowych z API
                  await loadData();
                } catch (error) {
                  console.error('Błąd podczas dodawania produktu:', error);
                  alert(`Błąd podczas dodawania produktu: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Dodawanie...' : 'Dodaj produkt'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
