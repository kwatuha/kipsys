// API utility functions for making requests to the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // Get token from localStorage (could be JWT from backend or simple token from frontend)
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    // Try to get JWT token from backend login (stored as 'token' or 'jwt_token')
    token = localStorage.getItem('token') || 
            localStorage.getItem('jwt_token') || 
            localStorage.getItem('auth_token');
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    // If 401, try to clear invalid token
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_token');
    }
    
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    // Include both message and error fields from backend response
    const errorMessage = error.error || error.message || error.msg || `HTTP error! status: ${response.status}`;
    const fullError = new Error(errorMessage);
    // Attach additional error details for debugging
    (fullError as any).status = response.status;
    (fullError as any).response = error;
    throw fullError;
  }

  return response.json();
}

// Patient API
export const patientApi = {
  getAll: (search?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/patients?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/patients/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/patients', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/patients/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/patients/${id}`, { method: 'DELETE' }),
  
  // Patient allergies
  getAllergies: (patientId: string) =>
    apiRequest<any[]>(`/api/patients/${patientId}/allergies`),
  
  getAllergy: (patientId: string, allergyId: string) =>
    apiRequest<any>(`/api/patients/${patientId}/allergies/${allergyId}`),
  
  createAllergy: (patientId: string, data: any) =>
    apiRequest<any>(`/api/patients/${patientId}/allergies`, { method: 'POST', body: data }),
  
  updateAllergy: (patientId: string, allergyId: string, data: any) =>
    apiRequest<any>(`/api/patients/${patientId}/allergies/${allergyId}`, { method: 'PUT', body: data }),
  
  deleteAllergy: (patientId: string, allergyId: string) =>
    apiRequest<any>(`/api/patients/${patientId}/allergies/${allergyId}`, { method: 'DELETE' }),
};

// Department API
export const departmentApi = {
  getAll: (search?: string) =>
    apiRequest<any[]>(`/api/departments?${new URLSearchParams(search ? { search } : {})}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/departments/${id}`),
  
  getEmployees: (id: string) =>
    apiRequest<any[]>(`/api/departments/${id}/employees`),
  
  getPositions: (id: string) =>
    apiRequest<any[]>(`/api/departments/${id}/positions`),
  
  create: (data: any) =>
    apiRequest<any>('/api/departments', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/departments/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/departments/${id}`, { method: 'DELETE' }),
};

// Pharmacy API
export const pharmacyApi = {
  // Medications
  getMedications: (search?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/pharmacy/medications?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }) })}`),
  
  getMedication: (id: string) =>
    apiRequest<any>(`/api/pharmacy/medications/${id}`),
  
  createMedication: (data: any) =>
    apiRequest<any>('/api/pharmacy/medications', { method: 'POST', body: data }),
  
  updateMedication: (id: string, data: any) =>
    apiRequest<any>(`/api/pharmacy/medications/${id}`, { method: 'PUT', body: data }),
  
  deleteMedication: (id: string) =>
    apiRequest<any>(`/api/pharmacy/medications/${id}`, { method: 'DELETE' }),
  
  // Prescriptions
  getPrescriptions: (patientId?: string, status?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/pharmacy/prescriptions?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(patientId && { patientId }), ...(status && { status }) })}`),
  
  getPrescription: (id: string) =>
    apiRequest<any>(`/api/pharmacy/prescriptions/${id}`),
  
  createPrescription: (data: any) =>
    apiRequest<any>('/api/pharmacy/prescriptions', { method: 'POST', body: data }),
  
  updatePrescription: (id: string, data: any) =>
    apiRequest<any>(`/api/pharmacy/prescriptions/${id}`, { method: 'PUT', body: data }),
  
  // Inventory
  getInventory: () =>
    apiRequest<any[]>('/api/pharmacy/inventory'),
  
  // Drug Inventory
  getDrugInventory: (medicationId?: string, search?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/pharmacy/drug-inventory?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(medicationId && { medicationId }), ...(search && { search }) })}`),
  
  getDrugInventoryItem: (id: string) =>
    apiRequest<any>(`/api/pharmacy/drug-inventory/${id}`),
  
  createDrugInventoryItem: (data: any) =>
    apiRequest<any>('/api/pharmacy/drug-inventory', { method: 'POST', body: data }),
  
  updateDrugInventoryItem: (id: string, data: any) =>
    apiRequest<any>(`/api/pharmacy/drug-inventory/${id}`, { method: 'PUT', body: data }),
  
  deleteDrugInventoryItem: (id: string) =>
    apiRequest<any>(`/api/pharmacy/drug-inventory/${id}`, { method: 'DELETE' }),
};

