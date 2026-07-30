import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowUpRight, Clock, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import { calculateSettlementTransactions } from '../data/balanceEngine';
import Avatar from '../components/Avatar';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import NotificationsModal from '../components/NotificationsModal';

import { deriveProactiveActions, deriveFinancialInsights, deriveGroupHealthSignal } from '../utils/productIntelligence';

export default function Home() {
  const {
    user,
    getUserGroups,
    getTotalBalances,
    getAllExpensesForUser,
    getBalancesForGroup,
    getUserById,
    selectGroup,
    settlements,
    notifications,
    unreadCount,
    markNotificationRead,
    fetchNotifications,
    isLoading,
  } = useApp();

  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeExpense, setActiveExpense] = useState(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const userGroups = getUserGroups();
  const { totalBalance } = getTotalBalances();
  const allExpenses = getAllExpensesForUser();
  const recentExpenses = allExpenses.slice(0, 4);

  // Derive proactive actions & real-data insights using product intelligence layer
  const proactiveActions = deriveProactiveActions({
    user,
    userGroups,
    settlements,
    allExpenses,
    getBalancesForGroup,
    getUserById,
  });

  const financialInsights = deriveFinancialInsights({
    userGroups,
    allExpenses,
  });

  // Compute aggregated per-member breakdown across all user groups
  const memberDuesMap = {};
  userGroups.forEach((g) => {
    const balances = getBalancesForGroup(g.id);
    const txs = calculateSettlementTransactions(balances);
    txs.forEach((tx) => {
      if (tx.from === user?.id) {
        const toUser = getUserById(tx.to);
        if (toUser) {
          const key = toUser.id;
          if (!memberDuesMap[key]) memberDuesMap[key] = { member: toUser, amount: 0 };
          memberDuesMap[key].amount -= tx.amount;
        }
      } else if (tx.to === user?.id) {
        const fromUser = getUserById(tx.from);
        if (fromUser) {
          const key = fromUser.id;
          if (!memberDuesMap[key]) memberDuesMap[key] = { member: fromUser, amount: 0 };
          memberDuesMap[key].amount += tx.amount;
        }
      }
    });
  });
  const memberBreakdownItems = Object.values(memberDuesMap);

  return (
    <div className="page" id="home-page">
      {/* Header / Greeting */}
      <div className="flex items-center justify-between page-section" style={{ paddingTop: '4px' }}>
        <div className="flex items-center gap-12">
          <Avatar user={user} size="md" />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {t('welcomeBack')} {user?.firstName} 👋
            </h1>
            <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>SplitMates</p>
          </div>
        </div>

        {/* Header Action Buttons (Notifications) */}
        <div className="flex items-center gap-8">
          <button
            className="btn-icon"
            id="notifications-btn"
            aria-label="Notifications"
            onClick={() => setShowNotificationsModal(true)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: 'var(--negative)',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-primary)',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tier 1: Unified Net Balance Card */}
      <div
        className="card card-glow page-section card-hover"
        id="total-balance-card"
        onClick={() => navigate('/balance-breakdown')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('netBalance')}
            </p>
            <p className="financial-hero-amount" style={{ color: totalBalance > 0 ? 'var(--accent)' : totalBalance < 0 ? 'var(--negative)' : 'var(--text-primary)' }}>
              {formatCurrency(Math.abs(totalBalance))}
            </p>
            {totalBalance > 0 ? (
              <p className="text-accent text-sm fw-600" style={{ marginTop: '8px' }}>
                {t('youGet')} {formatCurrency(Math.abs(totalBalance))}
              </p>
            ) : totalBalance < 0 ? (
              <p className="text-negative text-sm fw-600" style={{ marginTop: '8px' }}>
                {t('youPay')} {formatCurrency(Math.abs(totalBalance))}
              </p>
            ) : (
              <p className="text-sm fw-600" style={{ marginTop: '8px', color: 'var(--positive)' }}>
                {t('allSettledUp')}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-12">
            <div className="flex items-center gap-4 text-accent text-xs fw-600">
              <span>See who owes what</span>
              <ArrowUpRight size={16} />
            </div>
            {memberBreakdownItems.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBalanceExpanded(!isBalanceExpanded);
                }}
                id="toggle-dues-breakdown"
              >
                {isBalanceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Member Dues Breakdown */}
        {isBalanceExpanded && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
            id="balance-breakdown-list"
          >
            <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              See who owes what
            </p>
            {memberBreakdownItems.length === 0 ? (
              <p className="text-secondary text-xs">All clear 🎉</p>
            ) : (
              <div className="flex flex-col gap-8">
                {memberBreakdownItems.map(({ member, amount }) => {
                  const isOwed = amount > 0;
                  const isOwe = amount < 0;
                  const absVal = formatCurrency(Math.abs(amount));
                  const bClass = isOwed ? 'text-accent' : isOwe ? 'text-negative' : 'text-secondary';
                  const bText = isOwed
                    ? `${member.firstName || 'Person'} needs to pay you ${absVal}`
                    : isOwe
                    ? `You need to pay ${member.firstName || 'Person'} ${absVal}`
                    : 'All clear 🎉';

                  return (
                    <div key={member.id} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-8">
                        <Avatar user={member} size="sm" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.firstName || member.name}</span>
                      </div>
                      <span className={`fw-700 ${bClass}`}>{bText}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tier 2: Proactive Action Center (Contextual Prioritized Actions) */}
      {proactiveActions.length > 0 && (
        <div className="flex flex-col gap-10 page-section" id="proactive-action-center">
          {proactiveActions.slice(0, 2).map((action) => (
            <div
              key={action.id}
              className="card flex items-center justify-between card-hover"
              style={{
                padding: '14px 16px',
                background: 'var(--bg-card-alt)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
              onClick={() => navigate(action.targetRoute)}
              id={`action-item-${action.id}`}
            >
              <div className="flex items-center gap-12">
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: action.badgeColor ? `${action.badgeColor}20` : 'var(--bg-card)',
                    color: action.badgeColor || 'var(--accent)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {action.badge}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {action.title}
                  </h4>
                  <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>
                    {action.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-accent text-xs fw-700" style={{ whiteSpace: 'nowrap', paddingLeft: '8px' }}>
                <span>{action.ctaLabel}</span>
                <ArrowUpRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financial Activity Insights (Real Data Only) */}
      {financialInsights.length > 0 && (
        <div className="card page-section" style={{ padding: '12px 16px', background: 'var(--bg-card-alt)' }} id="financial-insights-card">
          <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Your spending
          </p>
          <div className="flex flex-col gap-6">
            {financialInsights.map((insight) => (
              <div key={insight.id} className="flex items-center gap-8 text-xs">
                <span>{insight.icon}</span>
                <span className="text-primary fw-600">{insight.title}:</span>
                <span className="text-secondary">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed (Moved up) */}
      <div className="section-header">
        <h2>{t('recentExpenses')}</h2>
        <button className="see-all" onClick={() => navigate('/expenses')} id="see-all-expenses">
          {t('viewAll')}
        </button>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <p className="text-secondary text-center" style={{ padding: '24px 0' }}>
            {t('loading')}
          </p>
        ) : recentExpenses.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '24px 0' }}>
            {t('noExpensesYet')}
          </p>
        ) : (
          recentExpenses.map((exp) => {
            const payer = getUserById(exp.paidBy);
            const group = userGroups.find((g) => g.id === exp.groupId);
            const paidByLabel = exp.paidBy === user?.id ? 'You' : payer?.firstName || 'Member';
            const participants = exp.participants || exp.splitAmong || [];
            const isPayer = exp.paidBy === user?.id;
            const isParticipant = participants.includes(user?.id);
            const userShare = exp.shares?.[user?.id] || (isParticipant ? (exp.amount / (participants.length || 1)) : 0);
            const receivable = isPayer ? Math.max(0, exp.amount - userShare) : 0;
            const impactClass = isPayer ? 'text-accent' : userShare > 0 ? 'text-negative' : 'text-secondary';
            const impactText = isPayer
              ? `You get ${formatCurrency(receivable)}`
              : userShare > 0
              ? `You need to pay ${payer?.firstName || 'person'} ${formatCurrency(userShare)}`
              : 'Not involved';

            return (
              <div
                key={exp.id}
                className="expense-row"
                id={`expense-${exp.id}`}
                onClick={() => setActiveExpense(exp)}
                style={{ cursor: 'pointer' }}
              >
                <div className="expense-icon">{exp.emoji}</div>
                <div className="expense-info">
                  <h3>{exp.title}</h3>
                  <p>{group?.name || 'Group'} · {t('paidBy')} {paidByLabel}</p>
                </div>
                <div className="expense-amount" style={{ textAlign: 'right' }}>
                  <p className="amount">{formatCurrency(exp.amount)}</p>
                  <p className={`date fw-600 ${impactClass}`} style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                    {impactText}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* My Groups (Enhanced UI & Design) */}
      <div className="section-header">
        <h2>{t('myGroups')}</h2>
        <button className="see-all" onClick={() => navigate('/groups')} id="see-all-groups">
          {t('viewAll')}
        </button>
      </div>
      <div className="flex flex-col gap-10 page-section">
        {isLoading ? (
          <div className="card text-center" style={{ padding: '24px 16px' }}>
            <p className="text-secondary text-sm">{t('loading')}</p>
          </div>
        ) : userGroups.length === 0 ? (
          <div className="card text-center" style={{ padding: '24px 16px' }}>
            <p className="text-secondary text-sm" style={{ marginBottom: '14px' }}>
              No groups yet. Create or join a group to start splitting!
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate('/groups')}
              style={{ fontSize: '0.85rem', fontWeight: 700 }}
            >
              {t('groups')}
            </button>
          </div>
        ) : (
          userGroups.map((group) => {
            const balances = getBalancesForGroup(group.id);
            const groupExpenses = allExpenses.filter((e) => e.groupId === group.id);
            const healthSignal = deriveGroupHealthSignal(group, groupExpenses, settlements[group.id]);

            const myBalance = user ? balances[user.id] || 0 : 0;
            const statusClass = myBalance > 0 ? 'text-accent' : myBalance < 0 ? 'text-negative' : 'text-secondary';
            const statusText = myBalance > 0
              ? `You get ${formatCurrency(Math.abs(myBalance))}`
              : myBalance < 0
              ? `You need to pay ${formatCurrency(Math.abs(myBalance))}`
              : 'All clear 🎉';

            const statusBg = myBalance > 0
              ? 'rgba(0, 210, 106, 0.12)'
              : myBalance < 0
              ? 'rgba(255, 71, 87, 0.12)'
              : 'var(--bg-input)';

            const statusBorder = myBalance > 0
              ? '1px solid rgba(0, 210, 106, 0.25)'
              : myBalance < 0
              ? '1px solid rgba(255, 71, 87, 0.25)'
              : '1px solid var(--border-light)';

            const members = (group.memberIds || []).map((id) => getUserById(id)).filter(Boolean);
            const previewMembers = members.slice(0, 3);

            return (
              <div
                key={group.id}
                className="card card-hover flex items-center justify-between"
                onClick={() => {
                  selectGroup(group.id);
                  navigate(`/group/${group.id}`);
                }}
                id={`group-card-${group.id}`}
                style={{
                  padding: '14px 16px',
                  background: 'var(--bg-card-alt)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="flex items-center gap-12" style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-light)',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {group.icon || '🏠'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {group.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: healthSignal.color,
                          background: healthSignal.badgeBg,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {healthSignal.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-8" style={{ marginTop: '4px' }}>
                      <div className="flex items-center gap-4 text-secondary text-xs" style={{ fontWeight: 600 }}>
                        <Users size={13} style={{ color: 'var(--accent)' }} />
                        <span>{group.memberIds.length} {group.memberIds.length === 1 ? 'person' : 'people'}</span>
                      </div>
                      {previewMembers.length > 0 && (
                        <div className="flex items-center" style={{ marginLeft: '2px' }}>
                          {previewMembers.map((m, idx) => (
                            <div key={m.id || idx} style={{ marginLeft: idx > 0 ? '-6px' : '0', border: '2px solid var(--bg-card)', borderRadius: '50%' }}>
                              <Avatar user={m} size="xs" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: statusBg,
                    border: statusBorder,
                    textAlign: 'right',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                >
                  <p className={`fw-800 ${statusClass}`} style={{ fontSize: '0.78rem', margin: 0, whiteSpace: 'nowrap' }}>
                    {statusText}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <ExpenseDetailsModal expense={activeExpense} onClose={() => setActiveExpense(null)} />

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={(id) => markNotificationRead(id)}
        onMarkAllRead={() => markNotificationRead('all')}
      />
    </div>
  );
}
