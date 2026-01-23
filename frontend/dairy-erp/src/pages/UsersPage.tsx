import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Search, Plus, Edit, Ban, Check, UserCog, Mail, Shield } from 'lucide-react';
import { UserAccount, UserRole, Employee, CustomerCompany } from '../types';
import { listUsers, createUser } from '../api/users';
import { listEmployees } from '../api/employees';
import { listCompanies } from '../api/companies';

// Type for enriched user with employee and customerCompany that can be null
type EnrichedUser = Omit<UserAccount, 'employee' | 'customerCompany'> & {
  employee: Employee | null;
  customerCompany: CustomerCompany | null;
};

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customerCompanies, setCustomerCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for adding new user
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'STAFF' as UserRole,
    isActive: true,
    employeeId: '',
    customerCompanyId: '',
  });

  // Load data from API
  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('loadData - Starting to load data...');
      const [usersData, employeesData, companiesData] = await Promise.all([
        listUsers(),
        listEmployees(),
        listCompanies(),
      ]);
      console.log('loadData - Loaded usersData:', usersData);
      console.log('loadData - Users count:', usersData.length);
      setUsers(usersData);
      setEmployees(employeesData);
      setCustomerCompanies(companiesData);
      console.log('loadData - State updated');
    } catch (error) {
      console.error('Błąd podczas ładowania danych:', error);
      setUsers([]);
      setEmployees([]);
      setCustomerCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const enrichedUsers: EnrichedUser[] = users.map(user => ({
    ...user,
    employee: user.employeeId ? (employees.find(emp => emp.id === user.employeeId) ?? null) : null,
    customerCompany: user.customerCompanyId ? (customerCompanies.find(comp => comp.id === user.customerCompanyId) ?? null) : null,
  }));

  const filteredUsers = enrichedUsers.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employee && `${user.employee.firstName} ${user.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.customerCompany && user.customerCompany.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Debug logging
  console.log('UsersPage render - users state:', users);
  console.log('UsersPage render - users count:', users.length);
  console.log('UsersPage render - enrichedUsers count:', enrichedUsers.length);
  console.log('UsersPage render - filteredUsers count:', filteredUsers.length);
  console.log('UsersPage render - roleFilter:', roleFilter);
  console.log('UsersPage render - searchTerm:', searchTerm);

  const roleOptions = [
    { value: 'all', label: 'Wszystkie role' },
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'STAFF', label: 'Pracownik' },
    { value: 'WAREHOUSE', label: 'Magazynier' },
    { value: 'CLIENT', label: 'Klient' },
  ];

  const getRoleBadge = (role: UserRole) => {
    const config: Record<UserRole, { variant: 'purple' | 'info' | 'warning' | 'success'; label: string }> = {
      ADMIN: { variant: 'purple', label: 'Administrator' },
      STAFF: { variant: 'info', label: 'Pracownik' },
      WAREHOUSE: { variant: 'warning', label: 'Magazynier' },
      CLIENT: { variant: 'success', label: 'Klient' },
    };
    return <Badge variant={config[role].variant}>{config[role].label}</Badge>;
  };

  const columns = [
    {
      key: 'user',
      header: 'Użytkownik',
      render: (user: EnrichedUser) => (
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm
            ${user.isActive ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gray-400'}
          `}>
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.employee 
                ? `${user.employee.firstName} ${user.employee.lastName}`
                : user.customerCompany?.name || user.email
              }
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rola',
      render: (user: EnrichedUser) => getRoleBadge(user.role),
    },
    {
      key: 'type',
      header: 'Typ konta',
      render: (user: EnrichedUser) => (
        <span className="text-sm text-gray-600">
          {user.employee ? 'Pracownik firmy' : user.customerCompany ? 'Firma klienta' : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: EnrichedUser) => (
        <Badge variant={user.isActive ? 'success' : 'danger'} dot>
          {user.isActive ? 'Aktywny' : 'Zablokowany'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Ostatnie logowanie',
      render: (user: EnrichedUser) => (
        <span className="text-sm text-gray-500">
          {user.lastLoginAt 
            ? new Date(user.lastLoginAt).toLocaleDateString('pl-PL')
            : 'Nigdy'
          }
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Akcje',
      render: (user: EnrichedUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Convert EnrichedUser back to UserAccount for state
              const { employee, customerCompany, ...userAccount } = user;
              setSelectedUser(userAccount);
              setIsEditModalOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edytuj"
          >
            <Edit size={18} className="text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              alert(`${user.isActive ? 'Blokowanie' : 'Odblokowanie'} użytkownika: ${user.email}`);
            }}
            className={`p-2 rounded-lg transition-colors ${user.isActive ? 'hover:bg-red-100' : 'hover:bg-emerald-100'}`}
            title={user.isActive ? 'Zablokuj' : 'Odblokuj'}
          >
            {user.isActive ? (
              <Ban size={18} className="text-red-500" />
            ) : (
              <Check size={18} className="text-emerald-500" />
            )}
          </button>
        </div>
      ),
    },
  ];

  // Stats per role
  const roleStats = {
    ADMIN: enrichedUsers.filter(u => u.role === 'ADMIN').length,
    STAFF: enrichedUsers.filter(u => u.role === 'STAFF').length,
    WAREHOUSE: enrichedUsers.filter(u => u.role === 'WAREHOUSE').length,
    CLIENT: enrichedUsers.filter(u => u.role === 'CLIENT').length,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Użytkownicy" 
        subtitle="Zarządzaj kontami użytkowników systemu"
        action={
          <Button 
            leftIcon={<Plus size={18} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Dodaj użytkownika
          </Button>
        }
      />

      {/* Role stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-all ${roleFilter === 'ADMIN' ? 'ring-2 ring-violet-500' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'ADMIN' ? 'all' : 'ADMIN')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Shield size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roleStats.ADMIN}</p>
              <p className="text-xs text-gray-500">Administratorzy</p>
            </div>
          </div>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${roleFilter === 'STAFF' ? 'ring-2 ring-sky-500' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'STAFF' ? 'all' : 'STAFF')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <UserCog size={20} className="text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roleStats.STAFF}</p>
              <p className="text-xs text-gray-500">Pracownicy</p>
            </div>
          </div>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${roleFilter === 'WAREHOUSE' ? 'ring-2 ring-amber-500' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'WAREHOUSE' ? 'all' : 'WAREHOUSE')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <UserCog size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roleStats.WAREHOUSE}</p>
              <p className="text-xs text-gray-500">Magazynierzy</p>
            </div>
          </div>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${roleFilter === 'CLIENT' ? 'ring-2 ring-emerald-500' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'CLIENT' ? 'all' : 'CLIENT')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <UserCog size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roleStats.CLIENT}</p>
              <p className="text-xs text-gray-500">Klienci</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Szukaj po emailu lub nazwie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Users table */}
      {isLoading ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Ładowanie użytkowników...</p>
        </Card>
      ) : (
        <Card padding="none">
          <Table
            columns={columns}
            data={filteredUsers}
            keyExtractor={(user) => user.id}
            emptyMessage="Brak użytkowników do wyświetlenia"
          />
        </Card>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewUserForm({
            email: '',
            password: '',
            role: 'STAFF',
            isActive: true,
            employeeId: '',
            customerCompanyId: '',
          });
        }}
        title="Dodaj nowego użytkownika"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            leftIcon={<Mail size={18} />}
            placeholder="email@example.com"
          />

          <Input
            label="Hasło"
            type="password"
            value={newUserForm.password}
            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
            placeholder="Wprowadź hasło"
          />

          <Select
            label="Rola"
            value={newUserForm.role}
            onChange={(e) => {
              const role = e.target.value as UserRole;
              setNewUserForm({ 
                ...newUserForm, 
                role,
                // Reset associations when role changes
                employeeId: '',
                customerCompanyId: '',
              });
            }}
            options={[
              { value: 'ADMIN', label: 'Administrator' },
              { value: 'STAFF', label: 'Pracownik' },
              { value: 'WAREHOUSE', label: 'Magazynier' },
              { value: 'CLIENT', label: 'Klient' },
            ]}
          />

          {(newUserForm.role === 'STAFF' || newUserForm.role === 'WAREHOUSE' || newUserForm.role === 'ADMIN') && (
            <Select
              label="Pracownik"
              value={newUserForm.employeeId}
              onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value, customerCompanyId: '' })}
              options={[
                { value: '', label: 'Wybierz pracownika...' },
                ...employees
                  .filter(emp => !users.some(ua => ua.employeeId === emp.id))
                  .map(emp => ({
                    value: emp.id.toString(),
                    label: `${emp.firstName} ${emp.lastName} (${emp.position})`
                  }))
              ]}
            />
          )}

          {newUserForm.role === 'CLIENT' && (
            <Select
              label="Firma klienta"
              value={newUserForm.customerCompanyId}
              onChange={(e) => setNewUserForm({ ...newUserForm, customerCompanyId: e.target.value, employeeId: '' })}
              options={[
                { value: '', label: 'Wybierz firmę...' },
                ...customerCompanies
                  .filter(comp => !users.some(ua => ua.customerCompanyId === comp.id))
                  .map(comp => ({
                    value: comp.id.toString(),
                    label: comp.name
                  }))
              ]}
            />
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input 
              type="checkbox" 
              id="isActiveNew"
              checked={newUserForm.isActive}
              onChange={(e) => setNewUserForm({ ...newUserForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="isActiveNew" className="text-sm text-gray-700">
              Konto aktywne
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsAddModalOpen(false);
                setNewUserForm({
                  email: '',
                  password: '',
                  role: 'STAFF',
                  isActive: true,
                  employeeId: '',
                  customerCompanyId: '',
                });
              }}
            >
              Anuluj
            </Button>
            <Button 
              onClick={async () => {
                if (!newUserForm.email || !newUserForm.password) {
                  alert('Proszę wypełnić wszystkie wymagane pola');
                  return;
                }
                
                if ((newUserForm.role === 'STAFF' || newUserForm.role === 'WAREHOUSE' || newUserForm.role === 'ADMIN') && !newUserForm.employeeId) {
                  alert('Proszę wybrać pracownika');
                  return;
                }
                
                if (newUserForm.role === 'CLIENT' && !newUserForm.customerCompanyId) {
                  alert('Proszę wybrać firmę klienta');
                  return;
                }

                setIsSubmitting(true);
                try {
                  console.log('Creating user...', {
                    email: newUserForm.email,
                    role: newUserForm.role,
                    employeeId: newUserForm.employeeId,
                    customerCompanyId: newUserForm.customerCompanyId,
                  });
                  
                  await createUser({
                    email: newUserForm.email,
                    password: newUserForm.password,
                    role: newUserForm.role,
                    employeeId: newUserForm.employeeId ? parseInt(newUserForm.employeeId) : null,
                    customerCompanyId: newUserForm.customerCompanyId ? parseInt(newUserForm.customerCompanyId) : null,
                  });
                  
                  console.log('User created successfully, closing modal and reloading...');
                  
                  setIsAddModalOpen(false);
                  setNewUserForm({
                    email: '',
                    password: '',
                    role: 'STAFF',
                    isActive: true,
                    employeeId: '',
                    customerCompanyId: '',
                  });
                  
                  // Reset filter to show all users
                  setRoleFilter('all');
                  
                  // Small delay to ensure backend has processed the request
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Odśwież listę użytkowników
                  console.log('Calling loadData()...');
                  await loadData();
                  console.log('loadData() completed');
                } catch (error) {
                  console.error('Błąd podczas dodawania użytkownika:', error);
                  let errorMessage = 'Nieznany błąd';
                  
                  if (error instanceof Error) {
                    errorMessage = error.message;
                    // Jeśli błąd zawiera szczegóły z API, wyświetl je
                    if (errorMessage.includes('API Error:')) {
                      const match = errorMessage.match(/API Error: \d+ - (.+)/);
                      if (match && match[1]) {
                        try {
                          const errorData = JSON.parse(match[1]);
                          if (errorData.error) {
                            errorMessage = errorData.error;
                          }
                        } catch {
                          // Jeśli nie można sparsować JSON, użyj oryginalnej wiadomości
                        }
                      }
                    }
                    
                    // Sprawdź, czy to błąd duplikatu emaila
                    if (errorMessage.includes('email already exists') || 
                        errorMessage.includes('duplicate key') ||
                        errorMessage.includes('user_account_email_key')) {
                      errorMessage = 'Ten adres email jest już używany. Proszę użyć innego adresu email.';
                    }
                  }
                  
                  alert(`Błąd podczas dodawania użytkownika: ${errorMessage}`);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Dodawanie...' : 'Dodaj użytkownika'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edytuj użytkownika"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                {selectedUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                {getRoleBadge(selectedUser.role)}
              </div>
            </div>

            <Input
              label="Email"
              value={selectedUser.email}
              leftIcon={<Mail size={18} />}
              disabled
            />

            <Select
              label="Rola"
              value={selectedUser.role}
              options={[
                { value: 'ADMIN', label: 'Administrator' },
                { value: 'STAFF', label: 'Pracownik' },
                { value: 'WAREHOUSE', label: 'Magazynier' },
                { value: 'CLIENT', label: 'Klient' },
              ]}
            />

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input 
                type="checkbox" 
                id="isActive"
                defaultChecked={selectedUser.isActive}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Konto aktywne
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={() => {
                alert('Zapisano zmiany');
                setIsEditModalOpen(false);
              }}>
                Zapisz zmiany
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

