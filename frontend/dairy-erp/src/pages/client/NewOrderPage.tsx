import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, Minus, ShoppingCart, Trash2, Package, ArrowRight, Check } from 'lucide-react';
import { products } from '../../data/mockData';
import { Product } from '../../types';

interface CartItem {
  product: Product;
  quantity: number;
}

export const NewOrderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const activeProducts = products.filter(p => p.isActive);
  const categories = ['all', ...new Set(activeProducts.map(p => p.category))];

  const filteredProducts = activeProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.defaultPrice * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setOrderSuccess(true);
  };

  if (orderSuccess) {
    return (
      <div className="animate-fade-in">
        <Card className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <Check size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Zamówienie złożone!
          </h2>
          <p className="text-gray-500 mb-6">
            Twoje zamówienie zostało przyjęte do realizacji. 
            Faktura zostanie wygenerowana automatycznie.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl mb-6">
            <p className="text-sm text-gray-500">Wartość zamówienia</p>
            <p className="text-2xl font-bold text-gray-900">
              {cartTotal.toLocaleString('pl-PL')} zł
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate('/client/orders')}>
              Historia zamówień
            </Button>
            <Button onClick={() => {
              setCart([]);
              setOrderSuccess(false);
            }}>
              Nowe zamówienie
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Nowe zamówienie" 
        subtitle={`Zamawiasz jako: ${user?.customerCompany?.name}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Szukaj produktu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={18} />}
                />
              </div>
            </div>
            
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${selectedCategory === category
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {category === 'all' ? 'Wszystkie' : category}
                </button>
              ))}
            </div>
          </Card>

          {/* Products grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);
              return (
                <Card key={product.id} hover className="relative">
                  {inCart && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {inCart.quantity}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                      <Package size={24} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                      <Badge variant="default" size="sm">{product.category}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {product.defaultPrice.toLocaleString('pl-PL')} zł
                      </p>
                      <p className="text-xs text-gray-500">za {product.unit}</p>
                    </div>
                    
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => addToCart(product)} leftIcon={<Plus size={16} />}>
                        Dodaj
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <Card className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nie znaleziono produktów</p>
            </Card>
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader 
                title="Koszyk" 
                subtitle={`${cartItemsCount} ${cartItemsCount === 1 ? 'paleta' : 'palet'}`}
              />

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Koszyk jest pusty</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Dodaj produkty, aby złożyć zamówienie
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.product.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {item.product.name.split('(')[0].trim()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.product.defaultPrice.toLocaleString('pl-PL')} zł × {item.quantity}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="p-1.5 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="p-1.5 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="font-bold text-gray-900">
                            {(item.product.defaultPrice * item.quantity).toLocaleString('pl-PL')} zł
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600">Suma</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {cartTotal.toLocaleString('pl-PL')} zł
                      </span>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded-xl mb-4">
                      <p className="text-xs text-amber-700">
                        <strong>Płatność:</strong> Faktura z odroczonym terminem płatności. 
                        Faktura zostanie wygenerowana automatycznie po złożeniu zamówienia.
                      </p>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleSubmitOrder}
                      isLoading={isSubmitting}
                      rightIcon={<ArrowRight size={18} />}
                    >
                      Złóż zamówienie
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

