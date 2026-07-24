// ============================================================
// API ENDPOINTS SERVICE LAYER
// Reuses backend APIs for Auth, Groups, Expenses, Cycles, and Settlements.
// Maps all responses through dataMappers.js.
// Includes offline/standalone fallbacks when backend server is offline (err.status === 0).
// ============================================================

import { api } from './api';
import { mapUser, mapGroup, mapExpense, mapCycle, mapSettlement } from './dataMappers';

export const authApi = {
  async login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data?.token) {
        api.setToken(data.token);
      }
      return {
        token: data?.token || null,
        user: data?.user ? mapUser(data.user) : null,
      };
    } catch (err) {
      if (err.status === 0) {
        const mockToken = `mock-token-${Date.now()}`;
        const namePart = email.split('@')[0] || 'User';
        const mockUser = mapUser({
          id: `user-${Date.now()}`,
          name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
          email: email,
          avatar: null,
          color: '#CCFF00',
        });
        api.setToken(mockToken);
        localStorage.setItem('splitly_mock_user', JSON.stringify(mockUser));
        return {
          token: mockToken,
          user: mockUser,
        };
      }
      throw err;
    }
  },

  async register(name, email, password) {
    try {
      const data = await api.post('/auth/register', { name, email, password });
      if (data?.token) {
        api.setToken(data.token);
      }
      return {
        token: data?.token || null,
        user: data?.user ? mapUser(data.user) : null,
      };
    } catch (err) {
      if (err.status === 0) {
        const mockToken = `mock-token-${Date.now()}`;
        const mockUser = mapUser({
          id: `user-${Date.now()}`,
          name: name,
          email: email,
          avatar: null,
          color: '#CCFF00',
        });
        api.setToken(mockToken);
        localStorage.setItem('splitly_mock_user', JSON.stringify(mockUser));
        return {
          token: mockToken,
          user: mockUser,
        };
      }
      throw err;
    }
  },

  async getMe() {
    try {
      const data = await api.get('/auth/me');
      return mapUser(data?.user || data);
    } catch (err) {
      if (err.status === 0 || err.status === 408 || !err.status || err.message?.includes('fetch') || err.message?.includes('timed out')) {
        const storedMock = localStorage.getItem('splitly_mock_user');
        if (storedMock) {
          try {
            return JSON.parse(storedMock);
          } catch (e) {
            // ignore JSON parse error
          }
        }
        return mapUser({
          id: 'user-1',
          name: 'Alex Johnson',
          email: 'alex@example.com',
          avatar: null,
          color: '#CCFF00',
        });
      }
      throw err;
    }
  },

  logout() {
    api.setToken(null);
    localStorage.removeItem('splitly_mock_user');
  },
};

export const groupsApi = {
  async getGroups() {
    try {
      const data = await api.get('/groups');
      const list = Array.isArray(data) ? data : data?.groups || [];
      return list.map(mapGroup).filter(Boolean);
    } catch (err) {
      if (err.status === 0) return [];
      throw err;
    }
  },

  async getGroupMembers(groupId) {
    try {
      const data = await api.get(`/groups/${groupId}/members`);
      const list = Array.isArray(data) ? data : data?.members || [];
      return list.map(mapUser).filter(Boolean);
    } catch (err) {
      if (err.status === 0) return [];
      throw err;
    }
  },

  async createGroup(payload) {
    try {
      const data = await api.post('/groups', payload);
      return mapGroup(data?.group || data);
    } catch (err) {
      if (err.status === 0) {
        const mockUser = JSON.parse(localStorage.getItem('splitly_mock_user') || '{}');
        const shortCode = 'GRP' + Math.random().toString(36).substring(2, 5).toUpperCase();
        return mapGroup({
          id: `group-${Date.now()}`,
          name: payload.name || 'New Group',
          icon: payload.icon || '🏠',
          description: payload.description || '',
          inviteCode: shortCode,
          createdBy: mockUser.id || 'user-1',
          memberIds: [mockUser.id || 'user-1'],
          createdAt: new Date().toISOString(),
        });
      }
      throw err;
    }
  },

  async joinGroup(inviteCode) {
    try {
      const data = await api.post('/groups/join', { inviteCode });
      return mapGroup(data?.group || data);
    } catch (err) {
      if (err.status === 0) {
        const mockUser = JSON.parse(localStorage.getItem('splitly_mock_user') || '{}');
        return mapGroup({
          id: `group-joined-${Date.now()}`,
          name: `Joined Group (${inviteCode})`,
          icon: '🎉',
          description: 'Joined via invite code',
          createdBy: 'admin',
          memberIds: [mockUser.id || 'user-1'],
          createdAt: new Date().toISOString(),
        });
      }
      throw err;
    }
  },

  async leaveGroup(groupId) {
    try {
      const data = await api.post(`/groups/${groupId}/leave`, {});
      return data;
    } catch (err) {
      if (err.status === 0) {
        return { success: true };
      }
      throw err;
    }
  },
};

