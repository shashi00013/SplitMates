import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, ShieldCheck, UserPlus, LogOut, QrCode, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import Avatar from '../components/Avatar';
import MiniChart from '../components/MiniChart';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import SettlementDetailsModal from '../components/SettlementDetailsModal';
import InviteGroupModal from '../components/InviteGroupModal';

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeExpense, setActiveExpense] = useState(null);
  const [activeSettlement, setActiveSettlement] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const {
    user,
    groups,
    getGroupMembers,
    getBalancesForGroup,
    getGroupExpenses,
    getActiveCycle,
    getSettlementHistory,
    leaveGroup,
    showToast,
    isLoading,
  } = useApp();

  const group = groups.find((g) => g.id === groupId || String(g.id) === String(groupId));
  if (!group) {
    if (isLoading || groups.length === 0) {
      return (
        <div className="page flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <p className="text-secondary text-sm">{t('loading')}</p>
        </div>
      );
    }
    return (
      <div className="page" id="group-not-found-page">
        <p className="text-secondary text-center mt-24">Group not found</p>
        <div className="flex justify-center mt-16">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/groups', { replace: true })}
            style={{ background: '#262626', color: '#FFFFFF', border: '1px solid #333333' }}
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const members = getGroupMembers(groupId);
  const balances = getBalancesForGroup(groupId);
  const myBalance = balances[user.id] || 0;
  const statusClass = myBalance > 0 ? 'text-accent' : myBalance < 0 ? 'text-negative' : 'text-secondary';
  const labelText = myBalance > 0 ? t('youGet') : myBalance < 0 ? t('youPay') : t('allSettled');

  const activeCycle = getActiveCycle(groupId);
  const groupExpenses = getGroupExpenses(groupId);
  const activeCycleExpenses = groupExpenses.filter((e) => !e.settled);
  const groupSettlements = getSettlementHistory(groupId);

  const recentExpenses = [...activeCycleExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  async function handleLeaveGroup() {
    setShowMenu(false);
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveGroup(groupId);
      showToast(t('leaveGroupSuccess'));
      navigate('/groups', { replace: true });
    } catch (err) {
      showToast(err.message || t('cannotLeaveWithBalance'));
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <div className="page" id="group-details-page">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ paddingBottom: '4px', position: 'relative' }}>
        <button className="btn-icon" onClick={() => navigate('/groups')} id="group-back-btn">
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-8">
          <button
            onClick={() => setIsInviteOpen(true)}
            id="header-invite-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '16px',
              background: '#262626',
              border: '1px solid #333333',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <UserPlus size={15} style={{ color: '#A3E635' }} /> {t('groupCode')}
          </button>
          <button
            className="btn-icon"
            id="group-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '44px',
              right: '0',
              background: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '14px',
              padding: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 100,
              minWidth: '180px',
            }}
            id="group-dropdown-menu"
          >
            <button
              className="menu-item"
              onClick={() => { setShowMenu(false); setIsInviteOpen(true); }}
              style={{ padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', color: '#FFFFFF', fontSize: '0.85rem' }}
            >
              <QrCode size={16} style={{ color: '#A3E635' }} /> {t('groupCode')} & QR
            </button>
            <button
              className="menu-item"
              onClick={() => { setShowMenu(false); navigate(`/settle/${groupId}`); }}
              style={{ padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', color: '#FFFFFF', fontSize: '0.85rem' }}
            >
              <CheckCircle2 size={16} style={{ color: '#A3E635' }} /> {t('settleUp')}
            </button>
            <div style={{ height: '1px', background: '#333333', margin: '4px 0' }} />
            <button
              className="menu-item"
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              style={{ padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', color: '#FF3B30', fontSize: '0.85rem' }}
            >
              <LogOut size={16} /> {isLeaving ? 'Leaving...' : t('leaveGroup')}
            </button>
          </div>
        )}
      </div>

      {/* Group Title Card */}
      <div className="flex items-center gap-16" style={{ marginBottom: '20px', paddingTop: '8px' }}>
        <div style={{ fontSize: '2.8rem' }}>{group.icon || '🏠'}</div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>{group.name}</h1>
          <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>
            {group.description || `${members.length} ${t('peopleInGroup')}`}
          </p>
        </div>
      </div>

      {/* My Balance Card */}
      <div className="card card-glow" style={{ marginBottom: '24px', padding: '20px' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('netBalance')}
            </p>
            <p className={`text-2xl fw-800 ${statusClass}`}>
              {myBalance === 0 ? '₹0.00' : formatCurrency(Math.abs(myBalance))}
            </p>
            <p className={`text-xs fw-600 ${statusClass}`} style={{ marginTop: '4px' }}>
              {labelText} {myBalance > 0 ? '(Receivable)' : myBalance < 0 ? '(Payable)' : ''}
            </p>
          </div>
          <MiniChart bars={6} maxHeight={36} />
        </div>
      </div>

      {/* Members Section */}
      <div className="section-header flex justify-between items-center">
        <h2>{t('peopleInGroup')} ({members.length})</h2>
        <button
          className="see-all"
          onClick={() => setIsInviteOpen(true)}
          style={{ color: '#A3E635', fontSize: '0.8rem', fontWeight: 600 }}
        >
          + {t('groupCode')}
        </button>
      </div>

      <div className="flex gap-12" style={{ overflowX: 'auto', paddingBottom: '16px', marginBottom: '20px' }}>
        {members.map((m) => {
          const bal = balances[m.id] || 0;
          const isMe = m.id === user.id;
          const bClass = bal > 0 ? 'text-accent' : bal < 0 ? 'text-negative' : 'text-secondary';
          const balText = bal > 0 ? `Gets ${formatCurrency(bal)}` : bal < 0 ? `Owes ${formatCurrency(Math.abs(bal))}` : t('allSettled');
          return (
            <div
              key={m.id}
              className="card flex flex-col items-center text-center"
              style={{ minWidth: '110px', padding: '14px 10px', background: '#111111', borderRadius: '16px' }}
            >
              <Avatar user={m} size="md" />
              <strong style={{ fontSize: '0.82rem', marginTop: '6px', color: '#FFFFFF' }}>
                {isMe ? 'You' : m.firstName}
              </strong>
              <span className={`text-xs fw-600 ${bClass}`} style={{ marginTop: '4px' }}>
                {balText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Period Expenses */}
      <div className="section-header">
        <h2>{t('currentPeriod')} ({activeCycleExpenses.length})</h2>
        <button className="see-all" onClick={() => navigate('/expenses')} id="see-all-group-expenses">{t('viewAll')}</button>
      </div>

      <div className="card" style={{ padding: '0 16px', marginBottom: '24px' }}>
        {activeCycleExpenses.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '24px 0' }}>{t('noExpensesYet')}</p>
        ) : (
          recentExpenses.map((exp) => {
            const payer = members.find((m) => m.id === exp.paidBy);
            const paidByLabel = exp.paidBy === user?.id ? 'You' : payer?.firstName || 'Member';
            return (
              <div
                key={exp.id}
                className="expense-row"
                onClick={() => setActiveExpense(exp)}
                style={{ cursor: 'pointer' }}
              >
                <div className="expense-icon">{exp.emoji}</div>
                <div className="expense-info">
                  <h3>{exp.title}</h3>
                  <p>{t('paidBy')} {paidByLabel}</p>
                </div>
                <div className="expense-amount">
                  <p className="amount">{formatCurrency(exp.amount)}</p>
                  <p className="date">{formatDate(exp.date)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History & Past Settlements */}
      {groupSettlements.length > 0 && (
        <>
          <div className="section-header">
            <h2>Past {t('settleUp')} ({groupSettlements.length})</h2>
          </div>
          <div className="card" style={{ padding: '0 16px', marginBottom: '24px' }}>
            {groupSettlements.map((settle) => (
              <div
                key={settle.id}
                className="expense-row"
                onClick={() => setActiveSettlement(settle)}
                style={{ cursor: 'pointer' }}
              >
                <div className="expense-icon" style={{ background: 'rgba(163, 230, 53, 0.1)', color: 'var(--accent)' }}>
                  <ShieldCheck size={18} />
                </div>
                <div className="expense-info">
                  <h3>{t('allSettled')}</h3>
                  <p className="text-xs">{formatDate(settle.completedAt || settle.createdAt)}</p>
                </div>
                <div className="expense-amount">
                  <p className="amount text-accent">{formatCurrency(settle.totalSettled)}</p>
                  <p className="date text-secondary text-xs">{t('allSettled')}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate(`/settle/${groupId}`)}
          id="settle-up-btn"
          style={{ background: '#262626', color: '#FFFFFF', border: '1px solid #333333', fontWeight: 700 }}
        >
          {t('settleUp')}
        </button>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/add-expense', { state: { groupId } })}
          id="add-expense-btn"
          style={{ background: '#A3E635', color: '#000000', fontWeight: 700, border: 'none' }}
        >
          {t('addExpense')}
        </button>
      </div>

      <ExpenseDetailsModal expense={activeExpense} onClose={() => setActiveExpense(null)} />
      <SettlementDetailsModal settlement={activeSettlement} onClose={() => setActiveSettlement(null)} />
      <InviteGroupModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} group={group} />
    </div>
  );
}
