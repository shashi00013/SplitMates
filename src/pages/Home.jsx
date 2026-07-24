import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, PlusCircle, ArrowUpRight, Users, Clock, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import Avatar from '../components/Avatar';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import NotificationsModal from '../components/NotificationsModal';
import JoinGroupModal from '../components/JoinGroupModal';

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
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const userGroups = getUserGroups();
  const { totalBalance, totalOwed, totalOwe } = getTotalBalances();
  const recentExpenses = getAllExpensesForUser().slice(0, 4);

  // Check if any group has an active pending settlement
  const pendingSettlementGroup = userGroups.find((g) => settlements[g.id]?.status === 'pending');

  return (
    <div className="page" id="home-page">
      {/* Header / Greeting */}
      <div className="flex items-center justify-between" style={{ marginBottom: '20px', paddingTop: '4px' }}>
        <div className="flex items-center gap-12">
          <Avatar user={user} size="md" />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {t('welcomeBack')} {user?.firstName} 👋
            </h2>
            <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>SplitMates</p>
          </div>
        </div>

        {/* Header Action Buttons (Quick QR Scan & Notifications) */}
        <div className="flex items-center gap-8">
          <button
            className="btn-icon"
            id="home-scan-qr-btn"
            aria-label="Scan QR Code"
            title="Scan QR Code"
            onClick={() => setShowJoinModal(true)}
            style={{ position: 'relative', background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}
          >
            <QrCode size={18} style={{ color: 'var(--accent)' }} />
          </button>
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

      {/* Net Balance Card */}
      <div className="card card-glow" style={{ marginBottom: '20px', padding: '20px' }} id="total-balance-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('netBalance')}
            </p>
            <p className="text-3xl" style={{ fontWeight: 800, color: totalBalance > 0 ? 'var(--accent)' : totalBalance < 0 ? 'var(--negative)' : 'var(--text-primary)' }}>
              {formatCurrency(totalBalance)}
            </p>
            {totalOwed === 0 && totalOwe === 0 ? (
              <p className="text-sm fw-600" style={{ marginTop: '10px', color: 'var(--positive)' }}>
                {t('allSettledUp')}
              </p>
            ) : (
              <div className="flex gap-16" style={{ marginTop: '10px' }}>
                <p className="text-accent text-sm fw-600">
                  ↑ {t('youGet')}: {formatCurrency(totalOwed)}
                </p>
                <p className="text-negative text-sm fw-600">
                  ↓ {t('youPay')}: {formatCurrency(totalOwe)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Pending Settlement Banner (if any) */}
      {pendingSettlementGroup && (
        <div
          className="card flex items-center justify-between"
          style={{
            marginBottom: '24px',
            padding: '14px 16px',
            background: 'rgba(255, 165, 2, 0.10)',
            border: '1px solid var(--warning)',
            cursor: 'pointer',
          }}
          onClick={() => {
            selectGroup(pendingSettlementGroup.id);
            navigate(`/settlement/${pendingSettlementGroup.id}`);
          }}
          id="pending-settlement-banner"
        >
          <div className="flex items-center gap-12">
            <Clock size={20} style={{ color: 'var(--warning)' }} />
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Settlement in Progress
              </h4>
              <p className="text-secondary text-xs" style={{ margin: 0 }}>
                "{pendingSettlementGroup.name}" has an active settlement pending confirmations
              </p>
            </div>
          </div>
          <ArrowUpRight size={18} style={{ color: 'var(--warning)' }} />
        </div>
      )}

      {/* Your Groups */}
      <div className="section-header">
        <h2>{t('myGroups')}</h2>
        <button className="see-all" onClick={() => navigate('/groups')} id="see-all-groups">
          {t('viewAll')}
        </button>
      </div>
      <div className="flex flex-col gap-10" style={{ marginBottom: '24px' }}>
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
            const myBalance = user ? balances[user.id] || 0 : 0;
            const statusClass = myBalance > 0 ? 'text-accent' : myBalance < 0 ? 'text-negative' : 'text-secondary';
            const labelText = myBalance > 0 ? t('youGet') : myBalance < 0 ? t('youPay') : t('allSettled');
            const displayAmount = myBalance === 0 ? '₹0.00' : formatCurrency(Math.abs(myBalance));
            return (
              <div
                key={group.id}
                className="group-card"
                onClick={() => {
                  selectGroup(group.id);
                  navigate(`/group/${group.id}`);
                }}
                id={`group-card-${group.id}`}
              >
                <div className="group-card-icon">{group.icon || '🏠'}</div>
                <div className="group-card-info">
                  <h3>{group.name}</h3>
                  <p>{group.memberIds.length} {t('peopleInGroup')}</p>
                </div>
                <div className="group-card-balance">
                  <p className={`balance-label ${statusClass}`}>{labelText}</p>
                  <p className={`balance-amount ${statusClass}`}>{displayAmount}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recent Expenses */}
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
              ? `Others owe you ${formatCurrency(receivable)}`
              : userShare > 0
              ? `You owe ${payer?.firstName || 'member'} ${formatCurrency(userShare)}`
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

      <JoinGroupModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </div>
  );
}
