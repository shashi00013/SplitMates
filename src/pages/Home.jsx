import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowUpRight, ChevronDown, ChevronUp, Users, PlusCircle, Sparkles } from 'lucide-react';
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
  const [showInsights, setShowInsights] = useState(false); // Collapsed by default (Progressive Disclosure)

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const userGroups = getUserGroups();
  const { totalBalance } = getTotalBalances();
  const allExpenses = getAllExpensesForUser();
  const recentExpenses = allExpenses.slice(0, 5);

  const isFirstTimeUser = userGroups.length === 0 && allExpenses.length === 0;

  // Derive proactive actions & real-data insights
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

        {/* Notifications Button */}
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

      {/* ── FIRST TIME USER MODE ────────────────────────────────────────── */}
      {!isLoading && isFirstTimeUser ? (
        <div className="card page-section text-center" style={{ padding: '24px 18px', background: 'var(--bg-card)' }} id="onboarding-card">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚀</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Welcome to SplitMates!
          </h2>
          <p className="text-secondary text-xs" style={{ marginBottom: '20px' }}>
            Follow these 3 simple steps to start splitting expenses with friends:
          </p>

          <div className="flex flex-col gap-12 text-left" style={{ marginBottom: '24px' }}>
            <div className="flex items-center gap-12" style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: '#000', fontWeight: 800, display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.85rem', flexShrink: 0 }}>1</div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Step 1: Group Banao</h4>
                <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>Roommates ya friends ka group banao</p>
              </div>
            </div>

            <div className="flex items-center gap-12" style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: '#000', fontWeight: 800, display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.85rem', flexShrink: 0 }}>2</div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Step 2: Dost Add Karo</h4>
                <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>Invite code ya QR code se dosto ko add karo</p>
              </div>
            </div>

            <div className="flex items-center gap-12" style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: '#000', fontWeight: 800, display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.85rem', flexShrink: 0 }}>3</div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Step 3: Kharcha Add Karo</h4>
                <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>Rent, groceries ya bill add karke auto split karo</p>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/groups')}
            id="create-first-group-btn"
            style={{ fontWeight: 700, padding: '12px' }}
          >
            + Create Your First Group
          </button>
        </div>
      ) : (
        <>
          {/* ── DEFAULT VIEW: Simple Balance Card ─────────────────────────── */}
          <div
            className="card card-glow page-section card-hover"
            id="total-balance-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Tumhe milne / dene hain
                </p>
                <p className="financial-hero-amount" style={{ color: totalBalance > 0 ? 'var(--accent)' : totalBalance < 0 ? 'var(--negative)' : 'var(--text-primary)' }}>
                  {formatCurrency(Math.abs(totalBalance))}
                </p>
                {totalBalance > 0 ? (
                  <p className="text-accent text-sm fw-600" style={{ marginTop: '8px' }}>
                    Tumhe ₹{Math.abs(totalBalance)} milne hain
                  </p>
                ) : totalBalance < 0 ? (
                  <p className="text-negative text-sm fw-600" style={{ marginTop: '8px' }}>
                    Tumhe ₹{Math.abs(totalBalance)} dene hain
                  </p>
                ) : (
                  <p className="text-sm fw-600" style={{ marginTop: '8px', color: 'var(--positive)' }}>
                    Sab cleared hai 🎉
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-12">
                {memberBreakdownItems.length > 0 && (
                  <button
                    className="btn btn-ghost btn-sm flex items-center gap-4 text-xs"
                    style={{ padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => setIsBalanceExpanded(!isBalanceExpanded)}
                    id="toggle-dues-breakdown"
                  >
                    <span>Details</span>
                    {isBalanceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Details */}
            {isBalanceExpanded && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                }}
                id="balance-breakdown-list"
              >
                <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  Individual Dues Breakdown
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
                        ? `${member.firstName || 'Dost'} se ${absVal} milne hain`
                        : isOwe
                        ? `${member.firstName || 'Dost'} ko ${absVal} dene hain`
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

          {/* ── DEFAULT VIEW: Primary Action Button ───────────────────────── */}
          <div className="page-section" style={{ marginTop: '-4px' }}>
            <button
              className="btn btn-primary btn-full flex items-center justify-center gap-8"
              onClick={() => navigate('/add-expense')}
              id="home-primary-add-expense-btn"
              style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}
            >
              <PlusCircle size={20} />
              + Add Expense
            </button>
          </div>

          {/* ── DEFAULT VIEW: My Groups ───────────────────────────────────── */}
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
                  ? `Tumhe ${formatCurrency(Math.abs(myBalance))} milne hain`
                  : myBalance < 0
                  ? `Tumhe ${formatCurrency(Math.abs(myBalance))} dene hain`
                  : 'Sab cleared hai 🎉';

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
                        </div>
                        <div className="flex items-center gap-8" style={{ marginTop: '4px' }}>
                          <div className="flex items-center gap-4 text-secondary text-xs" style={{ fontWeight: 600 }}>
                            <Users size={13} style={{ color: 'var(--accent)' }} />
                            <span>{group.memberIds.length} members</span>
                          </div>
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

          {/* ── DEFAULT VIEW: Recent Activity ─────────────────────────────── */}
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
                  ? `Tumhe ${formatCurrency(receivable)} milne hain`
                  : userShare > 0
                  ? `Tumhe ${formatCurrency(userShare)} dene hain`
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
                      <p>{group?.name || 'Group'} · {paidByLabel} ne diya</p>
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

          {/* ── MORE OPTIONS: Spending Insights & Action Analytics (Collapsed by Default) ── */}
          {(proactiveActions.length > 0 || financialInsights.length > 0) && (
            <div className="page-section" id="more-insights-section">
              <button
                type="button"
                className="btn btn-secondary btn-full flex items-center justify-between"
                onClick={() => setShowInsights((prev) => !prev)}
                id="toggle-more-insights-btn"
                style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700 }}
              >
                <div className="flex items-center gap-8">
                  <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                  <span>More Insights & Analytics</span>
                </div>
                {showInsights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showInsights && (
                <div className="flex flex-col gap-12" style={{ marginTop: '12px' }}>
                  {/* Proactive actions */}
                  {proactiveActions.map((action) => (
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
                      <div>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {action.title}
                        </h4>
                        <p className="text-secondary text-xs" style={{ margin: '2px 0 0 0' }}>
                          {action.subtitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-accent text-xs fw-700">
                        <span>{action.ctaLabel}</span>
                        <ArrowUpRight size={16} />
                      </div>
                    </div>
                  ))}

                  {/* Financial Activity Insights */}
                  {financialInsights.length > 0 && (
                    <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-card-alt)' }} id="financial-insights-card">
                      <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                        Spending Summary
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
                </div>
              )}
            </div>
          )}
        </>
      )}

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
