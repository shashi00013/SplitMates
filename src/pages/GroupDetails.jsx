import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, LogOut, QrCode, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import Avatar from '../components/Avatar';
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
    getSettlementHistory,
    leaveGroup,
    showToast,
    isLoading,
    settlements,
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
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const members = getGroupMembers(groupId);
  const balances = getBalancesForGroup(groupId);
  const myBalance = balances[user?.id] || 0;
  const statusClass = myBalance > 0 ? 'text-accent' : myBalance < 0 ? 'text-negative' : 'text-secondary';

  const groupExpenses = getGroupExpenses(groupId);
  const activeCycleExpenses = groupExpenses.filter((e) => !e.settled);

  const recentExpenses = [...activeCycleExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

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
      {/* TIER 1 — HEADER */}
      <div className="flex items-center justify-between" style={{ paddingBottom: '8px', position: 'relative' }}>
        <button className="btn-icon" onClick={() => navigate('/groups')} id="group-back-btn">
          <ChevronLeft size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{group.name}</h1>
          <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>
            {members.length} members
          </p>
        </div>

        <button
          className="btn-icon"
          id="group-menu-btn"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Group options"
        >
          <MoreVertical size={20} />
        </button>

        {/* ⋯ Contextual Menu */}
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '8px',
              boxShadow: 'var(--shadow-card)',
              zIndex: 100,
              minWidth: '190px',
            }}
            id="group-dropdown-menu"
          >
            <button
              className="menu-item flex items-center gap-10"
              onClick={() => { setShowMenu(false); setIsInviteOpen(true); }}
              style={{ padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
            >
              <QrCode size={16} style={{ color: 'var(--accent)' }} /> Group Code & QR
            </button>
            <button
              className="menu-item flex items-center gap-10"
              onClick={() => { setShowMenu(false); navigate(`/settle/${groupId}`); }}
              style={{ padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
            >
              <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} /> Settle Up
            </button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
            <button
              className="menu-item flex items-center gap-10"
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              style={{ padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', color: 'var(--negative)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
            >
              <LogOut size={16} /> {isLeaving ? 'Leaving...' : 'Leave Group'}
            </button>
          </div>
        )}
      </div>

      {/* TIER 2 — NET BALANCE HERO */}
      <div className="card card-glow page-section" style={{ marginTop: '12px', padding: '20px' }} id="group-net-balance-card">
        <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
          {t('netBalance')}
        </p>
        <p className="financial-hero-amount" style={{ color: myBalance > 0 ? 'var(--accent)' : myBalance < 0 ? 'var(--negative)' : 'var(--text-primary)' }}>
          {formatCurrency(Math.abs(myBalance))}
        </p>
        {myBalance > 0 ? (
          <p className="text-accent text-sm fw-600" style={{ marginTop: '8px' }}>
            ↑ You'll get {formatCurrency(Math.abs(myBalance))}
          </p>
        ) : myBalance < 0 ? (
          <p className="text-negative text-sm fw-600" style={{ marginTop: '8px' }}>
            ↓ You'll pay {formatCurrency(Math.abs(myBalance))}
          </p>
        ) : (
          <p className="text-sm fw-600" style={{ marginTop: '8px', color: 'var(--positive)' }}>
            All settled
          </p>
        )}
      </div>

      {/* TIER 3 — ACTIVE SETTLEMENT ATTENTION (Rendered ONLY when active) */}
      {settlements[groupId]?.status === 'pending' && (
        <div
          className="card page-section flex items-center justify-between"
          style={{
            padding: '14px 16px',
            background: 'rgba(255, 165, 2, 0.10)',
            border: '1px solid var(--warning)',
            cursor: 'pointer',
          }}
          onClick={() => navigate(`/settle/${groupId}`)}
          id="group-active-settlement-card"
        >
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Settlement in progress
            </h4>
            <p className="text-secondary text-xs" style={{ margin: 0, marginTop: '2px' }}>
              Your confirmation is needed
            </p>
          </div>
          <div className="flex items-center gap-4 text-accent text-xs fw-600" style={{ color: 'var(--warning)' }}>
            <span>Tap to continue</span>
            <ArrowUpRight size={16} />
          </div>
        </div>
      )}

      {/* TIER 4 — MEMBERS & DUES */}
      <div className="section-header">
        <h2>Members ({members.length})</h2>
      </div>

      <div className="card page-section" style={{ padding: '8px 16px' }}>
        {members.map((m) => {
          const bal = balances[m.id] || 0;
          const isMe = m.id === user?.id;
          const bClass = bal > 0 ? 'text-accent' : bal < 0 ? 'text-negative' : 'text-secondary';
          const memberName = isMe ? 'You' : m.firstName || m.name || 'Member';
          const balText = isMe
            ? (bal > 0 ? `Others owe you ${formatCurrency(bal)}` : bal < 0 ? `You owe others ${formatCurrency(Math.abs(bal))}` : 'All settled')
            : (bal > 0 ? `${memberName} owes you ${formatCurrency(bal)}` : bal < 0 ? `You owe ${memberName} ${formatCurrency(Math.abs(bal))}` : 'All settled');

          return (
            <div
              key={m.id}
              className="flex justify-between items-center"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-10">
                <Avatar user={m} size="sm" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {memberName}
                </span>
              </div>
              <span className={`text-xs fw-700 ${bClass}`}>
                {balText}
              </span>
            </div>
          );
        })}
      </div>

      {/* TIER 5 — CURRENT EXPENSES */}
      <div className="section-header flex justify-between items-center">
        <h2>Expenses ({activeCycleExpenses.length})</h2>
        <button className="see-all" onClick={() => navigate('/expenses')} id="see-all-group-expenses">
          {t('viewAll')}
        </button>
      </div>

      <div className="card page-section" style={{ padding: '0 16px' }}>
        {activeCycleExpenses.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '24px 0' }}>{t('noExpensesYet')}</p>
        ) : (
          recentExpenses.map((exp) => {
            const payer = members.find((m) => m.id === exp.paidBy);
            const paidByLabel = exp.paidBy === user?.id ? 'You' : payer?.firstName || 'Member';
            const participants = exp.participants || exp.splitAmong || [];
            const isPayer = exp.paidBy === user?.id;
            const isParticipant = participants.includes(user?.id);
            const userShare = exp.shares?.[user?.id] || (isParticipant ? (exp.amount / (participants.length || 1)) : 0);
            const receivable = isPayer ? Math.max(0, exp.amount - userShare) : 0;
            const impactClass = isPayer ? (receivable > 0 ? 'text-accent' : 'text-secondary') : userShare > 0 ? 'text-negative' : 'text-secondary';
            const impactText = isPayer
              ? (receivable > 0 ? `Others owe you ${formatCurrency(receivable)}` : 'All settled')
              : (userShare > 0 ? `You owe ${payer?.firstName || 'member'} ${formatCurrency(userShare)}` : 'Not involved');

            return (
              <div
                key={exp.id}
                className="expense-row"
                onClick={() => setActiveExpense(exp)}
                style={{ cursor: 'pointer' }}
                id={`group-expense-${exp.id}`}
              >
                <div className="expense-icon">{exp.emoji}</div>
                <div className="expense-info">
                  <h3>{exp.title}</h3>
                  <p>{t('paidBy')} {paidByLabel} · {formatDate(exp.date)}</p>
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

      {/* TIER 6 — ONE PRIMARY ACTION */}
      <div style={{ marginTop: '8px' }}>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/add-expense', { state: { groupId } })}
          id="add-expense-btn"
        >
          + {t('addExpense')}
        </button>
      </div>

      <ExpenseDetailsModal expense={activeExpense} onClose={() => setActiveExpense(null)} />
      <SettlementDetailsModal settlement={activeSettlement} onClose={() => setActiveSettlement(null)} />
      <InviteGroupModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} group={group} />
    </div>
  );
}
