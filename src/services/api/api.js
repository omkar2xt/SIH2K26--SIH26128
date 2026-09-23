import { apiClient } from './client';

export const api = {
  auth: {
    login: (username, password) => apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },
  farms: {
    getAll: () => apiClient('/farms'),
  },
  animals: {
    getAll: () => apiClient('/animals'),
    getById: (id) => apiClient(`/animals/${id}`)
  },
  observations: {
    create: (data) => apiClient('/observations', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  intelligence: {
    evaluate: (animalId, currentReadings) => apiClient('/intelligence/evaluate', {
      method: 'POST',
      body: JSON.stringify({ animalId, currentReadings })
    })
  },
  alerts: {
    getAll: () => apiClient('/alerts?page=1&pageSize=100'),
    acknowledge: (id) => apiClient(`/alerts/${id}/acknowledge`, { method: 'PUT' })
  },
  cases: {
    /** GET /cases — list cases scoped to the authenticated user's role */
    getAll: (params = {}) => apiClient('/cases?' + new URLSearchParams({ page: 1, pageSize: 100, ...params })),

    /** GET /cases/:id — single case with full authorization */
    getById: (id) => apiClient(`/cases/${id}`),

    /** POST /cases — manual case creation (vet/official/admin only) */
    create: (data) => apiClient('/cases', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    /** POST /cases/from-alert/:alertId — create case from an alert */
    fromAlert: (alertId) => apiClient(`/cases/from-alert/${alertId}`, {
      method: 'POST'
    }),

    /** PUT /cases/:id/assign — assign a veterinarian */
    assign: (id, assignedVetId) => apiClient(`/cases/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ assignedVetId })
    }),

    /** PUT /cases/:id/status — advance case status (state machine enforced server-side) */
    updateStatus: (id, status, clinicalNotes) => apiClient(`/cases/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...(clinicalNotes ? { clinicalNotes } : {}) })
    }),

    /** POST /cases/:id/assessment — record veterinarian clinical assessment */
    addAssessment: (id, vetAssessment, suspectedDiseaseId) => apiClient(`/cases/${id}/assessment`, {
      method: 'POST',
      body: JSON.stringify({ vetAssessment, ...(suspectedDiseaseId ? { suspectedDiseaseId } : {}) })
    }),
  }
};

