import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Edit, Package, AlertTriangle, DollarSign, Tag } from 'lucide-react';
import { Product } from '../types';
import { createProduct, listProducts, updateProduct } from '../api/products';

export const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for adding new product
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: '',
    unit: '',
    defaultPrice: '',
  });
  
  // Form state for editing product
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    category: '',
    unit: '',
    defaultPrice: '',
  });
  
  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const apiProducts = await listProducts();
        setProducts(apiProducts);
      } catch (error) {
        console.error('Błąd podczas ładowania produktów:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  const categories = [...new Set(products.map(p => p.category))];
  const categoryOptions = [
    { value: 'all', label: 'Wszystkie kategorie' },
    ...categories.map(c => ({ value: c, label: c })),
  ];
  
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Produkty" 
        subtitle="Zarządzaj katalogiem produktów"
        action={
          <Button 
            leftIcon={<Plus size={18} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Dodaj produkt
          </Button>
        }
      />

      {/* Category stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {categories.map(category => {
          const categoryProducts = products.filter(p => p.category === category);
          const lowStock = categoryProducts.filter(p => p.stock && p.stock.quantity <= p.stock.minQuantity).length;
          return (
            <button
              key={category}
              onClick={() => setCategoryFilter(category === categoryFilter ? 'all' : category)}
              className={`
                p-4 rounded-xl bg-white border-2 transition-all text-left
                ${categoryFilter === category 
                  ? 'border-green-500 shadow-md' 
                  : 'border-transparent hover:border-gray-200 hover:shadow'
                }
              `}
            >
              <p className="font-semibold text-gray-900">{category}</p>
              <p className="text-sm text-gray-500">{categoryProducts.length} produktów</p>
              {lowStock > 0 && (
                <div className="flex items-center gap-1 mt-2 text-amber-600">
                  <AlertTriangle size={14} />
                  <span className="text-xs">{lowStock} niski stan</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Szukaj produktu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => {
          const isLowStock = product.stock && product.stock.quantity <= product.stock.minQuantity;
          return (
            <Card key={product.id} hover className="relative overflow-hidden">
              {isLowStock && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                  Niski stan
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isLowStock ? 'bg-amber-100' : 'bg-green-50'}`}>
                  <Package size={24} className={isLowStock ? 'text-amber-600' : 'text-green-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  <Badge variant="default" size="sm">{product.category}</Badge>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cena</p>
                  <p className="font-bold text-gray-900">
                    {product.defaultPrice.toLocaleString('pl-PL')} zł
                  </p>
                  <p className="text-xs text-gray-400">za {product.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stan magazynowy</p>
                  <p className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                    {product.stock?.quantity || 0}
                  </p>
                  <p className="text-xs text-gray-400">min: {product.stock?.minQuantity || 0}</p>
                </div>
              </div>

              {product.stock && (product.stock.damagedQuantity || 0) + (product.stock.returnedQuantity || 0) > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs">
                  {(product.stock.damagedQuantity || 0) > 0 && (
                    <span className="text-red-600">
                      {product.stock.damagedQuantity} uszkodzonych
                    </span>
                  )}
                  {(product.stock.returnedQuantity || 0) > 0 && (
                    <span className="text-amber-600">
                      {product.stock.returnedQuantity} ze zwrotów
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1" 
                  leftIcon={<Edit size={16} />}
                  onClick={() => {
                    setEditingProduct(product);
                    setEditProductForm({
                      name: product.name,
                      category: product.category,
                      unit: product.unit,
                      defaultPrice: product.defaultPrice.toString(),
                    });
                    setIsEditModalOpen(true);
                  }}
                >
                  Edytuj
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nie znaleziono produktów</p>
        </Card>
      )}

      {isLoading && (
        <Card className="text-center py-12">
          <p className="text-gray-500">Ładowanie produktów...</p>
        </Card>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
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
                setIsAddModalOpen(false);
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
                  
                  setIsAddModalOpen(false);
                  setNewProductForm({
                    name: '',
                    category: '',
                    unit: '',
                    defaultPrice: '',
                  });
                  
                  // Odśwież listę produktów z API
                  try {
                    const apiProducts = await listProducts();
                    setProducts(apiProducts);
                  } catch (error) {
                    console.error('Błąd podczas odświeżania listy produktów:', error);
                  }
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

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
          setEditProductForm({
            name: '',
            category: '',
            unit: '',
            defaultPrice: '',
          });
        }}
        title="Edytuj produkt"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nazwa produktu"
            value={editProductForm.name}
            onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
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
              value={editProductForm.category}
              onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
            />
          </div>

          <Input
            label="Jednostka"
            value={editProductForm.unit}
            onChange={(e) => setEditProductForm({ ...editProductForm, unit: e.target.value })}
            placeholder="np. litr, kg, sztuka"
            leftIcon={<Tag size={18} />}
          />

          <Input
            label="Cena domyślna"
            type="number"
            step="0.01"
            min="0"
            value={editProductForm.defaultPrice}
            onChange={(e) => setEditProductForm({ ...editProductForm, defaultPrice: e.target.value })}
            placeholder="0.00"
            leftIcon={<DollarSign size={18} />}
          />

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingProduct(null);
                setEditProductForm({
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
                if (!editProductForm.name || !editProductForm.category || !editProductForm.unit || !editProductForm.defaultPrice) {
                  alert('Proszę wypełnić wszystkie pola');
                  return;
                }

                const price = parseFloat(editProductForm.defaultPrice);
                if (isNaN(price) || price < 0) {
                  alert('Proszę podać poprawną cenę');
                  return;
                }

                if (!editingProduct) {
                  return;
                }

                setIsSubmitting(true);
                try {
                  await updateProduct(editingProduct.id, {
                    name: editProductForm.name,
                    category: editProductForm.category,
                    unit: editProductForm.unit,
                    defaultPrice: price,
                  });
                  
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                  setEditProductForm({
                    name: '',
                    category: '',
                    unit: '',
                    defaultPrice: '',
                  });
                  
                  // Odśwież listę produktów z API
                  try {
                    const apiProducts = await listProducts();
                    setProducts(apiProducts);
                  } catch (error) {
                    console.error('Błąd podczas odświeżania listy produktów:', error);
                  }
                } catch (error) {
                  console.error('Błąd podczas edycji produktu:', error);
                  alert(`Błąd podczas edycji produktu: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