// Laboratory API
export const laboratoryApi = {
  getTestTypes: (search?: string, category?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/laboratory/test-types?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(category && { category }) })}`),
  
  getTestTypeById: (id: string) =>
    apiRequest<any>(`/api/laboratory/test-types/${id}`),
  
  createTestType: (data: any) =>
    apiRequest<any>('/api/laboratory/test-types', { method: 'POST', body: data }),
  
  updateTestType: (id: string, data: any) =>
    apiRequest<any>(`/api/laboratory/test-types/${id}`, { method: 'PUT', body: data }),
  
  deleteTestType: (id: string) =>
    apiRequest<any>(`/api/laboratory/test-types/${id}`, { method: 'DELETE' }),
  
  getOrders: (patientId?: string, status?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/laboratory/orders?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(patientId && { patientId }), ...(status && { status }) })}`),
  
  getOrder: (id: string) =>
    apiRequest<any>(`/api/laboratory/orders/${id}`),
  
  createOrder: (data: any) =>
    apiRequest<any>('/api/laboratory/orders', { method: 'POST', body: data }),
  
  updateOrder: (id: string, data: any) =>
    apiRequest<any>(`/api/laboratory/orders/${id}`, { method: 'PUT', body: data }),

  // Results API
  getOrderResults: (orderId: string) =>
    apiRequest<any[]>(`/api/laboratory/orders/${orderId}/results`),
  
  createResult: (orderId: string, data: any) =>
    apiRequest<any>(`/api/laboratory/orders/${orderId}/results`, { method: 'POST', body: data }),
  
  updateResult: (resultId: string, data: any) =>
    apiRequest<any>(`/api/laboratory/results/${resultId}`, { method: 'PUT', body: data }),
};

