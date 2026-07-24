import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import MiniChart from '../components/MiniChart';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';

export default function Expenses() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, getAllExpensesForUser, groups, getUserById, isLoading, showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const [activeExpense, setActiveExpense] = useState(null);

  const allExpenses = getAllExpensesForUser();

  const now = new Date();
  const filtered = allExpenses.filter((exp) => {
    if (filter === 'all') return true;
    if (filter === 'current') return !exp.settled;
    if (filter === 'historical') return exp.settled;
    const d = new Date(exp.date);
    if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0);

  function cycleFilter() {
    const filters = ['all', 'current', 'historical', 'month'];
    const nextIdx = (filters.indexOf(filter) + 1) % filters.length;
    setFilter(filters[nextIdx]);
    showToast(`Filter: ${filters[nextIdx]}`);
  }

  return (
    <div className="page" id="expenses-page">
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate('/')} id="expenses-back-btn">
          <ChevronLeft size={20} />
        </button>
        <h1>{t('expenses')}</h1>
        <button className="btn-icon" id="expenses-filter-btn" onClick={cycleFilter}>
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '20px' }} id="expense-filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'current', label: t('currentPeriod') },
          { key: 'historical', label: t('history') },
          { key: 'month', label: 'This Month' },
        ].map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
            id={`expense-filter-${f.key}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Total Summary Card */}
      <div className="card card-glow" style={{ marginBottom: '20px', padding: '20px 22px' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary text-sm" style={{ marginBottom: '6px', fontWeight: 500 }}>Total Expenses</p>
            <p className="text-2xl" style={{ fontWeight: 800 }}>{formatCurrency(totalExpenses)}</p>
            <p className="text-secondary text-xs" style={{ marginTop: '6px' }}>
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <MiniChart bars={8} maxHeight={36} />
        </div>
      </div>

      {/* Expense List */}
      {isLoading ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <p className="text-secondary">{t('loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</p>
          <p className="text-secondary text-sm" style={{ marginBottom: '4px' }}>No expenses found</p>
          <p className="text-secondary text-xs">
            {filter === 'all'
              ? 'Add an expense to start tracking group balances.'
              : `No expenses matching "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 16px' }}>
          {filtered.map((exp) => {
            const payer = getUserById(exp.paidBy);
            const group = groups.find((g) => g.id === exp.groupId);
            const paidByLabel = exp.paidBy === user.id ? 'You' : payer?.firstName || 'Member';
            const participants = exp.participants || exp.splitAmong || [];
            const isPayer = exp.paidBy === user.id;
            const isParticipant = participants.includes(user.id);
            const userShare = exp.shares?.[user.id] || (isParticipant ? (exp.amount / (participants.length || 1)) : 0);
            const receivable = isPayer ? Math.max(0, exp.amount - userShare) : 0;
            const impactClass = isPayer ? 'text-accent' : userShare > 0 ? 'text-negative' : 'text-secondary';
            const impactText = isPayer ? `+${formatCurrency(receivable)}` : userShare > 0 ? `-${formatCurrency(userShare)}` : 'Not involved';

            return (
              <div
                key={exp.id}
                className="expense-row"
                id={`expense-item-${exp.id}`}
                onClick={() => setActiveExpense(exp)}
                style={{ cursor: 'pointer' }}
              >
                <div className="expense-icon">{exp.emoji}</div>
                <div className="expense-info">
                  <h3>{exp.title}</h3>
                  <p>{t('paidBy')} {paidByLabel}{group ? ` · ${group.name}` : ''}</p>
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
