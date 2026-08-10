import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, QrCode, CheckCircle2, ChevronDown, ChevronUp, Users, ArrowUpRight, PlusCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import { calculateSettlementTransactions } from '../data/balanceEngine';
import Avatar from '../components/Avatar';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import SettlementDetailsModal from '../components/SettlementDetailsModal';
import InviteGroupModal from '../components/InviteGroupModal';

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { t, formatYouGet, formatYouPay, formatMemberOwed, formatMemberPay, formatPaidBy } = useLanguage();
  const [activeExpense, setActiveExpense] = useState(null);
  const [activeSettlement, setActiveSettlement] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    user,
    groups,
    getGroupMembers,
    getBalancesForGroup,
    getGroupExpenses,
    getUserById,
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

  const members = useMemo(() => getGroupMembers(groupId), [getGroupMembers, groupId]);
  const balances = useMemo(() => getBalancesForGroup(groupId), [getBalancesForGroup, groupId]);
  const myBalance = balances[user?.id] || 0;

  const groupExpenses = useMemo(() => getGroupExpenses(groupId), [getGroupExpenses, groupId]);
  const activeCycleExpenses = useMemo(() => groupExpenses.filter((e) => !e.settled), [groupExpenses]);
  const recentExpenses = useMemo(() => [...activeCycleExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3), [activeCycleExpenses]);

  // Compute exact simplified pair-wise dues for this group
  const memberDuesSentences = useMemo(() => {
    const groupTxs = calculateSettlementTransactions(balances);
    return groupTxs.map((tx) => {
      const fromUser = getUserById(tx.from);
      const toUser = getUserById(tx.to);

      if (tx.from === user?.id) {
        return {
          type: 'owe',
          text: formatMemberPay(toUser?.firstName || 'Dost', formatCurrency(tx.amount)),
          amount: tx.amount,
          targetUser: toUser,
        };
      } else if (tx.to === user?.id) {
        return {
          type: 'owed',
          text: formatMemberOwed(fromUser?.firstName || 'Dost', formatCurrency(tx.amount)),
          amount: tx.amount,
          targetUser: fromUser,
        };
      }
      return null;
    }).filter(Boolean);
  }, [balances, getUserById, user?.id, formatMemberPay, formatMemberOwed]);

  async function handleLeaveGroup() {
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
      setShowLeaveConfirm(false);
    }
  }

  return (
    <div className="page" id="group-details-page">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between" style={{ paddingBottom: '8px' }}>
        <button className="btn-icon" onClick={() => navigate('/groups')} id="group-back-btn">
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-8">
          <span style={{ fontSize: '1.4rem' }}>{group.icon || '🏠'}</span>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{group.name}</h1>
        </div>

        <div style={{ width: '36px' }} />
      </div>

      {/* ── DEFAULT VIEW: Simple Balance Summary Card ───────────────────── */}
      <div className="card card-glow page-section" style={{ marginTop: '12px', padding: '20px' }} id="group-net-balance-card">
        <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          {t('netBalance')}
        </p>

        {memberDuesSentences.length > 0 ? (
          <div className="flex flex-col gap-6">
            {memberDuesSentences.map((sentence, idx) => (
              <p
                key={idx}
                className={sentence.type === 'owed' ? 'text-accent fw-700' : 'text-negative fw-700'}
                style={{ fontSize: '1.05rem', margin: 0 }}
              >
                {sentence.text}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm fw-600" style={{ color: 'var(--positive)', margin: 0 }}>
            {t('allSettledUp')}
          </p>
        )}
      </div>

      {/* ── DEFAULT VIEW: Main Action Buttons ───────────────────────────── */}
      <div className="grid grid-2 gap-12 page-section" style={{ marginTop: '-4px' }}>
        <button
          className="btn btn-primary flex items-center justify-center gap-6"
          onClick={() => navigate('/add-expense', { state: { groupId } })}
          id="group-add-expense-btn"
          style={{ padding: '12px', fontWeight: 700, fontSize: '0.9rem' }}
        >
          <PlusCircle size={18} />
          + {t('addExpense')}
        </button>
        <button
          className="btn btn-secondary flex items-center justify-center gap-6"
          onClick={() => navigate(`/settle/${groupId}`)}
          id="group-settle-up-btn"
          style={{ padding: '12px', fontWeight: 700, fontSize: '0.9rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
        >
          <CheckCircle2 size={18} />
          {t('settleUp')}
        </button>
      </div>

      {/* Active Settlement Attention (If pending) */}
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
              Payment Pending...
            </h4>
            <p className="text-secondary text-xs" style={{ margin: 0, marginTop: '2px' }}>
              {t('settlementInProgress')}
            </p>
          </div>
          <div className="flex items-center gap-4 text-accent text-xs fw-600" style={{ color: 'var(--warning)' }}>
            <span>{t('markAsPaid')}</span>
            <ArrowUpRight size={16} />
          </div>
        </div>
      )}

      {/* ── DEFAULT VIEW: Recent Bills ──────────────────────────────────── */}
      <div className="section-header flex justify-between items-center">
        <h2>Recent Bills ({activeCycleExpenses.length})</h2>
        {activeCycleExpenses.length > 0 && (
          <button className="see-all" onClick={() => navigate('/expenses')} id="see-all-group-expenses">
            {t('viewAll')}
          </button>
        )}
      </div>

      <div className="card page-section" style={{ padding: '0 16px' }}>
        {activeCycleExpenses.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '24px 0' }}>{t('noExpensesYet')}</p>
        ) : (
          recentExpenses.map((exp) => {
            const payer = members.find((m) => m.id === exp.paidBy);
            const paidByLabel = exp.paidBy === user?.id ? (t('you') || 'You') : payer?.firstName || 'Person';
            const participants = exp.participants || exp.splitAmong || [];
            const isPayer = exp.paidBy === user?.id;
            const isParticipant = participants.includes(user?.id);
            const userShare = exp.shares?.[user?.id] || (isParticipant ? (exp.amount / (participants.length || 1)) : 0);
            const receivable = isPayer ? Math.max(0, exp.amount - userShare) : 0;
            const impactClass = isPayer ? (receivable > 0 ? 'text-accent' : 'text-secondary') : userShare > 0 ? 'text-negative' : 'text-secondary';
            const impactText = isPayer
              ? (receivable > 0 ? formatYouGet(formatCurrency(receivable)) : t('allSettledUp'))
              : (userShare > 0 ? formatYouPay(formatCurrency(userShare)) : 'Not involved');

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
                  <p>{formatPaidBy(paidByLabel)} · {formatDate(exp.date)}</p>
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

      {/* ── MORE OPTIONS: Collapsible Section (Members, Invite Code, Detailed Balances, Leave) ── */}
      <div className="page-section" id="group-more-options-section">
        <button
          type="button"
          className="btn btn-secondary btn-full flex items-center justify-between"
          onClick={() => setShowMoreOptions((prev) => !prev)}
          id="toggle-group-more-options-btn"
          style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <span>{t('membersQrDetails')}</span>
          {showMoreOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showMoreOptions && (
          <div className="flex flex-col gap-16" style={{ marginTop: '14px' }}>
            {/* Group Members */}
            <div className="card" style={{ padding: '0 16px' }}>
              <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 0 6px 0' }}>
                Group Members ({members.length})
              </p>
              {members.map((m) => {
                const bal = balances[m.id] || 0;
                const isMe = m.id === user?.id;
                const bClass = bal > 0 ? 'text-accent' : bal < 0 ? 'text-negative' : 'text-secondary';
                const memberName = isMe ? (t('you') || 'You') : m.firstName || m.name || 'Person';
                const balText = isMe
                  ? (bal > 0 ? formatYouGet(formatCurrency(bal)) : bal < 0 ? formatYouPay(formatCurrency(Math.abs(bal))) : t('allSettledUp'))
                  : (bal > 0 ? formatMemberOwed(memberName, formatCurrency(bal)) : bal < 0 ? formatMemberPay(memberName, formatCurrency(Math.abs(bal))) : t('allSettledUp'));

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

            {/* Actions Grid: Invite & Detailed Balances */}
            <div className="flex flex-col gap-8">
              <button
                className="btn btn-secondary flex items-center justify-between"
                onClick={() => setIsInviteOpen(true)}
                id="group-invite-qr-btn"
                style={{ padding: '12px 16px', fontSize: '0.85rem' }}
              >
                <div className="flex items-center gap-10">
                  <QrCode size={18} style={{ color: 'var(--accent)' }} />
                  <span>Invite Friends & Show QR Code</span>
                </div>
                <ArrowUpRight size={16} />
              </button>

              <button
                className="btn btn-secondary flex items-center justify-between"
                onClick={() => navigate('/balance-breakdown')}
                id="group-detailed-balances-btn"
                style={{ padding: '12px 16px', fontSize: '0.85rem' }}
              >
                <div className="flex items-center gap-10">
                  <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
                  <span>Detailed Balance Breakdown</span>
                </div>
                <ArrowUpRight size={16} />
              </button>
            </div>

            {/* Leave Group Button - Loss Aversion: Show confirmation with consequences */}
            <button
              className="btn flex items-center justify-center gap-8"
              onClick={() => setShowLeaveConfirm(true)}
              id="leave-group-btn"
              style={{
                padding: '12px',
                background: 'rgba(255, 71, 87, 0.08)',
                border: '1px solid var(--negative)',
                color: 'var(--negative)',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <LogOut size={16} />
              Leave Group
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ExpenseDetailsModal expense={activeExpense} onClose={() => setActiveExpense(null)} />
      <SettlementDetailsModal settlement={activeSettlement} onClose={() => setActiveSettlement(null)} />
      <InviteGroupModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} group={group} />

      {/* Loss Aversion: Leave Group Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowLeaveConfirm(false)} id="leave-group-confirm-overlay">
          <div
            className="modal-content text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', maxWidth: '380px' }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 71, 87, 0.12)',
                color: 'var(--negative)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <LogOut size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
              {t('leaveGroup')}?
            </h3>
            {/* Show specific consequence based on balance */}
            {myBalance !== 0 && (
              <p className="text-negative text-sm fw-600" style={{ marginBottom: '8px' }}>
                {t('leaveGroupBalanceWarning').replace('{amount}', formatCurrency(Math.abs(myBalance)))}
              </p>
            )}
            <p className="text-secondary text-sm" style={{ lineHeight: 1.5, marginBottom: '20px' }}>
              {t('leaveGroupWarning')}
            </p>
            <div className="flex flex-col gap-10">
              <button
                className="btn btn-primary btn-full"
                onClick={handleLeaveGroup}
                disabled={isLeaving}
                id="confirm-leave-btn"
                style={{ background: 'var(--negative)', borderColor: 'var(--negative)', minHeight: '44px', fontWeight: 700 }}
              >
                {isLeaving ? 'Leaving...' : t('leaveGroup')}
              </button>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowLeaveConfirm(false)}
                id="cancel-leave-btn"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
