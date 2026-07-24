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

  // Active settlement screen
  const confirmedCount = settlement.confirmations.length;
  const pendingCount = members.length - confirmedCount;
  const progressPct = members.length > 0 ? (confirmedCount / members.length) * 100 : 0;

  return (
    <div className="page" id="settlement-page">
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate(-1)} id="settle-back-btn">
          <ChevronLeft size={20} />
        </button>
        <h1>{t('settleUp')}</h1>
        <div className="spacer" />
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '20px', marginBottom: '20px' }}>
        <p className="text-secondary text-sm" style={{ marginBottom: '10px' }}>
          {confirmedCount} of {members.length} {t('confirmPayment')}
        </p>
        <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'var(--accent)',
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <p className="text-secondary text-xs">
          {pendingCount > 0
            ? `${pendingCount} member${pendingCount > 1 ? 's' : ''} ${t('waitingForConfirmations')}`
            : t('allMembersConfirmed')}
        </p>
      </div>

      <div className="card" style={{ padding: '0 16px', marginBottom: '20px' }}>
        {members.map((member) => {
          const isMe = member.id === user.id;
          const isConfirmed = settlement.confirmations.includes(member.id);
          return (
            <div
              key={member.id}
              className="settle-member"
              onClick={() => !isConfirmed && handleConfirm(member.id)}
              style={{ cursor: isConfirmed ? 'default' : 'pointer', padding: '14px 0' }}
              id={`settle-member-${member.id}`}
            >
              <Avatar user={member} />
              <div className="member-info" style={{ flex: 1 }}>
                <h3>{isMe ? `You (${member.firstName})` : member.name}</h3>
                <p className={`text-sm ${isConfirmed ? 'text-accent' : 'text-secondary'}`}>
                  {isConfirmed
                    ? `✓ ${t('confirmPayment')}`
                    : confirmingMemberId === member.id
                    ? t('loading')
                    : isMe
                    ? `Tap to ${t('confirmPayment')}`
                    : t('waitingForConfirmations')}
                </p>
              </div>
              <div className={`status-badge ${isConfirmed ? 'status-confirmed' : 'status-pending'}`}>
                {isConfirmed ? <Check size={16} /> : <Clock size={16} />}
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="btn btn-outline btn-full"
        style={{ marginBottom: '12px' }}
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
        <Send size={16} /> Send Reminder
      </button>

      <button
        className="btn btn-danger-text btn-full"
        onClick={handleCancel}
        id="cancel-settle-btn"
      >
        {t('cancelSettlementBtn')}
      </button>
    </div>
  );
}
