// ============================================================
// DATA MAPPING LAYER
// Maps backend API response entities cleanly into frontend models
// Preserves stable IDs (userId, groupId, expenseId, cycleId, settlementId)
// ============================================================

export function mapUser(user) {
  if (!user) return null;
  const id = String(user.id || user._id || '');
  const name = user.name || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || 'User';
  const firstName = user.firstName || user.first_name || name.split(' ')[0] || 'User';

  return {
    id,
    name,
    firstName,
    email: user.email || '',
    avatar: user.avatar || null,
    color: user.color || '#CCFF00',
  };
}

export function mapGroup(group) {
  if (!group) return null;
  const id = String(group.id || group._id || '');
  const rawMembers = group.memberIds || group.member_ids || group.members;
  const memberIds = Array.isArray(rawMembers)
    ? rawMembers
        .map((m) => (typeof m === 'object' && m !== null ? String(m.userId || m.id || m._id || '') : String(m)))
        .filter(Boolean)
    : [];

  const membersList = Array.isArray(group.members)
    ? group.members.map((m) => (typeof m === 'object' && m !== null && (m.name || m.email) ? mapUser(m) : null)).filter(Boolean)
    : undefined;

  return {
    id,
    name: group.name || 'Group',
    icon: group.icon || '🏠',
    description: group.description || '',
    createdBy: String(group.createdBy || group.created_by || ''),
    inviteCode: group.inviteCode || group.invite_code || '',
    memberIds,
    members: membersList && membersList.length > 0 ? membersList : undefined,
    createdAt: group.createdAt || group.created_at || new Date().toISOString(),
  };
}

export function mapExpense(exp) {
  if (!exp) return null;
  const id = String(exp.id || exp._id || '');
  const groupId = String(exp.groupId || exp.group_id || '');
  const cycleId = exp.cycleId || exp.cycle_id ? String(exp.cycleId || exp.cycle_id) : null;
  const participants = Array.isArray(exp.participants || exp.splitAmong || exp.split_among)
    ? (exp.participants || exp.splitAmong || exp.split_among)
        .map((p) => (typeof p === 'object' && p !== null ? String(p.id || p._id || '') : String(p)))
        .filter(Boolean)
    : [];

  const shares = exp.shares && typeof exp.shares === 'object'
    ? Object.fromEntries(
        Object.entries(exp.shares).map(([k, v]) => [
          String(k),
          typeof v === 'number' ? v : parseFloat(v) || 0,
        ])
      )
    : undefined;

  return {
    id,
    groupId,
    cycleId,
    title: exp.title || exp.description || 'Expense',
    emoji: exp.emoji || '💰',
    amount: typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount) || 0,
    paidBy: String(exp.paidBy || exp.paid_by || (typeof exp.payer === 'object' ? exp.payer?.id || exp.payer?._id : exp.payer) || ''),
    splitAmong: participants,
    participants: participants,
    splitType: exp.splitType || exp.split_type || 'equal',
    shares,
    date: exp.date || (exp.createdAt ? exp.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    createdAt: exp.createdAt || exp.created_at || new Date().toISOString(),
    settled: Boolean(exp.settled),
    settlementId: exp.settlementId || exp.settlement_id ? String(exp.settlementId || exp.settlement_id) : null,
  };
}

export function mapCycle(cycle) {
  if (!cycle) return null;
  const id = String(cycle.id || cycle._id || '');
  const groupId = String(cycle.groupId || cycle.group_id || '');

  return {
    id,
    groupId,
    startDate: cycle.startDate || cycle.start_date || new Date().toISOString(),
    endDate: cycle.endDate || cycle.end_date || null,
    status: cycle.status || 'active',
    settlementId: cycle.settlementId || cycle.settlement_id ? String(cycle.settlementId || cycle.settlement_id) : null,
  };
}

export function mapSettlement(settle) {
  if (!settle) return null;
  const id = String(settle.id || settle._id || '');
  const groupId = String(settle.groupId || settle.group_id || '');

  const confirmations = Array.isArray(settle.confirmations)
    ? settle.confirmations.map((c) => (typeof c === 'object' && c !== null ? String(c.id || c._id || c.userId || '') : String(c))).filter(Boolean)
    : [];

  const transactions = Array.isArray(settle.transactions)
    ? settle.transactions.map((tx) => ({
        from: String(tx.from || tx.from_user || tx.fromUser || tx.payer || ''),
        to: String(tx.to || tx.to_user || tx.toUser || tx.receiver || ''),
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount || 0) || 0,
      }))
    : [];

  return {
    id,
    groupId,
    cycleId: settle.cycleId || settle.cycle_id ? String(settle.cycleId || settle.cycle_id) : null,
    completedAt: settle.completedAt || settle.completed_at || settle.date || new Date().toISOString(),
    completedBy: String(settle.completedBy || settle.completed_by || ''),
    confirmations,
    transactions,
    totalSettled: typeof settle.totalSettled === 'number' ? settle.totalSettled : parseFloat(settle.totalSettled || 0),
    balancesBeforeSettlement: settle.balancesBeforeSettlement || settle.balances_before || {},
    status: settle.status || 'completed',
  };
}
