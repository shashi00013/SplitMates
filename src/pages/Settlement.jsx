import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Clock, Send, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import { calculateSettlementTransactions } from '../data/balanceEngine';
import { notificationsApi } from '../services/apiService';
import Avatar from '../components/Avatar';

export default function Settlement() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    user, groups, expenses, settlements,
    getGroupMembers, getBalancesForGroup,
    initiateSettlement, confirmSettlement, completeSettlement,
    cancelSettlement, showToast, isLoading,
  } = useApp();

  // All hooks MUST be called unconditionally at the top (Rules of Hooks)
  const [isInitiating, setIsInitiating] = useState(false);
  const [confirmingMemberId, setConfirmingMemberId] = useState(null);
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

  // Loading state — data not yet hydrated after refresh
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
    if (!settlement || confirmingMemberId) return;
    if (settlement.confirmations.includes(memberId)) return;
    setConfirmingMemberId(memberId);
    try {
      await confirmSettlement(groupId, memberId);
      showToast('Payment confirmed');
    } catch (err) {
      showToast(err.message || 'Failed to confirm payment');
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

  return (
    <div className="page" id="settlement-page">
      {/* 1. HEADER (Minimal) */}
      <div className="page-header flex items-center justify-between" style={{ paddingBottom: '12px' }}>
        <button className="btn-icon" onClick={() => navigate(`/group/${groupId}`)} id="settle-back-btn" aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Settle Up
          </h1>
          <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>{group.name}</p>
        </div>
        <div style={{ width: '42px' }} />
      </div>

      {/* STATE A — SETTLEMENT NOT STARTED */}
      {!settlement && (
        <div className="flex flex-col items-center" style={{ paddingTop: '12px' }}>
          <div className="card card-glow page-section text-center" style={{ width: '100%', padding: '24px 20px' }}>
            <div className="success-icon-wrapper" style={{ margin: '0 auto 16px auto', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              <Users size={32} strokeWidth={2} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Ready to settle?
            </h2>
            <p className="text-secondary text-sm" style={{ maxWidth: '300px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Review the final balances and start the settlement for {group.name}.
            </p>

            {/* Financial Summary */}
            <div className="flex justify-between items-center" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <span className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Remaining Amount
              </span>
              <span className="fw-800 text-accent" style={{ fontSize: '1.2rem' }}>
                {formatCurrency(totalOutstanding)}
              </span>
            </div>

            {/* Balances details */}
            <div className="flex flex-col gap-10" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Group Balances
              </p>
              {members.map((member) => {
                const bal = balances[member.id] || 0;
                const isMe = member.id === user?.id;
                const memberName = isMe ? 'You' : member.firstName || member.name;
                const statusClass = bal > 0 ? 'text-accent fw-700' : bal < 0 ? 'text-negative fw-700' : 'text-secondary';
                const statusText = bal > 0 ? `↑ You'll get ${formatCurrency(bal)}` : bal < 0 ? `↓ You'll pay ${formatCurrency(Math.abs(bal))}` : 'All settled';

                return (
                  <div key={member.id} className="flex justify-between items-center text-xs" style={{ padding: '6px 0' }}>
                    <div className="flex items-center gap-8">
                      <Avatar user={member} size="sm" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{memberName}</span>
                    </div>
                    <span className={statusClass}>{statusText}</span>
                  </div>
                );
              })}
            </div>

            {/* Pending Transactions List */}
            {transactions.length > 0 && (
              <div className="flex flex-col gap-10" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', textAlign: 'left' }}>
                <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Settlement Payments
                </p>
                {transactions.map((tx, idx) => {
                  const fromUser = members.find((m) => m.id === tx.from);
                  const toUser = members.find((m) => m.id === tx.to);
                  const fromName = tx.from === user?.id ? 'You' : fromUser?.firstName || 'Member';
                  const toName = tx.to === user?.id ? 'you' : toUser?.firstName || 'Member';

                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs"
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {fromName} {tx.from === user?.id ? 'pay' : 'pays'} {toName}
                      </span>
                      <span className="fw-700 text-accent" style={{ fontSize: '0.88rem' }}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STATE A PRIMARY CTA */}
          <button
            className="btn btn-primary btn-full"
            onClick={handleInitiate}
            id="initiate-settle-btn"
            disabled={groupExpenses.length === 0 || totalOutstanding <= 0.01 || isInitiating}
            style={{
              opacity: (groupExpenses.length === 0 || totalOutstanding <= 0.01 || isInitiating) ? 0.45 : 1,
              fontWeight: 800,
              minHeight: '48px',
              fontSize: '1rem',
            }}
          >
            {isInitiating ? 'Starting...' : 'Start Settling'}
          </button>
        </div>
      )}

      {/* ACTIVE SETTLEMENT STATES (B, C, D) */}
      {settlement && (
        <div className="flex flex-col gap-20">
          {/* PROGRESS INDICATOR */}
          <div className="card page-section" style={{ padding: '16px 20px' }} id="settlement-progress-card">
            <div className="flex justify-between items-center" style={{ marginBottom: '10px' }}>
              <span className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Settlement Progress
              </span>
              <span className="fw-700 text-accent" style={{ fontSize: '0.88rem' }}>
                {confirmedCount} of {totalMembersCount} members confirmed
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

          {/* HERO STATUS & SINGLE DOMINANT PRIMARY CTA */}
          <div className="card text-center page-section" style={{ padding: '24px 20px' }}>
            {allConfirmed ? (
              /* STATE D — ALL REQUIRED MEMBERS CONFIRMED */
              <>
                <div className="success-icon-wrapper" style={{ margin: '0 auto 14px auto', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  <Check size={32} strokeWidth={2.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Everyone is confirmed
                </h3>
                <p className="text-secondary text-sm" style={{ margin: '0 0 20px 0' }}>
                  Settlement is ready to be completed.
                </p>
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleComplete}
                  id="complete-settlement-btn"
                  style={{ minHeight: '48px', fontSize: '1rem', fontWeight: 800 }}
                >
                  Complete Settlement
                </button>
              </>
            ) : !isUserConfirmed ? (
              /* STATE B — USER CONFIRMATION REQUIRED */
              <>
                <div className="success-icon-wrapper" style={{ margin: '0 auto 14px auto', background: 'rgba(255, 165, 2, 0.12)', color: 'var(--warning)' }}>
                  <Clock size={32} strokeWidth={2.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Your confirmation is needed
                </h3>
                <p className="text-secondary text-sm" style={{ margin: '0 0 20px 0' }}>
                  Confirm that you have completed your payment.
                </p>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleConfirm(user?.id)}
                  disabled={confirmingMemberId === user?.id}
                  id="confirm-payment-btn"
                  style={{ minHeight: '48px', fontSize: '1rem', fontWeight: 800 }}
                >
                  {confirmingMemberId === user?.id ? 'Confirming...' : 'Confirm Payment'}
                </button>
              </>
            ) : (
              /* STATE C — CURRENT USER ALREADY CONFIRMED */
              <>
                <div className="success-icon-wrapper" style={{ margin: '0 auto 14px auto', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  <Check size={32} strokeWidth={2.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  You're all set
                </h3>
                <p className="text-accent text-xs fw-700" style={{ margin: '0 0 6px 0' }}>
                  ✓ You confirmed
                </p>
                <p className="text-secondary text-sm" style={{ margin: 0 }}>
                  Waiting for remaining members ({pendingCount})
                </p>
              </>
            )}
          </div>

          {/* MEMBER CONFIRMATION STATUS LIST */}
          <div className="card page-section" style={{ padding: '0 16px' }}>
            <div style={{ padding: '14px 0 10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Member Confirmation Status
              </span>
            </div>
            {members.map((member) => {
              const isMe = member.id === user?.id;
              const isConfirmed = settlement.confirmations.includes(member.id);
              const memberName = isMe ? 'You' : member.firstName || member.name;

              const statusLabel = isConfirmed
                ? (isMe ? '✓ You confirmed' : '✓ Confirmed')
                : (isMe ? 'Waiting for your confirmation' : 'Waiting for confirmation');

              const statusColorClass = isConfirmed ? 'text-accent' : 'text-secondary';

              return (
                <div
                  key={member.id}
                  className="flex justify-between items-center"
                  style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}
                  id={`settle-member-${member.id}`}
                >
                  <div className="flex items-center gap-10">
                    <Avatar user={member} size="sm" />
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {memberName}
                      </h4>
                      <p className={`text-xs ${statusColorClass}`} style={{ margin: 0, marginTop: '2px', fontWeight: 600 }}>
                        {statusLabel}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isConfirmed ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      color: isConfirmed ? 'var(--accent)' : 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isConfirmed ? <Check size={16} strokeWidth={2.5} /> : <Clock size={16} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. CONTEXTUAL SEND REMINDER (Subtle Secondary Action) */}
          {!allConfirmed && (
            <div className="flex justify-center" style={{ paddingBottom: '12px' }}>
              <button
                className="btn btn-ghost text-xs flex items-center gap-6"
                style={{ color: 'var(--text-secondary)', fontWeight: 600 }}
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
      )}
    </div>
  );
}
