export const clearanceService = {
  async getClearances(userId?: string) {
    const url = userId ? `/api/clearances?userId=${userId}` : '/api/clearances';
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[clearanceService.getClearances]', await res.text());
      return [];
    }
    const { data } = await res.json();
    return data;
  },

  async getCategories() {
    const res = await fetch('/api/clearances/categories');
    if (!res.ok) {
      console.error('[clearanceService.getCategories]', await res.text());
      return [];
    }
    const { data } = await res.json();
    return data;
  },

  async uploadDocument(employeeId: string, employeeName: string, officeName: string) {
    const res = await fetch('/api/clearances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, employeeName, officeName }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to upload document');
    }
    return res.json();
  },

  async updateStatus(id: string, status: string, rejectionReason?: string, reviewedBy?: string) {
    const res = await fetch(`/api/clearances/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionReason, reviewedBy }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to update clearance status');
    }
    return res.json();
  },

  async updateClearanceStatus(id: string, status: string, rejectionReason?: string, reviewedBy?: string) {
    return this.updateStatus(id, status, rejectionReason, reviewedBy);
  },

  async saveClearanceNotes(clearanceId: string, note: string, officerId: string, officerName: string) {
    const res = await fetch(`/api/clearances/${clearanceId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officerId, officerName, note }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to save notes');
    }
    return res.json();
  },

  async getClearanceNotes(clearanceId: string) {
    const res = await fetch(`/api/clearances/${clearanceId}/notes`);
    if (!res.ok) {
      console.error('[clearanceService.getClearanceNotes]', await res.text());
      return [];
    }
    const { data } = await res.json();
    return data || [];
  },
};