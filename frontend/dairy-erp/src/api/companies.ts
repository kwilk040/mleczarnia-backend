import { apiRequest } from './client';
import { CustomerCompany, CompanyAddress } from '../types';

export interface ListCompaniesResponse {
  companies: CustomerCompany[];
}

export interface CreateCompanyRequest {
  name: string;
  taxId: string;
  mainEmail: string;
  phoneNumber?: string;
  isActive?: boolean;
  riskFlag?: boolean;
}

export interface UpdateCompanyRequest {
  name?: string;
  taxId?: string;
  mainEmail?: string;
  phoneNumber?: string;
}

// Backend Company response type
interface BackendCompany {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phoneNumber?: string | null;
  orderCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'AT_RISK';
  registrationDate: string;
}

// Map backend Company to frontend CustomerCompany
function mapBackendCompanyToCustomerCompany(backend: BackendCompany): CustomerCompany {
  return {
    id: backend.id,
    name: backend.name,
    taxId: backend.taxId,
    mainEmail: backend.email,
    phone: backend.phoneNumber || null,
    isActive: backend.status === 'ACTIVE',
    riskFlag: backend.status === 'AT_RISK',
    createdAt: new Date(backend.registrationDate),
  };
}

// Utwórz nową firmę
export async function createCompany(request: CreateCompanyRequest): Promise<CustomerCompany> {
  const response = await apiRequest<BackendCompany>('/companies', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return mapBackendCompanyToCustomerCompany(response);
}

// Lista firm
export async function listCompanies(): Promise<CustomerCompany[]> {
  const response = await apiRequest<{ companies: BackendCompany[] }>('/companies');
  return response.companies.map(mapBackendCompanyToCustomerCompany);
}

// Szczegóły firmy
export async function getCompany(companyId: number): Promise<CustomerCompany> {
  return apiRequest<CustomerCompany>(`/companies/${companyId}`);
}

// Aktualizuj firmę
export async function updateCompany(
  companyId: number,
  request: UpdateCompanyRequest
): Promise<void> {
  await apiRequest<void>(`/companies/${companyId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

// Aktywuj firmę
export async function activateCompany(companyId: number): Promise<void> {
  await apiRequest<void>(`/companies/${companyId}/activate`, {
    method: 'PATCH',
  });
}

// Deaktywuj firmę
export async function deactivateCompany(companyId: number): Promise<void> {
  await apiRequest<void>(`/companies/${companyId}/deactivate`, {
    method: 'PATCH',
  });
}

// Lista adresów firmy
export async function listCompanyAddresses(companyId: number): Promise<CompanyAddress[]> {
  return apiRequest<CompanyAddress[]>(`/companies/${companyId}/addresses`);
}
