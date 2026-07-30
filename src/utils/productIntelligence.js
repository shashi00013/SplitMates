import { formatCurrency } from '../data/mockData';
import { calculateSettlementTransactions } from '../data/balanceEngine';

/**
 * Reusable Product Intelligence Layer for SplitMates
 * Derives proactive actions, group health signals, and financial insights
 * from pure existing state without any side-effects or network calls.
 */

/**
 * Derives prioritized contextual actions.
 * Hierarchy:
 * 1. Required action (Settlement confirmation needed)
 * 2. Financial action (Significant receivable / payable balance)
 * 3. Important reminder (New group with no expenses)
 * 4. Helpful suggestion (Quiet group with no recent activity)
 */
export function deriveProactiveActions({
  user,
  userGroups = [],
  settlements = {},
  allExpenses = [],
  getBalancesForGroup,
  getUserById,
}) {
  const actions = [];
  if (!user) return actions;

  // 1. REQUIRED ACTIONS — Pending Settlement Confirmations
  userGroups.forEach((group) => {
    const settlement = settlements[group.id];
    if (settlement && settlement.status === 'pending') {
      const confirmations = settlement.confirmations || [];
      const userConfirmed = confirmations.includes(user.id);
      if (!userConfirmed) {
        actions.push({
          id: `settle-confirm-${group.id}`,
          priority: 1,
          type: 'required',
          title: 'Please confirm your payment',
          subtitle: `Confirm your payment to finish clearing bills in "${group.name}".`,
          ctaLabel: 'Confirm Now',
          targetRoute: `/settle/${group.id}`,
          badge: 'Action Required',
          badgeColor: 'var(--warning)',
        });
      }
    }
  });

  // 2. FINANCIAL ACTIONS — Highest Pending Balance
  let maxReceivable = { amount: 0, member: null, groupId: null };
  let maxPayable = { amount: 0, member: null, groupId: null };

  userGroups.forEach((group) => {
    if (getBalancesForGroup) {
      const balances = getBalancesForGroup(group.id);
      const txs = calculateSettlementTransactions(balances);
      txs.forEach((tx) => {
        if (tx.to === user.id) {
          if (tx.amount > maxReceivable.amount) {
            const debtor = getUserById ? getUserById(tx.from) : null;
            maxReceivable = { amount: tx.amount, member: debtor, groupId: group.id };
          }
        } else if (tx.from === user.id) {
          if (tx.amount > maxPayable.amount) {
            const creditor = getUserById ? getUserById(tx.to) : null;
            maxPayable = { amount: tx.amount, member: creditor, groupId: group.id };
          }
        }
      });
    }
  });

  if (maxReceivable.amount > 0 && maxReceivable.member) {
    const name = maxReceivable.member.firstName || maxReceivable.member.name || 'A person';
    actions.push({
      id: `financial-receivable-${maxReceivable.groupId}`,
      priority: 2,
      type: 'financial',
      title: `${name} needs to pay you ${formatCurrency(maxReceivable.amount)}`,
      subtitle: `Clear bills whenever you're ready.`,
      ctaLabel: 'Clear bills',
      targetRoute: `/settle/${maxReceivable.groupId}`,
      badge: 'You Get',
      badgeColor: 'var(--accent)',
    });
  } else if (maxPayable.amount > 0 && maxPayable.member) {
    const name = maxPayable.member.firstName || maxPayable.member.name || 'a person';
    actions.push({
      id: `financial-payable-${maxPayable.groupId}`,
      priority: 2,
      type: 'financial',
      title: `You need to pay ${name} ${formatCurrency(maxPayable.amount)}`,
      subtitle: `Clear your balance to keep things simple.`,
      ctaLabel: 'Pay Now',
      targetRoute: `/settle/${maxPayable.groupId}`,
      badge: 'You Pay',
      badgeColor: 'var(--negative)',
    });
  }

  // 3. IMPORTANT REMINDERS — Group with zero expenses
  userGroups.forEach((group) => {
    const groupExpenses = allExpenses.filter((e) => e.groupId === group.id);
    if (groupExpenses.length === 0) {
      actions.push({
        id: `reminder-no-expenses-${group.id}`,
        priority: 3,
        type: 'reminder',
        title: `No bills in "${group.name}" yet`,
        subtitle: 'Add your first bill to start splitting.',
        ctaLabel: 'Add a bill',
        targetRoute: `/add-expense?groupId=${group.id}`,
        badge: 'New Group',
        badgeColor: 'var(--accent)',
      });
    }
  });

  // Sort by priority (1 = highest)
  return actions.sort((a, b) => a.priority - b.priority);
}

/**
 * Derives a subtle group health status signal based purely on real group state.
 */
export function deriveGroupHealthSignal(group, groupExpenses = [], settlement = null) {
  if (settlement && settlement.status === 'pending') {
    return {
      key: 'settlement_in_progress',
      label: 'Clearing bills...',
      color: 'var(--warning)',
      badgeBg: 'rgba(255, 165, 2, 0.12)',
    };
  }

  const activeUnsettled = groupExpenses.filter((e) => !e.settled);
  if (activeUnsettled.length > 0) {
    return {
      key: 'active_expenses',
      label: `${activeUnsettled.length} ${activeUnsettled.length === 1 ? 'bill' : 'bills'}`,
      color: 'var(--accent)',
      badgeBg: 'rgba(204, 255, 0, 0.12)',
    };
  }

  return {
    key: 'all_settled',
    label: 'All clear',
    color: 'var(--positive)',
    badgeBg: 'rgba(46, 213, 115, 0.12)',
  };
}

/**
 * Derives real-data financial insights if sufficient data exists.
 */
export function deriveFinancialInsights({ userGroups = [], allExpenses = [] }) {
  const insights = [];
  if (allExpenses.length === 0) return insights;

  // 1. Most used group by expense count
  const groupCounts = {};
  allExpenses.forEach((exp) => {
    groupCounts[exp.groupId] = (groupCounts[exp.groupId] || 0) + 1;
  });

  let topGroupId = null;
  let topCount = 0;
  Object.entries(groupCounts).forEach(([gid, cnt]) => {
    if (cnt > topCount) {
      topCount = cnt;
      topGroupId = gid;
    }
  });

  const topGroup = userGroups.find((g) => g.id === topGroupId);
  if (topGroup && topCount > 1) {
    insights.push({
      id: 'insight-most-active-group',
      title: 'Most used group',
      text: `"${topGroup.name}" has ${topCount} bills added.`,
      icon: '🔥',
    });
  }

  // 2. Biggest bill
  let maxExpense = null;
  allExpenses.forEach((exp) => {
    if (!maxExpense || exp.amount > maxExpense.amount) {
      maxExpense = exp;
    }
  });

  if (maxExpense && maxExpense.amount > 0) {
    const expGroup = userGroups.find((g) => g.id === maxExpense.groupId);
    insights.push({
      id: 'insight-largest-expense',
      title: 'Biggest bill',
      text: `"${maxExpense.title}" (${formatCurrency(maxExpense.amount)}) in ${expGroup?.name || 'Group'}.`,
      icon: '💎',
    });
  }

  return insights;
}

