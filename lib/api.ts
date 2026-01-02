// API utility functions for making requests to the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    // Include both message and error fields from backend response
    const errorMessage = error.error || error.message || `HTTP error! status: ${response.status}`;
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
  
  create: (data: any) =>
    apiRequest<any>('/api/departments', { method: 'POST', body: data }),
  
  update: (id: string, data: any) =>
    apiRequest<any>(`/api/departments/${id}`, { method: 'PUT', body: data }),
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

// Inventory API
export const inventoryApi = {
  getAll: () =>
    apiRequest<any[]>('/api/inventory'),
  
  create: (data: any) =>
    apiRequest<any>('/api/inventory', { method: 'POST', body: data }),
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

