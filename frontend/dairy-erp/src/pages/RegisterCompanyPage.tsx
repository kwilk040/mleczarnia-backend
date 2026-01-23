import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Milk, AlertCircle, Building2, Mail, Phone } from 'lucide-react';
import { registerCompany } from '../api/auth';

export const RegisterCompanyPage: React.FC = () => {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Polska');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !companyName ||
      !taxId ||
      !companyEmail ||
      !userEmail ||
      !password ||
      !addressLine ||
      !city ||
      !postalCode ||
      !country
    ) {
      setError('Proszę wypełnić wszystkie wymagane pola oznaczone *');
      return;
    }

    // Walidacja formatu telefonu (E.164) jeśli został podany
    let formattedPhone = companyPhone;
    if (companyPhone && companyPhone.trim()) {
      // Usuń spacje i myślniki
      const cleaned = companyPhone.replace(/[\s-]/g, '');
      // Jeśli nie zaczyna się od +, dodaj +48 (dla Polski)
      if (!cleaned.startsWith('+')) {
        if (cleaned.startsWith('48')) {
          formattedPhone = '+' + cleaned;
        } else if (cleaned.startsWith('0')) {
          formattedPhone = '+48' + cleaned.substring(1);
        } else {
          formattedPhone = '+48' + cleaned;
        }
      } else {
        formattedPhone = cleaned;
      }
    }

    setIsSubmitting(true);

    try {
      await registerCompany({
        name: companyName,
        taxId,
        mainEmail: companyEmail,
        phoneNumber: formattedPhone || undefined,
        address: {
          address: addressLine,
          city,
          postalCode,
          country,
        },
        user: {
          email: userEmail,
          password,
        },
      });

      alert(
        'Zgłoszenie rejestracji firmy zostało wysłane.\n' +
          'Po weryfikacji danych administrator aktywuje Twoje konto.'
      );
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłania zgłoszenia. Spróbuj ponownie.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Decorative (reuse login look) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-600 via-green-700 to-emerald-800">
        <div className="flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="p-5 bg-white/10 rounded-2xl mb-8">
            <Milk size={56} className="text-white" />
          </div>

          <h1 className="text-4xl font-bold text-center mb-4">
            Dołącz do Mleczarnia ERP
          </h1>

          <p className="text-lg text-green-100 text-center max-w-md mb-10">
            Zarejestruj swoją firmę, a administrator zweryfikuje i aktywuje konto
            klienta B2B.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              'Rejestracja firmy online',
              'Szybka weryfikacja przez admina',
              'Dostęp do zamówień B2B',
              'Historia faktur i dostaw',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-green-100">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-base">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-green-600 rounded-xl">
              <Milk size={32} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Mleczarnia ERP</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Rejestracja firmy
              </h2>
              <p className="text-gray-500 text-base mt-2">
                Podaj dane firmy oraz konto osoby kontaktowej
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span className="text-base">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company data */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Dane firmy
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nazwa firmy *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Building2 size={18} />
                    </span>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="np. Delikatesy Świeżość Sp. z o.o."
                      className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-gray-300 
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                        hover:border-gray-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    NIP *
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 
                      bg-white text-gray-900 placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                      hover:border-gray-400 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adres siedziby (ulica, nr) *
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="ul. Przykładowa 1"
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 
                      bg-white text-gray-900 placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                      hover:border-gray-400 transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Miasto *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="np. Warszawa"
                      className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                        hover:border-gray-400 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kod pocztowy *
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="00-000"
                      className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                        hover:border-gray-400 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kraj *
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Polska"
                      className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                        hover:border-gray-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email firmy (do faktur, kontaktu) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="kontakt@twojafirma.pl"
                      className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-gray-300 
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                        hover:border-gray-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefon (opcjonalnie)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Phone size={18} />
                    </span>
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+48123456789 lub 48123456789"
                      className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-gray-300 
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                        hover:border-gray-400 transition-all duration-200"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Format: +48123456789 (z +48 dla Polski) lub zostaw puste
                  </p>
                </div>
              </div>

              {/* User account */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Konto użytkownika (osoba kontaktowa)
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email użytkownika (login) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="osoba.kontaktowa@twojafirma.pl"
                      className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-gray-300 
                        bg-white text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                        hover:border-gray-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hasło *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wprowadź hasło"
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 
                      bg-white text-gray-900 placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                      hover:border-gray-400 transition-all duration-200"
                  />
                </div>

                <p className="text-xs text-gray-400">
                  Po wysłaniu formularza Twoje konto klienta B2B będzie miało status
                  „oczekuje na weryfikację”. Administrator sprawdzi dane i aktywuje
                  dostęp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  Mam już konto – wróć do logowania
                </button>

                <Button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 text-base"
                  isLoading={isSubmitting}
                >
                  Wyślij zgłoszenie
                </Button>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            © 2024 System ERP Mleczarnia
          </p>
        </div>
      </div>
    </div>
  );
};

