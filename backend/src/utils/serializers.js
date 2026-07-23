export function serializeUser(user) {
  if (!user) return null;
  const name = user.name || 'User';
  const firstName = name.split(' ')[0] || name;
  return {
    id: String(user.id),
    name: name,
    firstName: firstName,
    email: user.email,
    avatar: user.avatar || null,
    color: user.color || '#CCFF00',
  };
}

export function serializeGroup(group) {
  if (!group) return null;
  const memberIds = Array.isArray(group.members)
    ? group.members.map((m) => String(m.userId || m.id || m))
    : Array.isArray(group.memberIds)
    ? group.memberIds.map(String)
    : [];

  const members = Array.isArray(group.members)
    ? group.members.map((m) => (m.user ? serializeUser(m.user) : null)).filter(Boolean)
    : [];

  return {
    id: String(group.id),
    name: group.name,
    icon: group.icon || '🏠',
    description: group.description || '',
    inviteCode: group.inviteCode,
    createdBy: String(group.createdBy),
    memberIds,
    members: members.length > 0 ? members : undefined,
    createdAt: group.createdAt ? group.createdAt.toISOString() : new Date().toISOString(),
  };
}

export function serializeExpense(expense) {
  if (!expense) return null;
  const participants = Array.isArray(expense.shares)
    ? expense.shares.map((s) => String(s.userId))
    : Array.isArray(expense.participants)
    ? expense.participants.map(String)
    : [];

  const sharesObj = Array.isArray(expense.shares)
    ? Object.fromEntries(expense.shares.map((s) => [String(s.userId), Number(s.amount)]))
    : expense.shares && typeof expense.shares === 'object'
    ? Object.fromEntries(Object.entries(expense.shares).map(([k, v]) => [String(k), Number(v)]))
    : {};

  return {
    id: String(expense.id),
    groupId: String(expense.groupId),
    cycleId: expense.cycleId ? String(expense.cycleId) : null,
    title: expense.title,
    emoji: expense.emoji || '💰',
    amount: Number(expense.amount),
    paidBy: String(expense.paidBy),
    splitAmong: participants,
    participants: participants,
    splitType: expense.splitType || 'equal',
    shares: sharesObj,
    date: expense.date ? (typeof expense.date === 'string' ? expense.date : expense.date.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    createdAt: expense.createdAt ? expense.createdAt.toISOString() : new Date().toISOString(),
    settled: Boolean(expense.settled),
    settlementId: expense.settlementId ? String(expense.settlementId) : null,
  };
}

export function serializeCycle(cycle) {
  if (!cycle) return null;
  return {
    id: String(cycle.id),
    groupId: String(cycle.groupId),
    startDate: cycle.startDate ? cycle.startDate.toISOString() : new Date().toISOString(),
    endDate: cycle.endDate ? cycle.endDate.toISOString() : null,
    status: cycle.status || 'active',
    settlementId: cycle.settlementId ? String(cycle.settlementId) : null,
  };
}

export function serializeSettlement(settlement) {
  if (!settlement) return null;
  const confirmations = Array.isArray(settlement.confirmations)
    ? settlement.confirmations.map((c) => String(c.userId || c.id || c))
    : [];

  const transactions = Array.isArray(settlement.transactions)
    ? settlement.transactions.map((tx) => ({
        from: String(tx.fromUser || tx.from),
        to: String(tx.toUser || tx.to),
        amount: Number(tx.amount),
      }))
    : [];

  return {
    id: String(settlement.id),
    groupId: String(settlement.groupId),
    cycleId: settlement.cycleId ? String(settlement.cycleId) : null,
    completedAt: settlement.completedAt ? settlement.completedAt.toISOString() : settlement.createdAt ? settlement.createdAt.toISOString() : new Date().toISOString(),
    completedBy: settlement.completedBy ? String(settlement.completedBy) : '',
    confirmations,
    transactions,
    totalSettled: Number(settlement.totalSettled || 0),
    status: settlement.status || 'completed',
  };
}
