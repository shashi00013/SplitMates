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
    cancelSettlement, showToast,
  } = useApp();

  const group = groups.find((g) => g.id === groupId);
  const members = group ? getGroupMembers(groupId) : [];
  const settlement = settlements[groupId];
  const groupExpenses = expenses.filter((e) => e.groupId === groupId);

  const allConfirmed = settlement
    ? settlement.confirmations.length >= members.length
    : false;
  const isCompleted = settlement?.status === 'completed';

  const hasCompletedRef = useRef(false);

  useEffect(() => {
    let isSubscribed = true;
    async function finalizeSettlement() {
      if (allConfirmed && !isCompleted && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        const historyEntry = await completeSettlement(groupId);
        if (isSubscribed) {
          navigate(`/settlement-success/${groupId}`, {
            state: { historyEntry },
            replace: true,
          });
        }
      }
    }
    finalizeSettlement();
    return () => { isSubscribed = false; };
  }, [allConfirmed, isCompleted, groupId, completeSettlement, navigate]);

  if (!group) {
    return (
      <div className="page">
        <p className="text-secondary text-center mt-24">Group not found</p>
      </div>
    );
  }

  if (allConfirmed && isCompleted) return null;

  const [isInitiating, setIsInitiating] = useState(false);
  const [confirmingMemberId, setConfirmingMemberId] = useState(null);

  async function handleInitiate() {
    if (isInitiating) return;
    setIsInitiating(true);
    try {
      await initiateSettlement(groupId);
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
    } catch (err) {
      showToast(err.message || 'Failed to confirm settlement');
    } finally {
      setConfirmingMemberId(null);
    }
  }

  function handleCancel() {
    cancelSettlement(groupId);
    navigate(`/group/${groupId}`);
  }

  const balances = getBalancesForGroup(groupId);
  const transactions = calculateSettlementTransactions(balances);
  const totalOutstanding = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  if (!settlement) {
    return (
      <div className="page" id="settlement-page">
        <div className="page-header">
          <button className="btn-icon" onClick={() => navigate(-1)} id="settle-back-btn">
            <ChevronLeft size={20} />
          </button>
          <h1>{t('settleUp')}</h1>
          <div className="spacer" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
          <div className="success-icon-wrapper" style={{ marginBottom: '16px' }}>
            <Users size={32} strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '8px', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            {t('settleUp')} {group.name}
          </h2>
          <p className="text-secondary text-sm" style={{ maxWidth: '280px', textAlign: 'center', lineHeight: 1.5, marginBottom: '24px' }}>
            {t('confirmPaymentDesc')}
          </p>

          {/* Suggested settlement summary */}
          <div className="card" style={{ width: '100%', marginBottom: '24px', padding: '20px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span className="text-secondary text-sm fw-600">{t('remainingAmount')}</span>
              <span className="fw-700 text-accent" style={{ fontSize: '1.15rem' }}>
                {formatCurrency(totalOutstanding)}
              </span>
            </div>

            {/* Balances details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('peopleInGroup')}</p>
              {members.map((member) => {
                const bal = balances[member.id] || 0;
                const isPositive = bal > 0;
                const isNegative = bal < 0;
                return (
                  <div key={member.id} className="flex justify-between items-center text-sm">
                    <span className="text-secondary">{member.name}</span>
                    <span className={isPositive ? 'text-accent fw-600' : isNegative ? 'text-negative fw-600' : 'text-secondary'}>
                      {bal > 0 ? `${t('youGet')} ${formatCurrency(bal)}` : bal < 0 ? `${t('youPay')} ${formatCurrency(Math.abs(bal))}` : t('allSettled')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Suggested Payments */}
            {transactions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suggested Payments</p>
                {transactions.map((tx, idx) => {
                  const fromUser = members.find((m) => m.id === tx.from);
                  const toUser = members.find((m) => m.id === tx.to);
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs"
                      style={{
                        padding: '8px 12px',
                        background: 'var(--bg-elevated)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <span>
                        <strong>{fromUser?.firstName || 'Someone'}</strong> pays{' '}
                        <strong>{toUser?.firstName || 'Someone'}</strong>
                      </span>
                      <span className="fw-700 text-accent">{formatCurrency(tx.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleInitiate}
            id="initiate-settle-btn"
            disabled={groupExpenses.length === 0 || totalOutstanding <= 0.01 || isInitiating}
            style={{ opacity: (groupExpenses.length === 0 || totalOutstanding <= 0.01 || isInitiating) ? 0.45 : 1, fontWeight: 700 }}
          >
            {isInitiating ? t('loading') : t('startSettlingUp')}
          </button>
        </div>
      </div>
    );
  }

  // Active settlement state derivation
  const isUserConfirmed = settlement.confirmations.includes(user.id);
  const confirmedCount = settlement.confirmations.length;
  const pendingCount = members.length - confirmedCount;

  return (
    <div className="page" id="settlement-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate(-1)} id="settle-back-btn">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1>{t('settleUp')}</h1>
          <p className="text-secondary text-xs">{group.name}</p>
        </div>
        <div className="spacer" />
      </div>

      {/* Status Card & Primary Action State */}
      <div className="card text-center" style={{ padding: '24px 20px', marginBottom: '20px' }}>
        {allConfirmed ? (
          <>
            <div className="success-icon-wrapper" style={{ margin: '0 auto 12px auto' }}>
              <Check size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              Everyone is confirmed
            </h3>
            <p className="text-secondary text-sm" style={{ margin: '0 0 20px 0' }}>
              Settlement is ready to be completed.
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={async () => {
                const historyEntry = await completeSettlement(groupId);
                navigate(`/settlement-success/${groupId}`, { state: { historyEntry }, replace: true });
              }}
              id="complete-settlement-btn"
            >
              Complete Settlement
            </button>
          </>
        ) : !isUserConfirmed ? (
          <>
            <div className="success-icon-wrapper" style={{ margin: '0 auto 12px auto', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              <Clock size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              Your confirmation is needed
            </h3>
            <p className="text-secondary text-sm" style={{ margin: '0 0 20px 0' }}>
              Confirm that you have completed your payment.
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => handleConfirm(user.id)}
              disabled={confirmingMemberId === user.id}
              id="confirm-payment-btn"
            >
              {confirmingMemberId === user.id ? t('loading') : t('confirmPayment')}
            </button>
          </>
        ) : (
          <>
            <div className="success-icon-wrapper" style={{ margin: '0 auto 12px auto', background: 'rgba(22, 163, 74, 0.15)', color: 'var(--positive)' }}>
              <Check size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              You're all set
            </h3>
            <p className="text-secondary text-sm" style={{ margin: 0 }}>
              Waiting for remaining members ({confirmedCount}/{members.length}).
            </p>
          </>
        )}
      </div>

      {/* Member List */}
      <div className="card" style={{ padding: '0 16px', marginBottom: '20px' }}>
        {members.map((member) => {
          const isMe = member.id === user.id;
          const isConfirmed = settlement.confirmations.includes(member.id);
          return (
            <div
              key={member.id}
              className="settle-member"
              onClick={() => !isConfirmed && isMe && handleConfirm(member.id)}
              style={{ cursor: (!isConfirmed && isMe) ? 'pointer' : 'default', padding: '14px 0' }}
              id={`settle-member-${member.id}`}
            >
              <Avatar user={member} />
              <div className="member-info" style={{ flex: 1 }}>
                <h3>{isMe ? `You (${member.firstName})` : member.name}</h3>
                <p className={`text-sm ${isConfirmed ? 'text-accent' : 'text-secondary'}`}>
                  {isConfirmed
                    ? (isMe ? '✓ You confirmed' : '✓ Confirmed')
                    : confirmingMemberId === member.id
                    ? t('loading')
                    : 'Waiting for confirmation'}
                </p>
              </div>
              <div className={`status-badge ${isConfirmed ? 'status-confirmed' : 'status-pending'}`}>
                {isConfirmed ? <Check size={16} /> : <Clock size={16} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contextual Send Reminder Action */}
      {!allConfirmed && (
        <button
          className="btn-link text-xs text-secondary flex justify-center items-center gap-4"
          style={{ width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={async () => {
            try {
              const res = await notificationsApi.sendReminder(groupId);
              showToast(res?.message || 'Notifications sent to pending members!');
            } catch (err) {
              showToast(err.message || 'Failed to send reminders');
            }
          }}
          id="notify-pending-btn"
        >
          <Send size={13} /> Send Reminder
        </button>
      )}
    </div>
  );
}
