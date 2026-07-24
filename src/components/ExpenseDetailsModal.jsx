import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import Avatar from './Avatar';

export default function ExpenseDetailsModal({ expense, onClose }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, deleteExpense, getGroupMembers, getUserById, showToast } = useApp();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!expense) return null;

  const payer = getUserById(expense.paidBy);
  const participants = expense.participants || expense.splitAmong || [];
  const members = getGroupMembers(expense.groupId);

  function handleEdit() {
    onClose();
    navigate('/add-expense', { state: { expenseId: expense.id } });
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} id="expense-details-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        id="expense-details-content"
        style={{ background: '#1A1A1A', borderRadius: '20px', padding: '24px' }}
      >
        <div className="modal-drag-handle" />

        {!showConfirmDelete ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>Expense Details</h2>
              <button className="btn-icon" onClick={onClose} id="close-details-btn" style={{ color: '#888' }}>
                <X size={18} />
              </button>
            </div>

            {/* Expense Hero */}
            <div style={{ display: 'flex', flexDirection: 'column', items: 'center', marginBottom: '20px', textAlign: 'center' }}>
              <div className="expense-hero-icon-large" style={{ fontSize: '3rem', margin: '0 auto 8px' }}>{expense.emoji}</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '8px', marginBottom: '4px', color: '#FFFFFF' }}>
                {expense.title}
              </h3>
              <p className="text-secondary text-xs fw-600" style={{ marginBottom: '4px' }}>{t('totalExpense')}</p>
              <p className="text-3xl text-accent fw-700" style={{ color: '#A3E635' }}>{formatCurrency(expense.amount)}</p>
              <div className="flex items-center justify-center gap-6 text-secondary text-xs" style={{ marginTop: '8px' }}>
                <Calendar size={14} />
                <span>{formatDate(expense.date)}</span>
              </div>
            </div>

            {/* User Financial Impact Summary Card */}
            {(() => {
              const isPayer = expense.paidBy === user?.id;
              const isParticipant = participants.includes(user?.id);
              const userShare = expense.shares?.[user?.id] || (isParticipant ? (expense.amount / (participants.length || 1)) : 0);
              const receivableAmount = isPayer ? Math.max(0, expense.amount - userShare) : 0;
              return (
                <div
                  style={{
                    background: isPayer ? 'rgba(163, 230, 53, 0.10)' : userShare > 0 ? 'rgba(255, 59, 48, 0.10)' : '#111',
                    border: isPayer ? '1px solid #A3E635' : userShare > 0 ? '1px solid #FF3B30' : '1px solid #333',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                  }}
                  id="expense-impact-banner"
                >
                  <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                    <span className="text-secondary text-xs fw-600">{t('yourShare')}</span>
                    <span className="fw-700 text-sm" style={{ color: '#FFF' }}>{formatCurrency(userShare)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-xs fw-600">Balance Impact</span>
                    <span className={`fw-800 text-sm ${isPayer ? 'text-accent' : userShare > 0 ? 'text-negative' : 'text-secondary'}`}>
                      {isPayer
                        ? `${t('youGet')} ${formatCurrency(receivableAmount)}`
                        : userShare > 0
                        ? `${t('youPay')} ${formatCurrency(userShare)}`
                        : 'Not involved'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Payer Card */}
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888' }}>{t('paidBy')}</label>
              <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#111' }}>
                <Avatar user={payer} size="sm" />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: '#FFF' }}>
                    {expense.paidBy === user?.id ? 'You' : payer?.name || payer?.firstName || 'Unknown'}
                  </h4>
                  <p className="text-secondary text-xs" style={{ marginTop: '2px' }}>
                    Paid total {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="input-group" style={{ marginBottom: '28px' }}>
              <label style={{ color: '#888' }}>{t('splitWith')} ({participants.length} {t('peopleInGroup')})</label>
              <div className="card" style={{ padding: '0 16px', maxHeight: '180px', overflowY: 'auto', background: '#111' }}>
                {participants.map((pid) => {
                  const m = members.find((u) => u.id === pid) || getUserById(pid);
                  const share = expense.shares?.[pid] || (expense.amount / participants.length);
                  return (
                    <div key={pid} className="member-row" style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>
                      <Avatar user={m} size="sm" />
                      <div className="member-info" style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 500, color: '#FFF' }}>
                          {pid === user?.id ? 'You' : m?.name || m?.firstName || 'Member'}
                        </h4>
                      </div>
                      <p className="fw-600 text-sm" style={{ color: '#A3E635' }}>{formatCurrency(share)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-12" style={{ marginTop: 'auto' }}>
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setShowConfirmDelete(true)}
                id="delete-expense-action"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#FF3B30', background: '#262626', border: '1px solid #333' }}
              >
                <Trash2 size={16} /> {t('delete')}
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={handleEdit}
                id="edit-expense-action"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#A3E635', color: '#000', fontWeight: 700 }}
              >
                <Edit3 size={16} /> {t('edit')}
              </button>
            </div>
          </>
        ) : (
          /* Confirm Delete View */
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#FF3B30',
              }}
            >
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px', color: '#FFF' }}>{t('delete')} Expense?</h2>
            <p className="text-secondary text-sm" style={{ lineHeight: 1.5, maxWidth: '280px', margin: '0 auto 24px' }}>
              Are you sure you want to delete <strong>"{expense.title}"</strong> of{' '}
              <strong style={{ color: '#A3E635' }}>{formatCurrency(expense.amount)}</strong>? This action cannot be undone.
            </p>

            <div className="flex flex-col gap-10">
              <button
                className="btn btn-danger btn-full"
                onClick={handleDelete}
                id="confirm-delete-btn"
                disabled={isDeleting}
                style={{ opacity: isDeleting ? 0.55 : 1, background: '#FF3B30', color: '#FFF', fontWeight: 700 }}
              >
                {isDeleting ? t('loading') : t('delete')}
              </button>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowConfirmDelete(false)}
                id="cancel-delete-btn"
                style={{ background: '#262626', color: '#FFF', border: '1px solid #333' }}
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