// Inpatient API
export const inpatientApi = {
  getAdmissions: (status?: string, wardId?: string, page = 1, limit = 50, search?: string) =>
    apiRequest<any[]>(`/api/inpatient/admissions?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(status && { status }), ...(wardId && { wardId }), ...(search && { search }) })}`),
  
  getAdmission: (id: string) =>
    apiRequest<any>(`/api/inpatient/admissions/${id}`),
  
  createAdmission: (data: any) =>
    apiRequest<any>('/api/inpatient/admissions', { method: 'POST', body: data }),
  
  updateAdmission: (id: string, data: any) =>
    apiRequest<any>(`/api/inpatient/admissions/${id}`, { method: 'PUT', body: data }),
  
  deleteAdmission: (id: string) =>
    apiRequest<any>(`/api/inpatient/admissions/${id}`, { method: 'DELETE' }),

  getBeds: (wardId?: string, status?: string, page = 1, limit = 100) =>
    apiRequest<any[]>(`/api/inpatient/beds?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(wardId && { wardId }), ...(status && { status }) })}`),
  
  getBed: (id: string) =>
    apiRequest<any>(`/api/inpatient/beds/${id}`),
  
  updateBed: (id: string, data: any) =>
    apiRequest<any>(`/api/inpatient/beds/${id}`, { method: 'PUT', body: data }),
  
  deleteBed: (id: string) =>
    apiRequest<any>(`/api/inpatient/beds/${id}`, { method: 'DELETE' }),
  
  getWards: (wardType?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/inpatient/wards?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(wardType && { wardType }) })}`),
  
  getWard: (id: string) =>
    apiRequest<any>(`/api/inpatient/wards/${id}`),
  
  createWard: (data: any) =>
    apiRequest<any>('/api/inpatient/wards', { method: 'POST', body: data }),
  
  updateWard: (id: string, data: any) =>
    apiRequest<any>(`/api/inpatient/wards/${id}`, { method: 'PUT', body: data }),
  
  deleteWard: (id: string) =>
    apiRequest<any>(`/api/inpatient/wards/${id}`, { method: 'DELETE' }),
};

// Maternity API
export const maternityApi = {
  getAdmissions: (status?: string, page = 1, limit = 50, search?: string) =>
    apiRequest<any[]>(`/api/maternity/admissions?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(status && { status }), ...(search && { search }) })}`),
  
  getAdmission: (id: string) =>
    apiRequest<any>(`/api/maternity/admissions/${id}`),
  
  createAdmission: (data: any) =>
    apiRequest<any>('/api/maternity/admissions', { method: 'POST', body: data }),
  
  updateAdmission: (id: string, data: any) =>
    apiRequest<any>(`/api/maternity/admissions/${id}`, { method: 'PUT', body: data }),
  
  deleteAdmission: (id: string) =>
    apiRequest<any>(`/api/maternity/admissions/${id}`, { method: 'DELETE' }),

  getDeliveries: (page = 1, limit = 50, search?: string, deliveryType?: string) =>
    apiRequest<any[]>(`/api/maternity/deliveries?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(deliveryType && { deliveryType }) })}`),
  
  getDelivery: (id: string) =>
    apiRequest<any>(`/api/maternity/deliveries/${id}`),
  
  createDelivery: (data: any) =>
    apiRequest<any>('/api/maternity/deliveries', { method: 'POST', body: data }),
  
  updateDelivery: (id: string, data: any) =>
    apiRequest<any>(`/api/maternity/deliveries/${id}`, { method: 'PUT', body: data }),
};

// ICU API
export const icuApi = {
  getAdmissions: (status?: string, page = 1, limit = 50, search?: string) =>
    apiRequest<any[]>(`/api/icu/admissions?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(status && { status }), ...(search && { search }) })}`),
  
  getAdmission: (id: string) =>
    apiRequest<any>(`/api/icu/admissions/${id}`),
  
  createAdmission: (data: any) =>
    apiRequest<any>('/api/icu/admissions', { method: 'POST', body: data }),
  
  updateAdmission: (id: string, data: any) =>
    apiRequest<any>(`/api/icu/admissions/${id}`, { method: 'PUT', body: data }),
  
  deleteAdmission: (id: string) =>
    apiRequest<any>(`/api/icu/admissions/${id}`, { method: 'DELETE' }),

  getBeds: (status?: string, page = 1, limit = 100) =>
    apiRequest<any[]>(`/api/icu/beds?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(status && { status }) })}`),
  
  getBed: (id: string) =>
    apiRequest<any>(`/api/icu/beds/${id}`),
  
  createBed: (data: any) =>
    apiRequest<any>('/api/icu/beds', { method: 'POST', body: data }),
  
  updateBed: (id: string, data: any) =>
    apiRequest<any>(`/api/icu/beds/${id}`, { method: 'PUT', body: data }),
  
  deleteBed: (id: string) =>
    apiRequest<any>(`/api/icu/beds/${id}`, { method: 'DELETE' }),

  getEquipment: (status?: string, page = 1, limit = 100) =>
    apiRequest<any[]>(`/api/icu/equipment?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(status && { status }) })}`),
  
  getEquipmentById: (id: string) =>
    apiRequest<any>(`/api/icu/equipment/${id}`),
  
  createEquipment: (data: any) =>
    apiRequest<any>('/api/icu/equipment', { method: 'POST', body: data }),
  
  updateEquipment: (id: string, data: any) =>
    apiRequest<any>(`/api/icu/equipment/${id}`, { method: 'PUT', body: data }),
  
  deleteEquipment: (id: string) =>
    apiRequest<any>(`/api/icu/equipment/${id}`, { method: 'DELETE' }),
};

// Radiology API
export const radiologyApi = {
  getExamTypes: (search?: string, category?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/radiology/exam-types?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(category && { category }) })}`),
  
  getExamTypeById: (id: string) =>
    apiRequest<any>(`/api/radiology/exam-types/${id}`),
  
  createExamType: (data: any) =>
    apiRequest<any>('/api/radiology/exam-types', { method: 'POST', body: data }),
  
  updateExamType: (id: string, data: any) =>
    apiRequest<any>(`/api/radiology/exam-types/${id}`, { method: 'PUT', body: data }),
  
  deleteExamType: (id: string) =>
    apiRequest<any>(`/api/radiology/exam-types/${id}`, { method: 'DELETE' }),
  
  getOrders: (patientId?: string, status?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/radiology/orders?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(patientId && { patientId }), ...(status && { status }) })}`),
  
  getOrder: (id: string) =>
    apiRequest<any>(`/api/radiology/orders/${id}`),
  
  createOrder: (data: any) =>
    apiRequest<any>('/api/radiology/orders', { method: 'POST', body: data }),
};

// Triage API
export const triageApi = {
  getAll: (priority?: string, status?: string, search?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/triage?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(priority && { priority }), ...(status && { status }), ...(search && { search }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/triage/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/triage', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/triage/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/triage/${id}`, { method: 'DELETE' }),
  
  updateOrder: (id: string, data: any) =>
    apiRequest<any>(`/api/radiology/orders/${id}`, { method: 'PUT', body: data }),
};

