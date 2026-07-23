// ============================================================
// BALANCE ENGINE — Pure calculation functions
// All balances are derived from expenses. Never stored manually.
//
// Convention:
//   positive balance = member should receive money (paid more than their share)
//   negative balance = member owes money        (paid less than their share)
//
// Invariant: sum of all member balances in a group === 0
// ============================================================

/**
 * Calculate per-participant shares for a single expense.
 * Handles integer-cent precision so shares always sum to the exact original amount.
 *
 * @param {Object} expense - { amount: number, splitAmong: string[], splitType: string, shares?: Object }
 * @returns {{ [userId: string]: number }} share per participant (always positive)
 */
export function calculateExpenseShares(expense) {
  const { amount, splitAmong, shares: precomputed } = expense;
  const participants = splitAmong || [];
  const count = participants.length;
  if (count === 0 || !amount || amount <= 0) return {};

  const totalCents = Math.round(amount * 100);

  // If pre-computed shares are provided and they sum correctly down to exact cents, use them
  if (precomputed && typeof precomputed === 'object') {
    const keys = Object.keys(precomputed);
    if (keys.length > 0) {
      const sumCents = keys.reduce((s, k) => s + Math.round((precomputed[k] || 0) * 100), 0);
      if (sumCents === totalCents) {
        const exactShares = {};
        keys.forEach((k) => { exactShares[k] = Math.round((precomputed[k] || 0) * 100) / 100; });
        return exactShares;
      }
    }
  }

  // Equal split with integer cent remainder distribution:
  // Give each participant floor(totalCents / count) cents,
  // then distribute the remainder 1 cent at a time.
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count; // 0 ≤ remainder < count

  const result = {};
  participants.forEach((id, i) => {
    const cents = baseCents + (i < remainder ? 1 : 0);
    result[id] = cents / 100;
  });

  return result;
}

/**
 * Calculate net balance for every member in a group.
 * Uses integer cents internally for zero-sum invariant precision.
 *
 * @param {string}   groupId
 * @param {Object[]} expenses      - all expenses (will be filtered to groupId)
 * @param {string[]} memberIds     - all member IDs in the group
 * @returns {{ [userId: string]: number }}
 */
export function calculateMemberBalances(groupId, expenses, memberIds) {
  const netCents = {};
  memberIds.forEach((id) => (netCents[id] = 0));

  const groupExpenses = expenses.filter((e) => e.groupId === groupId && !e.settled);

  groupExpenses.forEach((exp) => {
    const shares = calculateExpenseShares(exp);
    const amountCents = Math.round((exp.amount || 0) * 100);

    // Credit the payer
    if (netCents[exp.paidBy] !== undefined) {
      netCents[exp.paidBy] += amountCents;
    }

    // Debit each participant their share
    Object.entries(shares).forEach(([uid, share]) => {
      if (netCents[uid] !== undefined) {
        netCents[uid] -= Math.round(share * 100);
      }
    });
  });

  const net = {};
  memberIds.forEach((id) => {
    net[id] = netCents[id] / 100;
  });

  return net;
}

/**
 * Get a single user's net balance in a specific group.
 */
export function calculateUserBalance(userId, groupId, expenses, memberIds) {
  const balances = calculateMemberBalances(groupId, expenses, memberIds);
  return balances[userId] || 0;
}

/**
 * Calculate a comprehensive summary for a group using integer cent arithmetic.
 */
export function calculateGroupSummary(groupId, allExpenses, memberIds) {
  const groupExpenses = allExpenses.filter((e) => e.groupId === groupId && !e.settled);

  const totalPaidByCents = {};
  const totalShareOfCents = {};
  memberIds.forEach((id) => {
    totalPaidByCents[id] = 0;
    totalShareOfCents[id] = 0;
  });

  let totalExpensesCents = 0;

  groupExpenses.forEach((exp) => {
    const expCents = Math.round((exp.amount || 0) * 100);
    totalExpensesCents += expCents;

    // Track who paid
    if (totalPaidByCents[exp.paidBy] !== undefined) {
      totalPaidByCents[exp.paidBy] += expCents;
    }

    // Track each participant's share
    const shares = calculateExpenseShares(exp);
    Object.entries(shares).forEach(([uid, share]) => {
      if (totalShareOfCents[uid] !== undefined) {
        totalShareOfCents[uid] += Math.round(share * 100);
      }
    });
  });

  const totalPaidBy = {};
  const totalShareOf = {};
  const netBalances = {};

  memberIds.forEach((id) => {
    totalPaidBy[id] = totalPaidByCents[id] / 100;
    totalShareOf[id] = totalShareOfCents[id] / 100;
    netBalances[id] = (totalPaidByCents[id] - totalShareOfCents[id]) / 100;
  });

  return {
    totalExpenses: totalExpensesCents / 100,
    expenseCount: groupExpenses.length,
    totalPaidBy,
    totalShareOf,
    netBalances,
  };
}

/**
 * Calculate the current user's aggregate balances across all their groups.
 */
export function calculateOverallBalances(groups, expenses, userId) {
  let totalOwedCents = 0;
  let totalOweCents = 0;
  const perGroup = {};

  groups.forEach((group) => {
    const bal = calculateUserBalance(userId, group.id, expenses, group.memberIds);
    perGroup[group.id] = bal;
    const balCents = Math.round(bal * 100);
    if (balCents > 0) totalOwedCents += balCents;
    else totalOweCents += Math.abs(balCents);
  });

  return {
    totalBalance: (totalOwedCents - totalOweCents) / 100,
    totalOwed: totalOwedCents / 100,
    totalOwe: totalOweCents / 100,
    perGroup,
  };
}

/**
 * Greedily resolves positive and negative balances to generate a minimum
 * set of transactions required to settle up using integer cent math.
 *
 * @param {{ [userId: string]: number }} balances - map of user IDs to their net balances
 * @returns {Array<{ from: string, to: string, amount: number }>} list of suggested payments
 */
export function calculateSettlementTransactions(balances) {
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([userId, bal]) => {
    const cents = Math.round((bal || 0) * 100);
    if (cents < 0) {
      debtors.push({ userId, amountCents: Math.abs(cents) });
    } else if (cents > 0) {
      creditors.push({ userId, amountCents: cents });
    }
  });

  // Sort descending by amount to settle largest amounts first (greedy search)
  debtors.sort((a, b) => b.amountCents - a.amountCents);
  creditors.sort((a, b) => b.amountCents - a.amountCents);

  const transactions = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleCents = Math.min(debtor.amountCents, creditor.amountCents);

    if (settleCents > 0) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: settleCents / 100,
      });
    }

    debtor.amountCents -= settleCents;
    creditor.amountCents -= settleCents;

    if (debtor.amountCents === 0) {
      dIdx++;
    }
    if (creditor.amountCents === 0) {
      cIdx++;
    }
  }

  return transactions;
}

/**
 * Calculate summary metrics for a given cycle.
 */
export function calculateCycleSummary(cycleId, expenses) {
  const cycleExpenses = expenses.filter((e) => e.cycleId === cycleId);
  const totalCents = cycleExpenses.reduce((sum, e) => sum + Math.round((e.amount || 0) * 100), 0);

  return {
    totalAmount: totalCents / 100,
    expenseCount: cycleExpenses.length,
  };
}
