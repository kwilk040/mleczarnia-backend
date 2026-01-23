import { apiRequest } from './client';
import { Employee } from '../types';

export interface ListEmployeesResponse {
  employees: Employee[];
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  position: string;
  hireDate: Date;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  position?: string;
  active?: boolean;
}

// Backend Employee response type
interface BackendEmployee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  isActive: boolean;
  hireDate: string;
}

// Map backend Employee to frontend Employee
function mapBackendEmployeeToEmployee(backend: BackendEmployee): Employee {
  return {
    id: backend.id,
    firstName: backend.firstName,
    lastName: backend.lastName,
    position: backend.position,
    active: backend.isActive,
    hiredAt: new Date(backend.hireDate),
  };
}

// Lista pracowników
export async function listEmployees(): Promise<Employee[]> {
  const response = await apiRequest<{ employees: BackendEmployee[] }>('/employees');
  return (response.employees || []).map(mapBackendEmployeeToEmployee);
}

// Szczegóły pracownika
export async function getEmployee(employeeId: number): Promise<Employee> {
  const response = await apiRequest<BackendEmployee>(`/employees/${employeeId}`);
  return mapBackendEmployeeToEmployee(response);
}

// Utwórz pracownika
export async function createEmployee(request: CreateEmployeeRequest): Promise<Employee> {
  const response = await apiRequest<BackendEmployee>('/employees', {
    method: 'POST',
    body: JSON.stringify({
      firstName: request.firstName,
      lastName: request.lastName,
      position: request.position,
      hireDate: request.hireDate.toISOString(),
    }),
  });
  return mapBackendEmployeeToEmployee(response);
}

// Aktualizuj pracownika
export async function updateEmployee(
  employeeId: number,
  request: UpdateEmployeeRequest
): Promise<Employee> {
  return apiRequest<Employee>(`/employees/${employeeId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}
