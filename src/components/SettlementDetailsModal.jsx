import { X, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate, formatDateTime } from '../data/mockData';
import Avatar from './Avatar';

export default function SettlementDetailsModal({ settlement, onClose }) {
  const { groups, expenses, cycles, getUserById, getGroupMembers } = useApp();
  const { t } = useLanguage();

  if (!settlement) return null;

  const group = groups.find((g) => g.id === settlement.groupId);
  const cycle = cycles?.find((c) => c.id === settlement.cycleId || c.settlementId === settlement.id);
  const cycleExpenses = expenses.filter(
    (e) => e.settlementId === settlement.id || (settlement.cycleId && e.cycleId === settlement.cycleId)
  );

  const groupMembers = group ? getGroupMembers(group.id) : [];
  const transactions = settlement.transactions || [];
  const confirmationList = settlement.confirmations || group?.memberIds || [];

  return (
    <div className="modal-overlay" onClick={onClose} id="settlement-details-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        id="settlement-details-content"
        style={{ maxHeight: '92vh', overflowY: 'auto', background: '#1A1A1A', borderRadius: '20px', padding: '24px' }}
      >
        <div className="modal-drag-handle" />

        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <div className="flex items-center gap-8">
            <ShieldCheck size={20} style={{ color: '#A3E635' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>{t('settleUp')} Details</h2>
          </div>
          <button className="btn-icon" onClick={onClose} id="close-settlement-details-btn" style={{ color: '#888' }}>
            <X size={18} />
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(163, 230, 53, 0.12)',
              border: '1px solid #A3E635',
              color: '#A3E635',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={14} /> {t('allSettled')}
          </span>
        </div>

        {/* Settlement Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', textAlign: 'center' }}>
          <div className="expense-hero-icon-large" style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{group?.icon || '📜'}</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px', marginBottom: '4px', color: '#FFFFFF' }}>
            {group?.name || 'Group Settlement'}
          </h3>
          <p className="text-secondary text-xs" style={{ marginBottom: '12px' }}>
            {cycle ? `Period ID: ${cycle.id}` : 'Historical Period'}
          </p>
          <p className="text-3xl text-accent fw-700" style={{ color: '#A3E635' }}>{formatCurrency(settlement.totalSettled)}</p>
          <div className="flex items-center gap-6 text-secondary text-xs" style={{ marginTop: '10px' }}>
            <Calendar size={14} />
            <span>Completed on {formatDateTime(settlement.completedAt || settlement.date)}</span>
          </div>
        </div>

        {/* Transactions list */}
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ color: '#888' }}>{t('settleUp')} Transactions ({transactions.length})</label>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#111' }}>
            {transactions.length === 0 ? (
              <p className="text-secondary text-xs text-center" style={{ padding: '8px 0' }}>{t('allSettled')}.</p>
            ) : (
              transactions.map((tx, idx) => {
                const fromUser = getUserById(tx.from);
                const toUser = getUserById(tx.to);
                return (
                  <div key={idx} className="flex justify-between items-center text-sm" style={{ padding: '8px 0', borderBottom: idx < transactions.length - 1 ? '1px solid #222' : 'none' }}>
                    <div className="flex items-center gap-10">
                      <Avatar user={fromUser} size="xs" />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#FFF' }}>{fromUser?.firstName || 'Member'} → {toUser?.firstName || 'Member'}</p>
                        <p className="text-secondary text-xs" style={{ margin: 0 }}>{fromUser?.name} paid {toUser?.name}</p>
                      </div>
                    </div>
                    <span className="fw-700 text-accent" style={{ color: '#A3E635' }}>{formatCurrency(tx.amount)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Member Confirmations */}
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ color: '#888' }}>{t('confirmPayment')} ({confirmationList.length})</label>
          <div className="card" style={{ padding: '0 16px', maxHeight: '140px', overflowY: 'auto', background: '#111' }}>
            {groupMembers.map((m) => {
              return (
                <div key={m.id} className="member-row" style={{ padding: '10px 0', borderBottom: '1px solid #222' }}>
                  <Avatar user={m} size="xs" />
                  <div className="member-info" style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0, color: '#FFF' }}>{m.name}</h4>
                  </div>
                  <span className="text-accent text-xs fw-600" style={{ color: '#A3E635' }}>✓ {t('confirmPayment')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historical Expenses in this cycle */}
        {cycleExpenses.length > 0 && (
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label style={{ color: '#888' }}>{t('expenses')} ({cycleExpenses.length})</label>
            <div className="card" style={{ padding: '0 16px', maxHeight: '160px', overflowY: 'auto', background: '#111' }}>
              {cycleExpenses.map((exp) => {
                const payer = getUserById(exp.paidBy);
                return (
                  <div key={exp.id} className="expense-row" style={{ padding: '10px 0' }}>
                    <div className="expense-icon" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>{exp.emoji}</div>
                    <div className="expense-info">
                      <h3 style={{ fontSize: '0.88rem', color: '#FFF' }}>{exp.title}</h3>
                      <p className="text-xs">{t('paidBy')} {payer?.firstName || 'Member'} · {formatDate(exp.date)}</p>
                    </div>
                    <div className="expense-amount">
                      <p className="amount" style={{ fontSize: '0.9rem' }}>{formatCurrency(exp.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button className="btn btn-secondary btn-full" onClick={onClose} id="close-settlement-modal-btn" style={{ background: '#262626', color: '#FFF', border: '1px solid #333' }}>
          {t('done')}
        </button>
      </div>
    </div>
  );
}
