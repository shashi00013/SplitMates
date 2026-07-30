import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';

export default function Expenses() {
  const navigate = useNavigate();
  const { t, formatYouGet, formatYouPay } = useLanguage();
  const { user, getAllExpensesForUser, groups, getUserById, getTotalBalances, isLoading } = useApp();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExpense, setActiveExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // Collapsed by default (Progressive Disclosure)

  const allExpenses = getAllExpensesForUser();
  const { totalBalance } = getTotalBalances();

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
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="page-header flex items-center justify-between" style={{ paddingBottom: '12px' }}>
        <button className="btn-icon" onClick={() => navigate('/')} id="expenses-back-btn" aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('expenses')}
        </h1>
        <div style={{ width: '42px' }} />
      </div>

      {/* ── DEFAULT VIEW: Simple Balance Banner ─────────────────────────── */}
      <div className="card card-glow page-section" style={{ padding: '16px 20px', marginBottom: '16px' }} id="expenses-summary-banner">
        <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          {t('netBalance')}
        </p>
        {totalBalance > 0 ? (
          <p className="text-accent fw-800" style={{ fontSize: '1.1rem', margin: 0 }}>
            {formatYouGet(formatCurrency(Math.abs(totalBalance)))}
          </p>
        ) : totalBalance < 0 ? (
          <p className="text-negative fw-800" style={{ fontSize: '1.1rem', margin: 0 }}>
            {formatYouPay(formatCurrency(Math.abs(totalBalance)))}
          </p>
        ) : (
          <p className="text-positive fw-800" style={{ fontSize: '1.1rem', margin: 0 }}>
            {t('allSettledUp')}
          </p>
        )}
      </div>

      {/* ── MORE OPTIONS: Filters & Search (Collapsed by Default) ────────── */}
      <div className="page-section" style={{ marginBottom: '16px' }} id="expense-filters-section">
        <button
          type="button"
          className="btn btn-secondary btn-full flex items-center justify-between"
          onClick={() => setShowFilters((prev) => !prev)}
          id="toggle-expense-filters-btn"
          style={{ padding: '10px 16px', fontSize: '0.82rem', fontWeight: 700 }}
        >
          <div className="flex items-center gap-8">
            <SlidersHorizontal size={16} style={{ color: 'var(--accent)' }} />
            <span>{t('searchAndFilters')}</span>
          </div>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFilters && (
          <div className="flex flex-col gap-12" style={{ marginTop: '12px' }}>
            {/* Search Bar */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type="text"
                  placeholder="Find a bill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px', fontSize: '0.85rem', background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)' }}
                  id="expense-search-input"
                />
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
            </div>

            {/* Filter Tabs */}
            <div
              className="flex gap-4"
              style={{
                background: 'var(--bg-card-alt)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
              }}
              id="expense-filters"
            >
              {[
                { key: 'all', label: 'All bills' },
                { key: 'current', label: 'This month' },
                { key: 'historical', label: 'Old bills' },
              ].map((f) => {
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className="flex-1 text-xs fw-700"
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
          </div>
        )}
      </div>

      {/* ── DEFAULT VIEW: Recent Bills List ────────────────────────────── */}
      {isLoading ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <p className="text-secondary text-sm">{t('loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</p>
          <p className="text-secondary text-sm" style={{ fontWeight: 600 }}>
            {filter === 'all'
              ? 'No bills yet'
              : filter === 'current'
              ? 'No bills this month'
              : 'No old bills'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 16px', marginBottom: '24px' }}>
          {filtered.map((exp) => {
            const payer = getUserById(exp.paidBy);
            const group = groups.find((g) => g.id === exp.groupId);
            const paidByLabel = exp.paidBy === user?.id ? 'You' : payer?.firstName || 'Dost';
            const participants = exp.participants || exp.splitAmong || [];
            const isPayer = exp.paidBy === user?.id;
            const isParticipant = participants.includes(user?.id);
            const userShare = exp.shares?.[user?.id] || (isParticipant ? (exp.amount / (participants.length || 1)) : 0);
            const receivable = isPayer ? Math.max(0, exp.amount - userShare) : 0;
            const impactClass = isPayer ? (receivable > 0 ? 'text-accent' : 'text-secondary') : userShare > 0 ? 'text-negative' : 'text-secondary';
            const impactText = isPayer
              ? (receivable > 0 ? `Tumhe ${formatCurrency(receivable)} milne hain` : 'Sab cleared hai 🎉')
              : (userShare > 0 ? `Tumhe ${formatCurrency(userShare)} dene hain` : 'Not involved');

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
                  <p>{group?.name || 'Group'} · {paidByLabel} ne diya</p>
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
