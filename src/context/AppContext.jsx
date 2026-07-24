import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  currentUser,
  allUsers,
  initialGroups,
  initialExpenses,
  initialSettlementHistory,
  initialCycles,
  getUserById as mockGetUserById,
} from '../data/mockData';
import {
  calculateExpenseShares,
  calculateMemberBalances,
  calculateGroupSummary,
  calculateOverallBalances,
  calculateSettlementTransactions,
} from '../data/balanceEngine';
import { api } from '../services/api';
import { authApi, groupsApi, expensesApi, cyclesApi, settlementsApi, notificationsApi } from '../services/apiService';
import { mapSettlement } from '../services/dataMappers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const navigate = useNavigate();
  // ── Instant Auth State Initialization from Token & Local Cache ──
  const token = api.getToken();
  const cachedUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('splitly_user') : null;
  let initialUser = null;
  if (cachedUserRaw) {
    try {
      initialUser = JSON.parse(cachedUserRaw);
    } catch (e) {
      initialUser = null;
    }
  }

  const [user, setUserState] = useState(initialUser);
  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('splitly_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('splitly_user');
    }
  }, []);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [settlements, setSettlements] = useState({});
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [groupMembers, setGroupMembers] = useState({});
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token && !!initialUser);
  const [isAuthReady, setIsAuthReady] = useState(!token || !!initialUser);
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = api.getToken();
    if (!token) return;
    try {
      const res = await notificationsApi.getNotifications();
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      if (id === 'all') {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('Failed to mark notification read:', err.message);
    }
  }, []);

  // ── Fetch members for a single group from API ─────────────────────────────
  const fetchGroupMembers = useCallback(async (groupId) => {
    const token = api.getToken();
    if (!token || !groupId) return;
    try {
      const members = await groupsApi.getGroupMembers(groupId);
      if (members && members.length > 0) {
        setGroupMembers((prev) => ({ ...prev, [groupId]: members }));
      }
    } catch (err) {
      console.warn(`Failed to fetch members for group ${groupId}:`, err.message);
    }
  }, []);

  // ── Fetch members for multiple groups in parallel ─────────────────────────
  const fetchAllGroupsMembers = useCallback(async (groupList) => {
    const token = api.getToken();
    if (!token || !groupList || groupList.length === 0) return;

    const membersMap = {};
    const missingGroupIds = [];

    groupList.forEach((group) => {
      if (group.members && group.members.length > 0) {
        membersMap[group.id] = group.members;
      } else {
        missingGroupIds.push(group.id);
      }
    });

    if (missingGroupIds.length > 0) {
      await Promise.all(
        missingGroupIds.map(async (groupId) => {
          try {
            const members = await groupsApi.getGroupMembers(groupId);
            if (members && members.length > 0) {
              membersMap[groupId] = members;
            }
          } catch (err) {
            console.warn(`Failed to fetch members for group ${groupId}:`, err.message);
          }
        })
      );
    }

    if (Object.keys(membersMap).length > 0) {
      setGroupMembers((prev) => ({ ...prev, ...membersMap }));
    }
  }, []);

  // ── Refresh Groups from API ───────────────────────────────────────────────
  const refreshGroups = useCallback(async () => {
    const token = api.getToken();
    if (!token) return;

    setIsLoadingGroups(true);
    setGroupsError(null);
    try {
      const fetchedGroups = await groupsApi.getGroups();
      if (fetchedGroups) {
        setGroups((prev) => {
          if (!prev || prev.length === 0) return fetchedGroups;
          const fetchedMap = new Map(fetchedGroups.map((g) => [String(g.id), g]));
          const merged = [...fetchedGroups];
          for (const g of prev) {
            if (!fetchedMap.has(String(g.id))) {
              merged.unshift(g);
            }
          }
          return merged;
        });
        await fetchAllGroupsMembers(fetchedGroups);
      }
    } catch (err) {
      console.warn('API group load error:', err.message);
      setGroupsError(err.message || 'Failed to fetch groups from server');
    } finally {
      setIsLoadingGroups(false);
    }
  }, [fetchAllGroupsMembers]);

  // ── Select Group & Load Group Data ───────────────────────────────────────
  const selectGroup = useCallback(async (groupId) => {
    setSelectedGroupId(groupId);
    const token = api.getToken();
    if (!token || !groupId) return;

    const hasMembers = groupMembers[groupId] && groupMembers[groupId].length > 0;
    const hasExpenses = expenses.some((e) => e.groupId === groupId);

    if (hasMembers && hasExpenses) return;

    try {
      const [groupExpenses] = await Promise.all([
        expensesApi.getExpenses(groupId).catch((err) => {
          console.warn(`Failed to fetch expenses for group ${groupId}:`, err.message);
          return null;
        }),
        !hasMembers ? fetchGroupMembers(groupId) : Promise.resolve(),
      ]);
      if (groupExpenses && groupExpenses.length > 0) {
        setExpenses((prev) => {
          const fetchedMap = new Map(groupExpenses.map((e) => [String(e.id), e]));
          const others = prev.filter((e) => e.groupId !== groupId && !fetchedMap.has(String(e.id)));
          return [...groupExpenses, ...others];
        });
      }
    } catch (err) {
      console.warn(`Failed to load group data for ${groupId}:`, err.message);
    }
  }, [fetchGroupMembers, groupMembers, expenses]);

  // ── Load all authenticated user data in parallel ─────────────────────────────
  const loadUserData = useCallback(async () => {
    setGroups((prev) => {
      if (!prev || prev.length === 0) {
        setIsLoading(true);
      }
      return prev;
    });

    try {
      const [fetchedGroups, fetchedExpenses, fetchedCycles, fetchedHistory] = await Promise.all([
        groupsApi.getGroups().catch((err) => {
          console.warn('API getGroups error:', err.message);
          return null;
        }),
        expensesApi.getExpenses().catch((err) => {
          console.warn('API getExpenses error:', err.message);
          return null;
        }),
        cyclesApi.getCycles().catch((err) => {
          console.warn('API getCycles error:', err.message);
          return null;
        }),
        settlementsApi.getSettlementHistory().catch((err) => {
          console.warn('API getSettlementHistory error:', err.message);
          return null;
        }),
        fetchNotifications().catch((err) => {
          console.warn('API fetchNotifications error:', err.message);
          return null;
        }),
      ]);

      if (fetchedGroups) {
        setGroups((prev) => {
          if (!prev || prev.length === 0) return fetchedGroups;
          const fetchedMap = new Map(fetchedGroups.map((g) => [String(g.id), g]));
          const merged = [...fetchedGroups];
          for (const g of prev) {
            if (!fetchedMap.has(String(g.id))) {
              merged.unshift(g);
            }
          }
          return merged;
        });
        await fetchAllGroupsMembers(fetchedGroups);
      }

      if (fetchedExpenses) {
        setExpenses((prev) => {
          if (!prev || prev.length === 0) return fetchedExpenses;
          const fetchedMap = new Map(fetchedExpenses.map((e) => [String(e.id), e]));
          const merged = [...fetchedExpenses];
          for (const e of prev) {
            if (!fetchedMap.has(String(e.id))) {
              merged.unshift(e);
            }
          }
          return merged;
        });
      }

      if (fetchedCycles) {
        setCycles((prev) => {
          if (!prev || prev.length === 0) return fetchedCycles;
          const fetchedMap = new Map(fetchedCycles.map((c) => [String(c.id), c]));
          const merged = [...fetchedCycles];
          for (const c of prev) {
            if (!fetchedMap.has(String(c.id))) {
              merged.unshift(c);
            }
          }
          return merged;
        });
      }

      if (fetchedHistory) {
        setSettlementHistory((prev) => {
          if (!prev || prev.length === 0) return fetchedHistory;
          const fetchedMap = new Map(fetchedHistory.map((s) => [String(s.id), s]));
          const merged = [...fetchedHistory];
          for (const s of prev) {
            if (!fetchedMap.has(String(s.id))) {
              merged.unshift(s);
            }
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Failed to load user data:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllGroupsMembers, fetchNotifications]);

  // ── Clear all user data (on logout / auth failure) ─────────────────────────
  const clearUserData = useCallback(() => {
    try {
      localStorage.removeItem('splitly_user');
    } catch (e) {}
    setUserState(null);
    setIsAuthenticated(false);
    setGroups([]);
    setExpenses([]);
    setCycles([]);
    setSettlements({});
    setSettlementHistory([]);
    setGroupMembers({});
    setSelectedGroupId(null);
  }, []);

  // ── API Data Sync & Hydration on mount ─────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function hydrateAuth() {
      const token = api.getToken();
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsAuthReady(true);
        }
        return;
      }

      try {
        const me = await authApi.getMe();
        if (me && isMounted) {
          setUser(me);
          setIsAuthenticated(true);
          setIsAuthReady(true);
          loadUserData();
        } else if (isMounted) {
          api.setToken(null);
          clearUserData();
          setIsAuthReady(true);
        }
      } catch (err) {
        console.warn('Auth hydration failed:', err.message);
        if (isMounted) {
          api.setToken(null);
          clearUserData();
          setIsAuthReady(true);
        }
      }
    }

    hydrateAuth();

    function handleUnauthorized() {
      api.setToken(null);
      clearUserData();
      showToast('Session expired. Please log in again.');
      navigate('/login', { replace: true });
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [showToast, loadUserData, clearUserData, navigate]);

  // ── Authentication Actions ────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const res = await authApi.login(email, password);
    const apiTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    console.log(`[Auth Performance] POST /auth/login API response took ${apiTime.toFixed(1)}ms`);

    let loggedUser = res.user;
    if (!loggedUser && res.token) {
      loggedUser = await authApi.getMe();
    }

    if (loggedUser) {
      // 1. Save token & user immediately
      setUser(loggedUser);
      // 2. Set authenticated state immediately
      setIsAuthenticated(true);
      setIsAuthReady(true);
      // 3. Trigger background data hydration asynchronously without blocking navigation
      loadUserData().catch((err) => {
        console.warn('[Auth Hydration] Background loadUserData error:', err.message);
      });
      showToast('Logged in successfully!');
      return res;
    } else {
      throw new Error('Failed to load user profile after login.');
    }
  }, [showToast, loadUserData, setUser]);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    let registeredUser = res.user;
    if (!registeredUser && res.token) {
      registeredUser = await authApi.getMe();
    }
    if (registeredUser) {
      setUser(registeredUser);
      setIsAuthenticated(true);
      setIsAuthReady(true);
      loadUserData();
      showToast('Account created successfully!');
      return res;
    } else {
      showToast('Registration successful!');
      return res;
    }
  }, [showToast, loadUserData, setUser]);

  const logout = useCallback(() => {
    authApi.logout();
    clearUserData();
    showToast('Logged out successfully');
    navigate('/login', { replace: true });
  }, [showToast, clearUserData, navigate]);

  // ── Dynamic User Lookup ───────────────────────────────────────────────────

  const getUserById = useCallback((id) => {
    if (!id) return null;
    // 1. Check current logged-in user
    if (user && user.id === id) return user;
    // 2. Check fetched backend group members (authoritative)
    for (const members of Object.values(groupMembers)) {
      const found = members.find((m) => m.id === id);
      if (found) return found;
    }
    // 3. Fallback to local users array (mock/offline)
    return users.find((u) => u.id === id) || null;
  }, [groupMembers, users, user]);

  // ── Data accessors ────────────────────────────────────────────────────────

  const getGroupMembers = useCallback((groupId) => {
    // 1. Prefer backend-fetched members for this group (authoritative)
    if (groupMembers[groupId] && groupMembers[groupId].length > 0) {
      return groupMembers[groupId];
    }
    // 2. Fallback: resolve from group.memberIds or group.members
    const group = groups.find((g) => g.id === groupId || String(g.id) === String(groupId));
    if (!group) return [];
    if (group.members && group.members.length > 0) return group.members;
    return (group.memberIds || []).map((id) => getUserById(id)).filter(Boolean);
  }, [groupMembers, groups, getUserById]);

  const getGroupExpenses = useCallback((groupId) => {
    return expenses.filter((e) => e.groupId === groupId);
  }, [expenses]);

  const getUserGroups = useCallback(() => {
    if (!user) return [];
    return groups.filter((g) => g.memberIds.includes(user.id));
  }, [groups, user]);

  const getAllExpensesForUser = useCallback(() => {
    if (!user) return [];
    const userGroupIds = groups
      .filter((g) => g.memberIds.includes(user.id))
      .map((g) => g.id);
    return expenses
      .filter((e) => userGroupIds.includes(e.groupId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [groups, expenses, user]);

  // ── Cycle & History Helpers ────────────────────────────────────────────────
  const getActiveCycle = useCallback((groupId) => {
    return (
      cycles.find((c) => c.groupId === groupId && c.status === 'active') || {
        id: `cycle-${groupId}-active`,
        groupId,
        startDate: new Date().toISOString(),
        endDate: null,
        status: 'active',
        settlementId: null,
      }
    );
  }, [cycles]);

  const getCompletedCycles = useCallback((groupId) => {
    return cycles
      .filter((c) => c.groupId === groupId && c.status === 'completed')
      .sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0));
  }, [cycles]);

  const getSettlementHistory = useCallback((groupId = null) => {
    if (groupId) {
      return settlementHistory
        .filter((s) => s.groupId === groupId)
        .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));
    }
    if (!user) return [];
    const userGroupIds = groups.filter((g) => g.memberIds.includes(user.id)).map((g) => g.id);
    return settlementHistory
      .filter((s) => userGroupIds.includes(s.groupId))
      .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));
  }, [settlementHistory, groups, user]);

  const getCycleExpenses = useCallback((cycleId) => {
    return expenses.filter((e) => e.cycleId === cycleId);
  }, [expenses]);

  const getSettlementDetails = useCallback((settlementId) => {
    return settlementHistory.find((s) => s.id === settlementId) || null;
  }, [settlementHistory]);

  // ── Balance derivation (all via balanceEngine) ────────────────────────────

  /** Net balances for every member in a group: { userId: number } */
  const getBalancesForGroup = useCallback((groupId) => {
    const group = groups.find((g) => g.id === groupId || String(g.id) === String(groupId));
    if (!group) return {};
    return calculateMemberBalances(groupId, expenses, group.memberIds || []);
  }, [groups, expenses]);

  /** Full group summary: totals, per-member paid/share/net */
  const getGroupSummary = useCallback((groupId) => {
    const group = groups.find((g) => g.id === groupId || String(g.id) === String(groupId));
    if (!group) return null;
    return calculateGroupSummary(groupId, expenses, group.memberIds || []);
  }, [groups, expenses]);

  /** Aggregate balances across all user's groups */
  const getTotalBalances = useCallback(() => {
    if (!user) return { totalBalance: 0, totalOwed: 0, totalOwe: 0 };
    const userGroups = groups.filter((g) => g.memberIds.includes(user.id));
    return calculateOverallBalances(userGroups, expenses, user.id);
  }, [groups, expenses, user]);

  // ── Expense mutations ─────────────────────────────────────────────────────

  const addExpense = useCallback(async (expense) => {
    const participants = expense.participants || expense.splitAmong || [];
    const expAmount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount) || 0;

    const tempExp = {
      amount: expAmount,
      splitAmong: [...participants],
      splitType: expense.splitType || 'equal',
      shares: expense.shares || undefined,
    };
    const shares = calculateExpenseShares(tempExp);

    const token = api.getToken();

    // ── Backend-connected path ──
    if (token) {
      const payload = {
        groupId: expense.groupId,
        title: expense.title,
        emoji: expense.emoji || '💰',
        amount: expAmount,
        paidBy: expense.paidBy,
        participants: [...participants],
        splitType: expense.splitType || 'equal',
        shares,
        date: expense.date || new Date().toISOString().split('T')[0],
      };

      const created = await expensesApi.createExpense(payload);
      setExpenses((prev) => [created, ...prev]);
      showToast('Expense added successfully!');
      return created;
    }

    // ── Offline / no-token fallback (local-only) ──
    let activeCycle = cycles.find((c) => c.groupId === expense.groupId && c.status === 'active');
    if (!activeCycle) {
      activeCycle = {
        id: `cycle-${expense.groupId}-active`,
        groupId: expense.groupId,
        startDate: new Date().toISOString(),
        endDate: null,
        status: 'active',
        settlementId: null,
      };
    }

    const newExpense = {
      id: `exp-${Date.now()}`,
      groupId: expense.groupId,
      cycleId: activeCycle.id,
      title: expense.title,
      emoji: expense.emoji || '💰',
      amount: expAmount,
      paidBy: expense.paidBy,
      splitAmong: [...participants],
      participants: [...participants],
      splitType: expense.splitType || 'equal',
      shares,
      date: expense.date || new Date().toISOString().split('T')[0],
      createdAt: expense.createdAt || new Date().toISOString(),
      settled: false,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    showToast('Expense added successfully!');
    return newExpense;
  }, [cycles, showToast]);

  const updateExpense = useCallback(async (expenseId, updatedExpense) => {
    const participants = updatedExpense.participants || updatedExpense.splitAmong || [];
    const expAmount = typeof updatedExpense.amount === 'number' ? updatedExpense.amount : parseFloat(updatedExpense.amount) || 0;

    const tempExp = {
      amount: expAmount,
      splitAmong: [...participants],
      splitType: updatedExpense.splitType || 'equal',
      shares: updatedExpense.shares || undefined,
    };
    const shares = calculateExpenseShares(tempExp);

    const token = api.getToken();

    // ── Backend-connected path ──
    if (token) {
      const payload = {
        groupId: updatedExpense.groupId,
        title: updatedExpense.title,
        emoji: updatedExpense.emoji || '💰',
        amount: expAmount,
        paidBy: updatedExpense.paidBy,
        participants: [...participants],
        splitType: updatedExpense.splitType || 'equal',
        shares,
        date: updatedExpense.date || undefined,
      };

      const updated = await expensesApi.updateExpense(expenseId, payload);
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expenseId ? updated : exp))
      );
      showToast('Expense updated successfully!');
      return updated;
    }

    // ── Offline / no-token fallback (local-only) ──
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId
          ? {
              ...exp,
              groupId: updatedExpense.groupId,
              title: updatedExpense.title,
              emoji: updatedExpense.emoji || exp.emoji || '💰',
              amount: expAmount,
              paidBy: updatedExpense.paidBy,
              splitAmong: [...participants],
              participants: [...participants],
              splitType: updatedExpense.splitType || 'equal',
              shares,
              date: updatedExpense.date || exp.date,
            }
          : exp
      )
    );
    showToast('Expense updated successfully!');
  }, [showToast]);

  const deleteExpense = useCallback(async (expenseId) => {
    const token = api.getToken();

    // Optimistically remove from local state immediately for 0ms UI latency
    setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));

    if (token) {
      try {
        await expensesApi.deleteExpense(expenseId);
      } catch (err) {
        console.warn('Failed to delete expense on backend:', err.message);
        showToast(err.message || 'Failed to delete expense on server');
        return;
      }
    }

    showToast('Expense deleted successfully!');
  }, [showToast]);

  // ── Settlement mutations ──────────────────────────────────────────────────

  const initiateSettlement = useCallback(async (groupId) => {
    const startTime = Date.now();
    console.log(`[SETTLEMENT START] Initiating settlement for group ${groupId} by user ${user?.id}`);
    const token = api.getToken();
    if (token) {
      try {
        const res = await settlementsApi.initiateSettlement(groupId);
        const mappedSettlement = res?.settlement ? mapSettlement(res.settlement) : null;
        const confirmationsList = mappedSettlement?.confirmations || (Array.isArray(res?.confirmations)
          ? res.confirmations.map(String)
          : [user ? user.id : '']);

        setSettlements((prev) => ({
          ...prev,
          [groupId]: {
            status: mappedSettlement?.status || res?.status || 'pending',
            confirmations: confirmationsList,
            initiatedAt: mappedSettlement?.createdAt || new Date().toISOString(),
          },
        }));
        console.log(`[SETTLEMENT START SUCCESS] Group ${groupId} (${Date.now() - startTime}ms)`);
        showToast('Settlement initiated!');
        return res;
      } catch (err) {
        console.warn('Backend initiateSettlement error, using local fallback:', err.message);
      }
    }

    setSettlements((prev) => ({
      ...prev,
      [groupId]: {
        status: 'pending',
        confirmations: user ? [user.id] : [],
        initiatedAt: new Date().toISOString(),
      },
    }));
  }, [user, showToast]);

  const confirmSettlement = useCallback(async (groupId, memberId) => {
    const startTime = Date.now();
    console.log(`[SETTLEMENT CONFIRM] Member ${memberId} confirming settlement for group ${groupId}`);
    const token = api.getToken();
    if (token) {
      try {
        const res = await settlementsApi.confirmSettlement(groupId, memberId);
        const mappedSettlement = res?.settlement ? mapSettlement(res.settlement) : null;
        setSettlements((prev) => {
          const s = prev[groupId] || { status: 'pending', confirmations: [] };
          const backendConfs = mappedSettlement?.confirmations || (Array.isArray(res?.confirmations)
            ? res.confirmations.map(String)
            : s.confirmations.includes(memberId)
            ? s.confirmations
            : [...s.confirmations, memberId]);

          const group = groups.find((g) => g.id === groupId);
          const allConfirmed = group && backendConfs.length >= group.memberIds.length;

          return {
            ...prev,
            [groupId]: {
              ...s,
              confirmations: backendConfs,
              status: mappedSettlement?.status || res?.status || (allConfirmed ? 'completed' : 'pending'),
            },
          };
        });
        console.log(`[SETTLEMENT CONFIRM SUCCESS] Member ${memberId} confirmed (${Date.now() - startTime}ms)`);
        return res;
      } catch (err) {
        console.warn('Backend confirmSettlement error, using local fallback:', err.message);
      }
    }

    setSettlements((prev) => {
      const s = prev[groupId];
      if (!s) return prev;
      if (s.confirmations.includes(memberId)) return prev;

      const newConfirmations = [...s.confirmations, memberId];
      const group = groups.find((g) => g.id === groupId);
      const allConfirmed = group && newConfirmations.length >= group.memberIds.length;

      return {
        ...prev,
        [groupId]: {
          ...s,
          confirmations: newConfirmations,
          status: allConfirmed ? 'completed' : 'pending',
        },
      };
    });
  }, [groups]);

  const completeSettlement = useCallback(async (groupId) => {
    const startTime = Date.now();
    console.log(`[SETTLEMENT COMPLETE] Completing settlement for group ${groupId}`);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;

    let activeCycle = cycles.find((c) => c.groupId === groupId && c.status === 'active');
    if (!activeCycle) {
      activeCycle = {
        id: `cycle-${groupId}-active`,
        groupId,
        startDate: new Date().toISOString(),
        endDate: null,
        status: 'active',
        settlementId: null,
      };
    }

    // 1. Calculate active member balances before settling
    const activeBalances = calculateMemberBalances(groupId, expenses, group.memberIds);

    // 2. Generate minimum suggested transactions to settle the debts
    const transactions = calculateSettlementTransactions(activeBalances);

    // 3. Total outstanding settled amount is sum of transaction amounts
    const totalSettled = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    const completionDate = new Date().toISOString();
    const token = api.getToken();
    let historyEntry = null;

    if (token) {
      try {
        const res = await settlementsApi.completeSettlement(groupId);
        if (res) historyEntry = res;
      } catch (err) {
        console.warn('Backend completeSettlement API error, using local computation:', err.message);
      }
    }

    if (!historyEntry) {
      const settlementId = `settle-${Date.now()}`;
      historyEntry = {
        id: settlementId,
        groupId,
        cycleId: activeCycle.id,
        completedAt: completionDate,
        completedBy: user ? user.id : '',
        confirmations: [...group.memberIds],
        transactions,
        totalSettled: Math.round(totalSettled * 100) / 100,
        balancesBeforeSettlement: activeBalances,
        status: 'completed',
      };
    }

    // 4. Close active cycle & spawn a new active cycle
    const closedCycle = {
      ...activeCycle,
      endDate: historyEntry.completedAt || completionDate,
      status: 'completed',
      settlementId: historyEntry.id,
    };
    const newActiveCycle = {
      id: `cycle-${groupId}-${Date.now()}`,
      groupId,
      startDate: historyEntry.completedAt || completionDate,
      endDate: null,
      status: 'active',
      settlementId: null,
    };

    setCycles((prev) => [
      ...prev.map((c) => (c.id === activeCycle.id ? closedCycle : c)),
      newActiveCycle,
    ]);

    // 5. Mark all currently active (unsettled) expenses for this group as settled & link cycleId
    setExpenses((prev) =>
      prev.map((e) =>
        e.groupId === groupId && !e.settled
          ? { ...e, settled: true, settlementId: historyEntry.id, cycleId: activeCycle.id }
          : e
      )
    );

    // 6. Remove active settlement confirmations tracking
    setSettlements((prev) => {
      const copy = { ...prev };
      delete copy[groupId];
      return copy;
    });

    // 7. Save settlement entry in history
    setSettlementHistory((prev) => [historyEntry, ...prev]);

    return historyEntry;
  }, [groups, expenses, cycles, user]);

  const startNewCycle = useCallback(async (groupId) => {
    const token = api.getToken();
    if (token) {
      try {
        const newCycle = await cyclesApi.startNewCycle(groupId);
        if (newCycle) {
          setCycles((prev) => [
            ...prev.filter((c) => c.groupId !== groupId || c.status !== 'active'),
            newCycle,
          ]);
        }
      } catch (err) {
        console.warn('Backend startNewCycle API error:', err.message);
      }
    }

    // Ensures active settlement states are cleared for the group
    setSettlements((prev) => {
      const copy = { ...prev };
      delete copy[groupId];
      return copy;
    });
    showToast('New cycle started successfully!');
  }, [showToast]);

  const cancelSettlement = useCallback(async (groupId) => {
    const token = api.getToken();
    if (token) {
      try {
        await settlementsApi.cancelSettlement(groupId);
      } catch (err) {
        console.warn('Backend cancelSettlement API call:', err.message);
      }
    }
    setSettlements((prev) => {
      const copy = { ...prev };
      delete copy[groupId];
      return copy;
    });
    showToast('Settlement cancelled. Active cycle unlocked.');
  }, [showToast]);

  const leaveGroup = useCallback(async (groupId) => {
    const token = api.getToken();
    if (token) {
      await groupsApi.leaveGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast('Left group successfully.');
    }
  }, [showToast]);

  // ── Group Mutations ───────────────────────────────────────────────────────

  const createGroup = useCallback(async (groupPayload) => {
    const token = api.getToken();
    if (token) {
      const newGroup = await groupsApi.createGroup(groupPayload);
      if (newGroup) {
        setGroups((prev) => [newGroup, ...prev.filter((g) => String(g.id) !== String(newGroup.id))]);
        if (newGroup.members && newGroup.members.length > 0) {
          setGroupMembers((prev) => ({ ...prev, [newGroup.id]: newGroup.members }));
        } else {
          fetchGroupMembers(newGroup.id);
        }
        setSelectedGroupId(newGroup.id);
        showToast('Group created successfully!');
        return newGroup;
      }
      throw new Error('Failed to create group on server.');
    }
    throw new Error('Authentication token required.');
  }, [showToast, fetchGroupMembers]);

  const joinGroup = useCallback(async (inviteCode) => {
    const token = api.getToken();
    if (token) {
      const joinedGroup = await groupsApi.joinGroup(inviteCode);
      if (joinedGroup) {
        setGroups((prev) => {
          const exists = prev.find((g) => String(g.id) === String(joinedGroup.id));
          return exists ? prev.map((g) => (String(g.id) === String(joinedGroup.id) ? joinedGroup : g)) : [joinedGroup, ...prev];
        });
        if (joinedGroup.members && joinedGroup.members.length > 0) {
          setGroupMembers((prev) => ({ ...prev, [joinedGroup.id]: joinedGroup.members }));
        } else {
          fetchGroupMembers(joinedGroup.id);
        }
        setSelectedGroupId(joinedGroup.id);
        showToast('Joined group successfully!');
        return joinedGroup;
      }
      throw new Error('Failed to join group. Please check invite code.');
    }
    throw new Error('Authentication token required.');
  }, [showToast, fetchGroupMembers]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    user,
    allUsers,
    groups,
    selectedGroupId,
    isLoadingGroups,
    groupsError,
    refreshGroups,
    selectGroup,
    expenses,
    cycles,
    settlements,
    settlementHistory,
    isLoading,
    isAuthenticated,
    isAuthReady,
    login,
    register,
    logout,
    createGroup,
    joinGroup,
    leaveGroup,
    toast,
    showToast,
    getGroupMembers,
    getGroupExpenses,
    getUserGroups,
    getBalancesForGroup,
    getGroupSummary,
    getTotalBalances,
    getAllExpensesForUser,
    getActiveCycle,
    getCompletedCycles,
    getSettlementHistory,
    getCycleExpenses,
    getSettlementDetails,
    addExpense,
    updateExpense,
    deleteExpense,
    initiateSettlement,
    confirmSettlement,
    completeSettlement,
    cancelSettlement,
    startNewCycle,
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,
    getUserById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
