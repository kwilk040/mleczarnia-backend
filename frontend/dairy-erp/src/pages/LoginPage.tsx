import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Milk, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Nieprawidłowy email lub hasło');
      }
    } catch {
      setError('Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { role: 'Admin', email: 'admin@mleczarnia.dev', password: 'admin' },
    { role: 'Pracownik (Staff)', email: 'staff@mleczarnia.dev', password: 'staff123' },
    { role: 'Magazynier (Warehouse)', email: 'warehouse@mleczarnia.dev', password: 'warehouse123' },
    { role: 'Klient (Client)', email: 'client@mleczarnia.dev', password: 'client123' },
  ];

  const fillDemo = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-600 via-green-700 to-emerald-800">
        <div className="flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="p-5 bg-white/10 rounded-2xl mb-8">
            <Milk size={56} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-4">
            System ERP Mleczarnia
          </h1>
          
          <p className="text-lg text-green-100 text-center max-w-md mb-10">
            Kompleksowe zarządzanie zamówieniami, magazynem i fakturami
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              'Zarządzanie zamówieniami',
              'Kontrola magazynu',
              'Faktury i płatności',
              'Baza klientów',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-green-100">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-base">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-green-600 rounded-xl">
              <Milk size={32} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Mleczarnia ERP</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Zaloguj się</h2>
              <p className="text-gray-500 text-base mt-2">Wprowadź dane logowania</p>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <span>Nie masz jeszcze konta? </span>
              <button
                type="button"
                onClick={() => navigate('/register-company')}
                className="font-medium text-green-600 hover:text-green-700 underline underline-offset-2"
              >
                Zarejestruj firmę
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span className="text-base">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj@email.pl"
                  required
                  className="w-full px-6 py-4 text-lg rounded-xl border border-gray-300 
                    bg-white text-gray-900 placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                    hover:border-gray-400 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Hasło
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-6 py-4 text-lg rounded-xl border border-gray-300 
                    bg-white text-gray-900 placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                    hover:border-gray-400 transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                className="w-full text-lg py-4"
                isLoading={isLoading}
              >
                Zaloguj się
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-400 text-center mb-4">
                Konta demo (kliknij aby wypełnić)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => fillDemo(user.email, user.password)}
                    className="p-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-600 font-medium"
                  >
                    {user.role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            © 2024 System ERP Mleczarnia
          </p>
        </div>
      </div>
    </div>
  );
};
