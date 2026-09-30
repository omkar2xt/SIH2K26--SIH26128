import { apiClient } from './client';
import { offlineSync } from '../../db/offlineSync';

export const api = {
  auth: {
    login: (username, password) => apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    me: () => apiClient('/auth/me')
  },
  farms: {
    getAll: () => apiClient('/farms'),
  },
  species: {
    getAll: () => apiClient('/species'),
  },
  breeds: {
    getAll: () => apiClient('/breeds'),
  },
  diseases: {
    getAll: () => apiClient('/diseases'),
    getAssociatedAnimals: (diseaseId) => apiClient(`/diseases/${diseaseId}/associated-animals`)
  },
  animals: {
    getAll: (params = {}) => apiClient('/animals?' + new URLSearchParams({ page: 1, pageSize: 100, ...params })),
    getById: (idOrTag) => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrTag);
      if (isUUID) {
        return apiClient(`/animals/${idOrTag}`);
      }
      return apiClient(`/animals/by-tag/${encodeURIComponent(idOrTag)}`);
    },
    create: (data) => apiClient('/animals', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  sync: {
    push: (operations) => apiClient('/sync', {
      method: 'POST',
      body: JSON.stringify({ operations })
    })
  },
  observations: {
    getAll: (params = { page: 1, pageSize: 100 }) => {
      const q = new URLSearchParams(params).toString();
      return apiClient(`/observations?${q}`);
    },
    create: async (data) => {
      // Offline-first approach
      if (!navigator.onLine || window.__FORCE_OFFLINE__) {
        const id = await offlineSync.queueOperation('observation', 'CREATE', data);
        return { id, offline: true, status: 'PENDING' };
      }
      try {
        return await apiClient('/observations', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      } catch (err) {
        // If network error, fallback to queue
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          const id = await offlineSync.queueOperation('observation', 'CREATE', data);
          return { id, offline: true, status: 'PENDING' };
        }
        throw err;
      }
    }
  },
  intelligence: {
    getHealthFingerprint: (animalId) => apiClient(`/health-fingerprint/${animalId}`),
    evaluate: (animalId, currentReadings) => apiClient('/intelligence/evaluate', {
      method: 'POST',
      body: JSON.stringify({ animalId, currentReadings })
    })
  },
  alerts: {
    getAll: () => apiClient('/alerts?page=1&pageSize=100'),
    acknowledge: (id) => apiClient(`/alerts/${id}/acknowledge`, { method: 'PUT' }),
    resolve: (alertId, payload) => apiClient.put(
      `/alerts/${alertId}/resolve`,
      typeof payload === 'string' ? { resolutionNote: payload } : (payload || {})
    )
  },
  snapshots: {
    getById: (id) => apiClient(`/snapshots/${id}`),
    getByAnimal: (animalId) => apiClient(`/animals/${animalId}/snapshots`),
    getByAlert: (alertId) => apiClient(`/alerts/${alertId}/snapshot`),
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
  },

  lab: {
    /** GET /lab/reference — SampleTypes, LabFacilities, DiagnosticMethods for dropdowns */
    getReference: () => apiClient('/lab/reference'),

    /** GET /lab/orders — list orders scoped to authenticated user */
    getOrders: (params = {}) => apiClient('/lab/orders?' + new URLSearchParams({ page: 1, pageSize: 100, ...params })),

    /** GET /lab/orders/:id — single order with full detail */
    getOrder: (id) => apiClient(`/lab/orders/${id}`),

    /** POST /lab/orders — create lab order + sample + test atomically */
    createOrder: (data) => apiClient('/lab/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    /** PUT /lab/orders/:id/status — advance order status */
    updateOrderStatus: (id, status) => apiClient(`/lab/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

    /** GET /lab/tests/:testId/result — get result for a specific test */
    getTestResult: (testId) => apiClient(`/lab/tests/${testId}/result`),

    /** POST /lab/tests/:testId/result — record lab result; triggers case transition server-side */
    recordResult: (testId, resultOutcome, remarks, quantitativeValue, verifiedBy) =>
      apiClient(`/lab/tests/${testId}/result`, {
        method: 'POST',
        body: JSON.stringify({
          resultOutcome,
          ...(remarks            ? { remarks }            : {}),
          ...(quantitativeValue  ? { quantitativeValue }  : {}),
          ...(verifiedBy         ? { verifiedBy }         : {}),
        })
      }),
  },
  vaccination: {
    getReference: () => apiClient('/vaccinations/reference'),
    getStats: () => apiClient('/vaccinations/stats'),
    getRecords: (params) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page);
      if (params?.pageSize) q.append('pageSize', params.pageSize);
      return apiClient(`/vaccinations?${q}`);
    },
    create: (data) => apiClient('/vaccinations', { method: 'POST', body: JSON.stringify(data) })
  },
  gis: {
    getMapData: () => apiClient('/gis/map-data')
  },
  epidemiology: {
    getExposures: (params) => {
      const q = new URLSearchParams(params).toString();
      return apiClient(`/epidemiology/exposure?${q}`);
    },
    getClusters: (params) => {
      const q = new URLSearchParams(params).toString();
      return apiClient(`/epidemiology/clusters?${q}`);
    },
    verifyCluster: (id, payload) => apiClient(`/epidemiology/clusters/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  },
  simulation: {
    step: (step) => apiClient('/simulation/step', {
      method: 'POST',
      body: JSON.stringify({ step })
    })
  }
};