export const expensesApi = {
  async getExpenses(groupId = null) {
    try {
      const endpoint = groupId ? `/groups/${groupId}/expenses` : '/expenses';
      const data = await api.get(endpoint);
      const list = Array.isArray(data) ? data : data?.expenses || [];
      return list.map(mapExpense).filter(Boolean);
    } catch (err) {
      if (err.status === 0) return [];
      throw err;
    }
  },

  async createExpense(expensePayload) {
    try {
      const data = await api.post('/expenses', expensePayload);
      return mapExpense(data?.expense || data);
    } catch (err) {
      if (err.status === 0) {
        return mapExpense({
          id: `exp-${Date.now()}`,
          ...expensePayload,
          date: expensePayload.date || new Date().toISOString().split('T')[0],
        });
      }
      throw err;
    }
  },

  async updateExpense(expenseId, expensePayload) {
    try {
      const data = await api.put(`/expenses/${expenseId}`, expensePayload);
      return mapExpense(data?.expense || data);
    } catch (err) {
      if (err.status === 0) {
        return mapExpense({
          id: expenseId,
          ...expensePayload,
        });
      }
      throw err;
    }
  },

  async deleteExpense(expenseId) {
    try {
      await api.delete(`/expenses/${expenseId}`);
      return expenseId;
    } catch (err) {
      if (err.status === 0) return expenseId;
      throw err;
    }
  },
};

export const cyclesApi = {
  async getCycles(groupId = null) {
    try {
      const endpoint = groupId ? `/groups/${groupId}/cycles` : '/cycles';
      const data = await api.get(endpoint);
      const list = Array.isArray(data) ? data : data?.cycles || [];
      return list.map(mapCycle).filter(Boolean);
    } catch (err) {
      if (err.status === 0) return [];
      throw err;
    }
  },

  async startNewCycle(groupId) {
    try {
      const data = await api.post(`/groups/${groupId}/cycles`, {});
      return mapCycle(data?.cycle || data);
    } catch (err) {
      if (err.status === 0) {
        return mapCycle({
          id: `cycle-${groupId}-${Date.now()}`,
          groupId,
          startDate: new Date().toISOString(),
          status: 'active',
        });
      }
      throw err;
    }
  },
};

export const settlementsApi = {
  async getSettlementHistory(groupId = null) {
    try {
      const endpoint = groupId ? `/groups/${groupId}/settlements/history` : '/settlements/history';
      const data = await api.get(endpoint);
      const list = Array.isArray(data) ? data : data?.settlements || data?.history || [];
      return list.map(mapSettlement).filter(Boolean);
    } catch (err) {
      if (err.status === 0) return [];
      throw err;
    }
  },

  async initiateSettlement(groupId) {
    try {
      const data = await api.post(`/groups/${groupId}/settlements/initiate`, {});
      return data;
    } catch (err) {
      if (err.status === 0) {
        return { success: true, groupId };
      }
      throw err;
    }
  },

  async cancelSettlement(groupId) {
    try {
      const data = await api.post(`/groups/${groupId}/settlements/cancel`, {});
      return data;
    } catch (err) {
      if (err.status === 0) {
        return { success: true, groupId };
      }
      throw err;
    }
  },

  async confirmSettlement(groupId, memberId) {
    try {
      const data = await api.post(`/groups/${groupId}/settlements/confirm`, { memberId });
      return data;
    } catch (err) {
      if (err.status === 0) {
        return { success: true, memberId };
      }
      throw err;
    }
  },

  async completeSettlement(groupId) {
    try {
      const data = await api.post(`/groups/${groupId}/settlements/complete`, {});
      return mapSettlement(data?.settlement || data?.historyEntry || data);
    } catch (err) {
      if (err.status === 0) {
        return mapSettlement({
          id: `settle-${groupId}-${Date.now()}`,
          groupId,
          completedAt: new Date().toISOString(),
          totalSettled: 0,
        });
      }
      throw err;
    }
  },
};

export const notificationsApi = {
  async getNotifications() {
    const startTime = Date.now();
    console.log('[API START] GET /api/notifications');
    try {
      const data = await api.get('/notifications');
      console.log(`[API SUCCESS] GET /api/notifications (${Date.now() - startTime}ms)`);
      return {
        notifications: data?.notifications || [],
        unreadCount: typeof data?.unreadCount === 'number' ? data.unreadCount : 0,
      };
    } catch (err) {
      console.error(`[API ERROR] GET /api/notifications (${Date.now() - startTime}ms):`, err.message);
      if (err.status === 0) return { notifications: [], unreadCount: 0 };
      throw err;
    }
  },

  async markAsRead(notificationId) {
    const startTime = Date.now();
    console.log(`[API START] PATCH /api/notifications/${notificationId}/read`);
    try {
      const endpoint = notificationId === 'all' ? '/notifications/mark-all-read' : `/notifications/${notificationId}/read`;
      const data = notificationId === 'all' ? await api.post(endpoint, {}) : await api.patch(endpoint, {});
      console.log(`[API SUCCESS] Mark read (${Date.now() - startTime}ms)`);
      return data;
    } catch (err) {
      console.error(`[API ERROR] Mark read (${Date.now() - startTime}ms):`, err.message);
      if (err.status === 0) return { success: true };
      throw err;
    }
  },

  async sendReminder(groupId) {
    const startTime = Date.now();
    console.log(`[API START] POST /api/notifications/remind for group ${groupId}`);
    try {
      const data = await api.post('/notifications/remind', { groupId });
      console.log(`[API SUCCESS] POST /api/notifications/remind (${Date.now() - startTime}ms)`);
      return data;
    } catch (err) {
      console.error(`[API ERROR] POST /api/notifications/remind (${Date.now() - startTime}ms):`, err.message);
      if (err.status === 0) return { success: true, count: 0 };
      throw err;
    }
  },
};