// Medical Records API
export const medicalRecordsApi = {
  getAll: (search?: string, patientId?: string, doctorId?: string, visitType?: string, department?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/medical-records?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(patientId && { patientId }), ...(doctorId && { doctorId }), ...(visitType && { visitType }), ...(department && { department }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/medical-records/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/medical-records', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/medical-records/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/medical-records/${id}`, { method: 'DELETE' }),
};

// Inventory API
export const inventoryApi = {
  getAll: (category?: string, status?: string, search?: string, lowStock?: boolean) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (lowStock) params.append('lowStock', 'true');
    const query = params.toString();
    return apiRequest<any[]>(`/api/inventory${query ? `?${query}` : ''}`);
  },
  
  getSummary: () =>
    apiRequest<any>('/api/inventory/summary'),
  
  getAnalytics: (timeRange?: string) =>
    apiRequest<any>(`/api/inventory/analytics${timeRange ? `?timeRange=${timeRange}` : ''}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/inventory/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/inventory', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/inventory/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/inventory/${id}`, { method: 'DELETE' }),
};

// Inventory Transactions API
export const inventoryTransactionApi = {
  getAll: (itemId?: string, transactionType?: string, startDate?: string, endDate?: string, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (itemId) params.append('itemId', itemId);
    if (transactionType) params.append('transactionType', transactionType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<any[]>(`/api/inventory/transactions?${params.toString()}`);
  },
  
  getById: (id: string) =>
    apiRequest<any>(`/api/inventory/transactions/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/inventory/transactions', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/inventory/transactions/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/inventory/transactions/${id}`, { method: 'DELETE' }),
};

// Clinical Services API
export const clinicalServicesApi = {
  getAll: (search?: string, category?: string) =>
    apiRequest<any[]>(`/api/clinical-services?${new URLSearchParams({ ...(search && { search }), ...(category && { category }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/clinical-services/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/clinical-services', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/clinical-services/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/clinical-services/${id}`, { method: 'DELETE' }),
};

// Doctors API
export const doctorsApi = {
  getAll: (search?: string) =>
    apiRequest<any[]>(`/api/doctors?${new URLSearchParams(search ? { search } : {})}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/doctors/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/doctors', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/doctors/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/doctors/${id}`, { method: 'DELETE' }),
};

// Appointments API
export const appointmentsApi = {
  getAll: (date?: string, status?: string, doctorId?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/appointments?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(date && { date }), ...(status && { status }), ...(doctorId && { doctorId }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/appointments/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/appointments', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/appointments/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/appointments/${id}`, { method: 'DELETE' }),
};

// Workflow API
export const workflowApi = {
  // After triage, create cashier queue for consultation fees
  triageToCashier: (data: any) =>
    apiRequest<any>('/api/workflow/triage-to-cashier', { method: 'POST', body: data }),
  
  // After payment, create consultation queue
  cashierToConsultation: (data: any) =>
    apiRequest<any>('/api/workflow/cashier-to-consultation', { method: 'POST', body: data }),
  
  // After consultation, send to lab
  consultationToLab: (data: any) =>
    apiRequest<any>('/api/workflow/consultation-to-lab', { method: 'POST', body: data }),
  
  // After prescription, create cashier queue for drug payment
  prescriptionToCashier: (data: any) =>
    apiRequest<any>('/api/workflow/prescription-to-cashier', { method: 'POST', body: data }),
  
  // After drug payment, create pharmacy queue
  cashierToPharmacy: (data: any) =>
    apiRequest<any>('/api/workflow/cashier-to-pharmacy', { method: 'POST', body: data }),
  
  // Get time summary for a queue entry
  getQueueTimeSummary: (queueId: string) =>
    apiRequest<any>(`/api/workflow/queue/${queueId}/time-summary`),
  
  // Get patient queue history with time tracking
  getPatientQueueHistory: (patientId: string) =>
    apiRequest<any[]>(`/api/workflow/patients/${patientId}/queue-history`),
};

// Queue API
export const queueApi = {
  getAll: (servicePoint?: string, status?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/queue?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(servicePoint && { servicePoint }), ...(status && { status }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/queue/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/queue', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/queue/${id}`, { method: 'PUT', body: data }),
  
  updateStatus: (id: string, status: string) =>
    apiRequest<any>(`/api/queue/${id}/status`, { method: 'PUT', body: { status } }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/queue/${id}`, { method: 'DELETE' }),
};

// Ledger API
export const ledgerApi = {
  // Accounts
  getAccounts: (search?: string, accountType?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/ledger/accounts?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(accountType && { accountType }) })}`),
  
  getAccountById: (id: string) =>
    apiRequest<any>(`/api/ledger/accounts/${id}`),
  
  createAccount: (data: any) =>
    apiRequest<any>('/api/ledger/accounts', { method: 'POST', body: data }),
  
  updateAccount: (id: string, data: any) =>
    apiRequest<any>(`/api/ledger/accounts/${id}`, { method: 'PUT', body: data }),
  
  deleteAccount: (id: string) =>
    apiRequest<any>(`/api/ledger/accounts/${id}`, { method: 'DELETE' }),
  
  // Transactions
  getTransactions: (search?: string, startDate?: string, endDate?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/ledger/transactions?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(startDate && { startDate }), ...(endDate && { endDate }) })}`),
  
  getTransactionById: (id: string) =>
    apiRequest<any>(`/api/ledger/transactions/${id}`),
  
  createTransaction: (data: any) =>
    apiRequest<any>('/api/ledger/transactions', { method: 'POST', body: data }),
  
  updateTransaction: (id: string, data: any) =>
    apiRequest<any>(`/api/ledger/transactions/${id}`, { method: 'PUT', body: data }),
  
  deleteTransaction: (id: string) =>
    apiRequest<any>(`/api/ledger/transactions/${id}`, { method: 'DELETE' }),
};

// Procurement Vendors API
export const vendorApi = {
  getAll: (search?: string, status?: string, category?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/procurement/vendors?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(status && { status }), ...(category && { category }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/procurement/vendors/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/procurement/vendors', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/procurement/vendors/${id}`, { method: 'DELETE' }),
  
  // Vendor Ratings
  getRatings: (vendorId: string) =>
    apiRequest<any[]>(`/api/procurement/vendors/${vendorId}/ratings`),
  
  createRating: (vendorId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/ratings`, { method: 'POST', body: data }),
  
  // Vendor Products
  getProducts: (vendorId: string) =>
    apiRequest<any[]>(`/api/procurement/vendors/${vendorId}/products`),
  
  createProduct: (vendorId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/products`, { method: 'POST', body: data }),
  
  updateProduct: (vendorId: string, productId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/products/${productId}`, { method: 'PUT', body: data }),
  
  deleteProduct: (vendorId: string, productId: string) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/products/${productId}`, { method: 'DELETE' }),
  
  // Vendor Contracts
  getAllContracts: () =>
    apiRequest<any[]>(`/api/procurement/vendors/contracts`),
  
  getContracts: (vendorId: string) =>
    apiRequest<any[]>(`/api/procurement/vendors/${vendorId}/contracts`),
  
  createContract: (vendorId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/contracts`, { method: 'POST', body: data }),
  
  updateContract: (vendorId: string, contractId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/contracts/${contractId}`, { method: 'PUT', body: data }),
  
  deleteContract: (vendorId: string, contractId: string) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/contracts/${contractId}`, { method: 'DELETE' }),
  
  // Vendor Documents
  getDocuments: (vendorId: string) =>
    apiRequest<any[]>(`/api/procurement/vendors/${vendorId}/documents`),
  
  createDocument: (vendorId: string, formData: FormData) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/procurement/vendors/${vendorId}/documents`, {
      method: 'POST',
      body: formData,
    }).then(res => res.ok ? res.json() : Promise.reject(res)),
  
  updateDocument: (vendorId: string, documentId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/documents/${documentId}`, { method: 'PUT', body: data }),
  
  deleteDocument: (vendorId: string, documentId: string) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/documents/${documentId}`, { method: 'DELETE' }),
  
  downloadDocument: (vendorId: string, documentId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/procurement/vendors/${vendorId}/documents/${documentId}/download`,
  
  // Vendor Issues
  getIssues: (vendorId: string, status?: string, priority?: string) =>
    apiRequest<any[]>(`/api/procurement/vendors/${vendorId}/issues?${new URLSearchParams({ ...(status && { status }), ...(priority && { priority }) })}`),
  
  createIssue: (vendorId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/issues`, { method: 'POST', body: data }),
  
  updateIssue: (vendorId: string, issueId: string, data: any) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/issues/${issueId}`, { method: 'PUT', body: data }),
  
  deleteIssue: (vendorId: string, issueId: string) =>
    apiRequest<any>(`/api/procurement/vendors/${vendorId}/issues/${issueId}`, { method: 'DELETE' }),
  
  // Vendor Performance
  getPerformance: () =>
    apiRequest<any[]>(`/api/procurement/vendors/performance`),
};

// Purchase Orders API
export const purchaseOrderApi = {
  getAll: (vendorId?: string, status?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/procurement/purchase-orders?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(vendorId && { vendorId }), ...(status && { status }) })}`),
  
  getByVendor: (vendorId: string, status?: string, page = 1, limit = 50) =>
    apiRequest<any[]>(`/api/procurement/purchase-orders/vendors/${vendorId}?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(status && { status }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/procurement/purchase-orders/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/procurement/purchase-orders', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/procurement/purchase-orders/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/procurement/purchase-orders/${id}`, { method: 'DELETE' }),
};

// Employee API
export const employeeApi = {
  getAll: (search?: string, departmentId?: string, status?: string, positionId?: string, page = 1, limit = 50) =>
    apiRequest<{ employees: any[], pagination: any }>(`/api/employees?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(departmentId && { departmentId }), ...(status && { status }), ...(positionId && { positionId }) })}`),
  
  getById: (id: string) =>
    apiRequest<any>(`/api/employees/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/employees', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/employees/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/employees/${id}`, { method: 'DELETE' }),
  
  // Leave Management
  getLeave: (employeeId: string, status?: string, leaveType?: string) =>
    apiRequest<any[]>(`/api/employees/${employeeId}/leave?${new URLSearchParams({ ...(status && { status }), ...(leaveType && { leaveType }) })}`),
  
  getAllLeave: (status?: string, leaveType?: string, employeeId?: string, page = 1, limit = 50) =>
    apiRequest<{ leaves: any[], pagination: any }>(`/api/employees/leave?${new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(status && { status }), ...(leaveType && { leaveType }), ...(employeeId && { employeeId }) })}`),
  
  createLeave: (employeeId: string, data: any) =>
    apiRequest<any>(`/api/employees/${employeeId}/leave`, { method: 'POST', body: data }),
  
  updateLeave: (leaveId: string, data: any) =>
    apiRequest<any>(`/api/employees/leave/${leaveId}`, { method: 'PUT', body: data }),
  
  deleteLeave: (leaveId: string) =>
    apiRequest<any>(`/api/employees/leave/${leaveId}`, { method: 'DELETE' }),
  
  getLeaveBalance: (employeeId: string, year?: number) =>
    apiRequest<any[]>(`/api/employees/${employeeId}/leave/balance?${new URLSearchParams({ ...(year && { year: year.toString() }) })}`),
  
  // Payroll
  getSalary: (employeeId: string) =>
    apiRequest<any>(`/api/employees/${employeeId}/salary`),
  
  getSalaryHistory: (employeeId: string) =>
    apiRequest<any[]>(`/api/employees/${employeeId}/salary/history`),
  
  createSalary: (employeeId: string, data: any) =>
    apiRequest<any>(`/api/employees/${employeeId}/salary`, { method: 'POST', body: data }),
  
  getPayroll: (employeeId: string, startDate?: string, endDate?: string, status?: string) =>
    apiRequest<any[]>(`/api/employees/${employeeId}/payroll?${new URLSearchParams({ ...(startDate && { startDate }), ...(endDate && { endDate }), ...(status && { status }) })}`),
  
  createPayroll: (employeeId: string, data: any) =>
    apiRequest<any>(`/api/employees/${employeeId}/payroll`, { method: 'POST', body: data }),
  
  updatePayroll: (payrollId: string, data: any) =>
    apiRequest<any>(`/api/employees/payroll/${payrollId}`, { method: 'PUT', body: data }),
  
  // Promotions/Position History
  getPromotions: (employeeId: string) =>
    apiRequest<any[]>(`/api/employees/${employeeId}/promotions`),
  
  createPromotion: (employeeId: string, data: any) =>
    apiRequest<any>(`/api/employees/${employeeId}/promotions`, { method: 'POST', body: data }),
  
  // Attendance
  getAttendance: (employeeId: string, startDate?: string, endDate?: string) =>
    apiRequest<any[]>(`/api/employees/attendance/${employeeId}?${new URLSearchParams({ ...(startDate && { startDate }), ...(endDate && { endDate }) })}`),
  
  createAttendance: (data: any) =>
    apiRequest<any>(`/api/employees/attendance`, { method: 'POST', body: data }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    apiRequest<any>('/api/dashboard/stats'),
  
  getRecentActivities: (limit?: number) =>
    apiRequest<any>(`/api/dashboard/recent-activities?${new URLSearchParams({ ...(limit && { limit: limit.toString() }) })}`),
};

// Analytics API
export const analyticsApi = {
  getPatients: (months?: number) =>
    apiRequest<any[]>(`/api/analytics/patients?${new URLSearchParams({ ...(months && { months: months.toString() }) })}`),
  
  getRevenue: (months?: number) =>
    apiRequest<any[]>(`/api/analytics/revenue?${new URLSearchParams({ ...(months && { months: months.toString() }) })}`),
  
  getDepartments: () =>
    apiRequest<any[]>('/api/analytics/departments'),
  
  getSummary: () =>
    apiRequest<any>('/api/analytics/summary'),
};

// Service Charges API
export const serviceChargeApi = {
  getAll: (status?: string, category?: string, department?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (department) params.append('department', department);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/billing/charges?${params.toString()}`);
  },
  
  getById: (id: string) =>
    apiRequest<any>(`/api/billing/charges/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/billing/charges', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/billing/charges/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/billing/charges/${id}`, { method: 'DELETE' }),
};

// Billing/Invoice API
export const billingApi = {
  getInvoices: (patientId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (status) params.append('status', status);
    return apiRequest<any[]>(`/api/billing/invoices?${params.toString()}`);
  },
  
  getInvoiceById: (id: string) =>
    apiRequest<any>(`/api/billing/invoices/${id}`),
  
  getPendingInvoicesForPatient: (patientId: string) =>
    apiRequest<any[]>(`/api/billing/invoices/patient/${patientId}/pending`),
  
  createInvoice: (data: any) =>
    apiRequest<any>('/api/billing/invoices', { method: 'POST', body: data }),
  
  updateInvoice: (id: string, data: any) =>
    apiRequest<any>(`/api/billing/invoices/${id}`, { method: 'PUT', body: data }),
  
  deleteInvoice: (id: string) =>
    apiRequest<any>(`/api/billing/invoices/${id}`, { method: 'DELETE' }),
  
  recordPayment: (id: string, data: any) =>
    apiRequest<any>(`/api/billing/invoices/${id}/payment`, { method: 'POST', body: data }),
  
  getInvoiceStats: () =>
    apiRequest<any>('/api/billing/invoices/stats/summary'),
};

// Receivables API
export const receivableApi = {
  getAll: (status?: string, patientId?: string, search?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (patientId) params.append('patientId', patientId);
    if (search) params.append('search', search);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<any[]>(`/api/receivables?${params.toString()}`);
  },
  
  getById: (id: string) =>
    apiRequest<any>(`/api/receivables/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/receivables', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/receivables/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/receivables/${id}`, { method: 'DELETE' }),
  
  recordPayment: (id: string, data: any) =>
    apiRequest<any>(`/api/receivables/${id}/payment`, { method: 'POST', body: data }),
  
  getStats: () =>
    apiRequest<any>('/api/receivables/stats/summary'),
};

// Payables API
export const payableApi = {
  getAll: (status?: string, vendorId?: string, search?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (vendorId) params.append('vendorId', vendorId);
    if (search) params.append('search', search);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<any[]>(`/api/payables?${params.toString()}`);
  },
  
  getById: (id: string) =>
    apiRequest<any>(`/api/payables/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/payables', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/payables/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/payables/${id}`, { method: 'DELETE' }),
  
  recordPayment: (id: string, data: any) =>
    apiRequest<any>(`/api/payables/${id}/payment`, { method: 'POST', body: data }),
  
  getSummary: () =>
    apiRequest<any>('/api/payables/stats/summary'),
};

// Role API
export const roleApi = {
  getAll: () =>
    apiRequest<any[]>('/api/roles'),
  getById: (id: string) =>
    apiRequest<any>(`/api/roles/${id}`),
  create: (data: any) =>
    apiRequest<any>('/api/roles', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/roles/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    apiRequest<any>(`/api/roles/${id}`, { method: 'DELETE' }),
};

// Privilege API
export const privilegeApi = {
  getAll: (module?: string, groupByModule?: boolean) =>
    apiRequest<any[]>(`/api/privileges?${new URLSearchParams({ ...(module && { module }), ...(groupByModule && { groupByModule: 'true' }) })}`),
  getById: (id: string) =>
    apiRequest<any>(`/api/privileges/${id}`),
  create: (data: any) =>
    apiRequest<any>('/api/privileges', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/privileges/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    apiRequest<any>(`/api/privileges/${id}`, { method: 'DELETE' }),
};

// Budget API
export const budgetApi = {
  getAll: (status?: string, departmentId?: string, budgetPeriod?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (departmentId) params.append('departmentId', departmentId);
    if (budgetPeriod) params.append('budgetPeriod', budgetPeriod);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/budgets?${params.toString()}`);
  },
  
  getById: (id: string) =>
    apiRequest<any>(`/api/budgets/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/budgets', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/budgets/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/budgets/${id}`, { method: 'DELETE' }),
  
  getStats: () =>
    apiRequest<any>('/api/budgets/stats/summary'),
};

// Cash Management API
export const cashApi = {
  getTransactions: (transactionType?: string, startDate?: string, endDate?: string, search?: string) => {
    const params = new URLSearchParams();
    if (transactionType) params.append('transactionType', transactionType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/cash/transactions?${params.toString()}`);
  },
  
  getTransactionById: (id: string) =>
    apiRequest<any>(`/api/cash/transactions/${id}`),
  
  createTransaction: (data: any) =>
    apiRequest<any>('/api/cash/transactions', { method: 'POST', body: data }),
  
  updateTransaction: (id: string, data: any) =>
    apiRequest<any>(`/api/cash/transactions/${id}`, { method: 'PUT', body: data }),
  
  deleteTransaction: (id: string) =>
    apiRequest<any>(`/api/cash/transactions/${id}`, { method: 'DELETE' }),
  
  getAccounts: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/cash/accounts?${params.toString()}`);
  },
  
  getStats: () =>
    apiRequest<any>('/api/cash/stats/summary'),
};

// Asset Management API
export const assetApi = {
  getAll: (status?: string, category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/assets?${params.toString()}`);
  },
  
  getById: (id: string) =>
    apiRequest<any>(`/api/assets/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/assets', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/assets/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: string) =>
    apiRequest<any>(`/api/assets/${id}`, { method: 'DELETE' }),
  
  getStats: () =>
    apiRequest<any>('/api/assets/stats/summary'),
};

// Insurance Management API
export const insuranceApi = {
  // Providers
  getProviders: (status?: string, providerType?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (providerType) params.append('providerType', providerType);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/insurance/providers?${params.toString()}`);
  },
  
  getProviderById: (id: string) =>
    apiRequest<any>(`/api/insurance/providers/${id}`),
  
  createProvider: (data: any) =>
    apiRequest<any>('/api/insurance/providers', { method: 'POST', body: data }),
  
  updateProvider: (id: string, data: any) =>
    apiRequest<any>(`/api/insurance/providers/${id}`, { method: 'PUT', body: data }),
  
  deleteProvider: (id: string) =>
    apiRequest<any>(`/api/insurance/providers/${id}`, { method: 'DELETE' }),
  
  // Policies
  getPolicies: (patientId?: string, providerId?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (providerId) params.append('providerId', providerId);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/insurance/policies?${params.toString()}`);
  },
  
  getPolicyById: (id: string) =>
    apiRequest<any>(`/api/insurance/policies/${id}`),
  
  createPolicy: (data: any) =>
    apiRequest<any>('/api/insurance/policies', { method: 'POST', body: data }),
  
  updatePolicy: (id: string, data: any) =>
    apiRequest<any>(`/api/insurance/policies/${id}`, { method: 'PUT', body: data }),
  
  deletePolicy: (id: string) =>
    apiRequest<any>(`/api/insurance/policies/${id}`, { method: 'DELETE' }),
  
  // Statistics
  getStats: () =>
    apiRequest<any>('/api/insurance/stats/summary'),
};

// Revenue Share Management API
export const revenueShareApi = {
  // Rules
  getRules: (ruleType?: string, departmentId?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (ruleType) params.append('ruleType', ruleType);
    if (departmentId) params.append('departmentId', departmentId);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/revenue-share/rules?${params.toString()}`);
  },
  
  getRuleById: (id: string) =>
    apiRequest<any>(`/api/revenue-share/rules/${id}`),
  
  createRule: (data: any) =>
    apiRequest<any>('/api/revenue-share/rules', { method: 'POST', body: data }),
  
  updateRule: (id: string, data: any) =>
    apiRequest<any>(`/api/revenue-share/rules/${id}`, { method: 'PUT', body: data }),
  
  deleteRule: (id: string) =>
    apiRequest<any>(`/api/revenue-share/rules/${id}`, { method: 'DELETE' }),
  
  // Distributions
  getDistributions: (status?: string, startDate?: string, endDate?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/api/revenue-share/distributions?${params.toString()}`);
  },
  
  getDistributionById: (id: string) =>
    apiRequest<any>(`/api/revenue-share/distributions/${id}`),
  
  createDistribution: (data: any) =>
    apiRequest<any>('/api/revenue-share/distributions', { method: 'POST', body: data }),
  
  updateDistribution: (id: string, data: any) =>
    apiRequest<any>(`/api/revenue-share/distributions/${id}`, { method: 'PUT', body: data }),
  
  deleteDistribution: (id: string) =>
    apiRequest<any>(`/api/revenue-share/distributions/${id}`, { method: 'DELETE' }),
  
  // Statistics
  getStats: () =>
    apiRequest<any>('/api/revenue-share/stats/summary'),
};

// User API
export const userApi = {
  getAll: () =>
    apiRequest<any[]>('/api/users'),
  getById: (id: string) =>
    apiRequest<any>(`/api/users/${id}`),
  create: (data: any) =>
    apiRequest<any>('/api/users', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/users/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    apiRequest<any>(`/api/users/${id}`, { method: 'DELETE' }),
  changePassword: (id: string, data: { currentPassword: string; newPassword: string }) =>
    apiRequest<any>(`/api/users/${id}/password`, { method: 'PUT', body: data }),
};

