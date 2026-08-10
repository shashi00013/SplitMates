import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import Avatar from './Avatar';

export default function ExpenseDetailsModal({ expense, onClose }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, deleteExpense, getGroupMembers, getUserById, groups, showToast } = useApp();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && expense) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expense, onClose]);

  if (!expense) return null;

  const payer = getUserById(expense.paidBy);
  const participants = expense.participants || expense.splitAmong || [];
  const members = getGroupMembers(expense.groupId);
  const group = groups.find((g) => g.id === expense.groupId);

  function handleEdit() {
    onClose();
    navigate('/add-expense', { state: { expenseId: expense.id } });
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      showToast('Bill deleted');
      onClose();
    } catch (err) {
      showToast(err.message || "Couldn't delete this bill. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isPayer = expense.paidBy === user?.id;
  const isParticipant = participants.includes(user?.id);
  const userShare = expense.shares?.[user?.id] || (isParticipant ? (expense.amount / (participants.length || 1)) : 0);
  const receivableAmount = isPayer ? Math.max(0, expense.amount - userShare) : 0;
  const impactClass = isPayer ? (receivableAmount > 0 ? 'text-accent' : 'text-secondary') : userShare > 0 ? 'text-negative' : 'text-secondary';
  const impactText = isPayer
    ? (receivableAmount > 0 ? `You get ${formatCurrency(receivableAmount)}` : 'All clear 🎉')
    : (userShare > 0 ? `You need to pay ${payer?.firstName || 'person'} ${formatCurrency(userShare)}` : 'Not involved');

  return (
    <div className="modal-overlay" onClick={onClose} id="expense-details-overlay">
      <div
        className="modal-content flex flex-col gap-16"
        onClick={(e) => e.stopPropagation()}
        id="expense-details-content"
        style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', maxWidth: '400px' }}
      >
        {!showConfirmDelete ? (
          <>
            {/* Header & Close */}
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Bill Details
              </h2>
              <button className="btn-icon" onClick={onClose} id="close-details-btn" aria-label="Close details">
                <X size={18} />
              </button>
            </div>

            {/* Emoji & Title Header */}
            <div className="flex flex-col items-center text-center" style={{ padding: '8px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{expense.emoji || '💰'}</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {expense.title}
              </h3>
              <p className="text-secondary text-xs fw-600" style={{ marginTop: '4px' }}>
                {group?.name || 'Group'} · {formatDate(expense.date)}
              </p>
            </div>

            {/* Total Expense Hero Card */}
            <div className="card text-center" style={{ padding: '16px', background: 'var(--bg-card-alt)' }}>
              <span className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                TOTAL BILL
              </span>
              <p className="financial-hero-amount" style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
                {formatCurrency(expense.amount)}
              </p>
            </div>

            {/* Financial Impact Banner */}
            <div
              className="card"
              style={{
                padding: '14px 16px',
                background: isPayer ? 'var(--accent-dim)' : userShare > 0 ? 'rgba(255, 71, 87, 0.10)' : 'var(--bg-input)',
                border: isPayer ? '1px solid var(--accent)' : userShare > 0 ? '1px solid var(--negative)' : '1px solid var(--border-color)',
              }}
              id="expense-impact-banner"
            >
              <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                <span className="text-secondary text-xs fw-600">Your part</span>
                <span className="fw-700 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(userShare)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary text-xs fw-600">Status</span>
                <span className={`fw-800 text-sm ${impactClass}`}>
                  {impactText}
                </span>
              </div>
            </div>

            {/* Paid By */}
            <div className="input-group">
              <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Paid by
              </label>
              <div className="flex items-center gap-10" style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <Avatar user={payer} size="sm" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {expense.paidBy === user?.id ? 'You' : payer?.firstName || payer?.name || 'Person'}
                </span>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="input-group">
              <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Part of this bill ({participants.length})
              </label>
              <div className="card" style={{ padding: '0 14px', maxHeight: '160px', overflowY: 'auto' }}>
                {participants.map((pid) => {
                  const m = members.find((u) => u.id === pid) || getUserById(pid);
                  const share = expense.shares?.[pid] || (expense.amount / (participants.length || 1));
                  const isMe = pid === user?.id;

                  return (
                    <div key={pid} className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-8">
                        <Avatar user={m} size="sm" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {isMe ? 'You' : m?.firstName || m?.name || 'Person'}
                        </span>
                      </div>
                      <span className="fw-700 text-xs text-accent">
                        {formatCurrency(share)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contextual Actions (Edit / Delete) */}
            <div className="flex gap-10" style={{ marginTop: '4px' }}>
              <button
                className="btn btn-secondary flex-1 text-xs"
                onClick={() => setShowConfirmDelete(true)}
                id="delete-expense-action"
                style={{ color: 'var(--negative)' }}
              >
                <Trash2 size={14} /> {t('delete')}
              </button>
              <button
                className="btn btn-primary flex-1 text-xs fw-700"
                onClick={handleEdit}
                id="edit-expense-action"
              >
                <Edit3 size={14} /> {t('edit')}
              </button>
            </div>
          </>
        ) : (
          /* Confirm Delete View */
          <div className="text-center" style={{ padding: '12px 0' }}>
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
              <ShieldAlert size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Delete Bill?
            </h3>
            <p className="text-secondary text-sm" style={{ lineHeight: 1.5, marginBottom: '8px' }}>
              Are you sure you want to delete <strong>"{expense.title}"</strong> of{' '}
              <strong className="text-accent">{formatCurrency(expense.amount)}</strong>?
            </p>
            {/* Loss Aversion: Show specific consequences */}
            <p className="text-negative text-xs fw-600" style={{ lineHeight: 1.4, marginBottom: '20px' }}>
              {t('deleteExpenseWarning')} {participants.length > 1 ? `(${participants.length} people affected)` : ''}
            </p>

            <div className="flex flex-col gap-10">
              <button
                className="btn btn-primary btn-full"
                onClick={handleDelete}
                id="confirm-delete-btn"
                disabled={isDeleting}
                style={{ background: 'var(--negative)', borderColor: 'var(--negative)', minHeight: '44px', fontWeight: 700 }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Bill'}
              </button>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowConfirmDelete(false)}
                id="cancel-delete-btn"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
