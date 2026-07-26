import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';

export default function Expenses() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, getAllExpensesForUser, groups, getUserById, isLoading } = useApp();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExpense, setActiveExpense] = useState(null);

  const allExpenses = getAllExpensesForUser();

  const filtered = allExpenses.filter((exp) => {
    if (filter === 'current' && exp.settled) return false;
    if (filter === 'historical' && !exp.settled) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const group = groups.find((g) => g.id === exp.groupId);
      const matchesTitle = exp.title?.toLowerCase().includes(q);
      const matchesGroup = group?.name?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesGroup) return false;
    }

    return true;
  });

  return (
    <div className="page" id="expenses-page">
      {/* 1. Header */}
      <div className="page-header flex items-center justify-between" style={{ paddingBottom: '12px' }}>
        <button className="btn-icon" onClick={() => navigate('/')} id="expenses-back-btn" aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('expenses')}
        </h1>
        <div style={{ width: '42px' }} />
      </div>

      {/* Search Input Bar */}
      <div className="input-group" style={{ marginBottom: '14px' }}>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            type="text"
            placeholder="Search expenses by title or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '0.85rem', background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)' }}
            id="expense-search-input"
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        </div>
      </div>

      {/* 2. Compact Segmented Filter Control */}
      <div
        className="flex gap-4"
        style={{
          background: 'var(--bg-card-alt)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '20px',
        }}
        id="expense-filters"
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'current', label: t('currentPeriod') },
          { key: 'historical', label: t('history') },
        ].map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              className={`flex-1 text-xs fw-700`}
              onClick={() => setFilter(f.key)}
              id={`expense-filter-${f.key}`}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* 3. Expense List (Single-tap clickable surfaces) */}
      {isLoading ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <p className="text-secondary text-sm">{t('loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</p>
          <p className="text-secondary text-sm" style={{ fontWeight: 600 }}>
            {filter === 'all'
              ? 'No expenses yet'
              : filter === 'current'
              ? 'No current expenses'
              : 'No expense history'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 16px', marginBottom: '24px' }}>
          {filtered.map((exp) => {
            const payer = getUserById(exp.paidBy);
            const group = groups.find((g) => g.id === exp.groupId);
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
                id={`expense-item-${exp.id}`}
                onClick={() => setActiveExpense(exp)}
                style={{ cursor: 'pointer' }}
              >
                <div className="expense-icon">{exp.emoji || '💰'}</div>
                <div className="expense-info">
                  <h3>{exp.title}</h3>
                  <p>{group?.name || 'Group'} · {t('paidBy')} {paidByLabel}</p>
                </div>
                <div className="expense-amount" style={{ textAlign: 'right' }}>
                  <p className="amount">{formatCurrency(exp.amount)}</p>
                  <p className={`date fw-600 ${impactClass}`} style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                    {impactText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ExpenseDetailsModal
        expense={activeExpense}
        onClose={() => setActiveExpense(null)}
      />
    </div>
  );
}
