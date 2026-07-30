import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Clock, Send, Users, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import { calculateSettlementTransactions } from '../data/balanceEngine';
import { notificationsApi } from '../services/apiService';
import Avatar from '../components/Avatar';

export default function Settlement() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { t, formatMemberPay, formatMemberOwed } = useLanguage();
  const {
    user, groups, expenses, settlements,
    getGroupMembers, getBalancesForGroup,
    initiateSettlement, confirmSettlement, completeSettlement,
    cancelSettlement, showToast, isLoading, getUserById
  } = useApp();

  const [isInitiating, setIsInitiating] = useState(false);
  const [confirmingMemberId, setConfirmingMemberId] = useState(null);
  const [showDetails, setShowDetails] = useState(false); // Collapsed by default (Progressive Disclosure)
  const hasCompletedRef = useRef(false);

  const group = groups.find((g) => g.id === groupId || String(g.id) === String(groupId));
  const members = group ? getGroupMembers(groupId) : [];
  const settlement = settlements[groupId];
  const groupExpenses = expenses.filter((e) => e.groupId === groupId);

  const confirmedCount = settlement ? settlement.confirmations.length : 0;
  const totalMembersCount = members.length;
  const allConfirmed = settlement ? confirmedCount >= totalMembersCount && totalMembersCount > 0 : false;
  const isCompleted = settlement?.status === 'completed';

  useEffect(() => {
    let isSubscribed = true;
    async function finalizeSettlement() {
      if (allConfirmed && !isCompleted && !hasCompletedRef.current && group) {
        hasCompletedRef.current = true;
        try {
          const historyEntry = await completeSettlement(groupId);
          if (isSubscribed) {
            navigate(`/settlement-success/${groupId}`, {
              state: { historyEntry, groupName: group?.name },
              replace: true,
            });
          }
        } catch (err) {
          hasCompletedRef.current = false;
          showToast(err.message || 'Failed to complete settlement');
        }
      }
    }
    finalizeSettlement();
    return () => { isSubscribed = false; };
  }, [allConfirmed, isCompleted, groupId, completeSettlement, navigate, group?.name, showToast, group]);

  if (!group) {
    if (isLoading || groups.length === 0) {
      return (
        <div className="page flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px auto'
            }} />
            <p className="text-secondary text-xs fw-600">Loading settlement...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="page">
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

  if (allConfirmed && isCompleted) return null;

  async function handleInitiate() {
    if (isInitiating) return;
    setIsInitiating(true);
    try {
      await initiateSettlement(groupId);
      showToast('Settlement initiated');
    } catch (err) {
      showToast(err.message || 'Failed to initiate settlement');
    } finally {
      setIsInitiating(false);
    }
  }

  async function handleConfirm(memberId) {
    if (confirmingMemberId) return;
    setConfirmingMemberId(memberId);
    try {
      if (!settlement) {
        await initiateSettlement(groupId);
      }
      await confirmSettlement(groupId, memberId || user?.id);
      showToast('Marked as paid ✅');
    } catch (err) {
      showToast(err.message || 'Failed to mark as paid');
    } finally {
      setConfirmingMemberId(null);
    }
  }

  async function handleComplete() {
    try {
      const historyEntry = await completeSettlement(groupId);
      navigate(`/settlement-success/${groupId}`, {
        state: { historyEntry, groupName: group.name },
        replace: true,
      });
    } catch (err) {
      showToast(err.message || 'Failed to complete settlement');
    }
  }

  const balances = getBalancesForGroup(groupId);
  const transactions = calculateSettlementTransactions(balances);
  const totalOutstanding = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const isUserConfirmed = settlement ? settlement.confirmations.includes(user?.id) : false;
  const pendingCount = totalMembersCount - confirmedCount;

  // Format simple who-owes-whom sentences
  const simpleSentences = transactions.map((tx) => {
    const fromUser = getUserById(tx.from);
    const toUser = getUserById(tx.to);

    if (tx.from === user?.id) {
      return formatMemberPay(toUser?.firstName || 'Dost', formatCurrency(tx.amount));
    } else if (tx.to === user?.id) {
      return formatMemberOwed(fromUser?.firstName || 'Dost', formatCurrency(tx.amount));
    }
    return formatMemberPay(toUser?.firstName || 'Member', formatCurrency(tx.amount));
  });

  return (
    <div className="page" id="settlement-page">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="page-header flex items-center justify-between" style={{ paddingBottom: '12px' }}>
        <button className="btn-icon" onClick={() => navigate(`/group/${groupId}`)} id="settle-back-btn" aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {t('settleUp')}
          </h1>
          <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>{group.name}</p>
        </div>
        <div style={{ width: '42px' }} />
      </div>

      {/* ── DEFAULT VIEW: Simple Statement & Dominant CTA ──────────────── */}
      <div className="card card-glow page-section text-center" style={{ padding: '24px 20px' }}>
        <div className="success-icon-wrapper" style={{ margin: '0 auto 16px auto', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
          <Check size={32} strokeWidth={2.5} />
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
          Pending Dues
        </h2>

        {simpleSentences.length > 0 ? (
          <div className="flex flex-col gap-8" style={{ marginBottom: '20px' }}>
            {simpleSentences.map((sentence, idx) => (
              <p key={idx} style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--accent)' }}>
                {sentence}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm fw-600 text-positive" style={{ marginBottom: '20px' }}>
            {t('allSettledUp')}
          </p>
        )}

        {/* PRIMARY CTA: Mark as Paid */}
        {allConfirmed ? (
          <button
            className="btn btn-primary btn-full"
            onClick={handleComplete}
            id="complete-settlement-btn"
            style={{ minHeight: '48px', fontSize: '1rem', fontWeight: 800 }}
          >
            Complete Settlement
          </button>
        ) : (
          <button
            className="btn btn-primary btn-full"
            onClick={() => handleConfirm(user?.id)}
            disabled={isUserConfirmed || confirmingMemberId === user?.id || simpleSentences.length === 0}
            id="mark-as-paid-btn"
            style={{
              opacity: (isUserConfirmed || simpleSentences.length === 0) ? 0.6 : 1,
              minHeight: '48px',
              fontSize: '1rem',
              fontWeight: 800,
            }}
          >
            {isUserConfirmed ? '✓ Paid & Confirmed' : confirmingMemberId === user?.id ? 'Processing...' : (t('markAsPaid') || 'Mark as Paid')}
          </button>
        )}
      </div>

      {/* ── MORE OPTIONS: Collapsible Details (Logs, Statuses, Reminders) ── */}
      <div className="page-section" id="settlement-details-section">
        <button
          type="button"
          className="btn btn-secondary btn-full flex items-center justify-between"
          onClick={() => setShowDetails((prev) => !prev)}
          id="toggle-settlement-details-btn"
          style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <span>{t('detailsAndHistory')}</span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetails && (
          <div className="flex flex-col gap-16" style={{ marginTop: '14px' }}>
            {/* Progress Bar */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '10px' }}>
                <span className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Confirmation Progress
                </span>
                <span className="fw-700 text-accent" style={{ fontSize: '0.88rem' }}>
                  {confirmedCount} of {totalMembersCount} members
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.round((confirmedCount / (totalMembersCount || 1)) * 100)}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            {/* Member Confirmations List */}
            <div className="card" style={{ padding: '0 16px' }}>
              <div style={{ padding: '14px 0 10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Who Confirmed
                </span>
              </div>
              {members.map((member) => {
                const isMe = member.id === user?.id;
                const isConfirmed = settlement?.confirmations?.includes(member.id);
                const memberName = isMe ? 'You' : member.firstName || member.name;

                return (
                  <div
                    key={member.id}
                    className="flex justify-between items-center"
                    style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}
                    id={`settle-member-${member.id}`}
                  >
                    <div className="flex items-center gap-10">
                      <Avatar user={member} size="sm" />
                      <div>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {memberName}
                        </h4>
                        <p className={`text-xs ${isConfirmed ? 'text-accent' : 'text-secondary'}`} style={{ margin: 0, marginTop: '2px', fontWeight: 600 }}>
                          {isConfirmed ? '✓ Confirmed' : 'Pending payment'}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isConfirmed ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                        color: isConfirmed ? 'var(--accent)' : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isConfirmed ? <Check size={15} strokeWidth={2.5} /> : <Clock size={15} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Send Reminder Action */}
            <button
              className="btn btn-ghost text-xs flex items-center justify-center gap-6"
              style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '10px' }}
              onClick={async () => {
                try {
                  const res = await notificationsApi.sendReminder(groupId);
                  showToast(res?.message || 'Reminders sent to pending members!');
                } catch (err) {
                  showToast(err.message || 'Failed to send reminders');
                }
              }}
              id="notify-pending-btn"
            >
              <Send size={14} /> Send Reminder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
