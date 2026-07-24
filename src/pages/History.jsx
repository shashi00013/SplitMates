import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, History as HistoryIcon, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import SettlementDetailsModal from '../components/SettlementDetailsModal';

export default function History() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { groups, getUserGroups, getSettlementHistory, cycles } = useApp();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [activeSettlement, setActiveSettlement] = useState(null);

  const userGroups = getUserGroups();
  const historyList = getSettlementHistory(selectedGroupFilter === 'all' ? null : selectedGroupFilter);

  const totalSettledOverall = historyList.reduce((sum, h) => sum + (h.totalSettled || 0), 0);

  return (
    <div className="page" id="history-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate('/profile')} id="history-back-btn">
          <ChevronLeft size={20} />
        </button>
        <h1>{t('history')}</h1>
        <div className="spacer" />
      </div>

      {/* Group Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '20px' }} id="history-group-filters">
        <button
          className={`filter-tab ${selectedGroupFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedGroupFilter('all')}
          id="filter-group-all"
        >
          All Groups
        </button>
        {userGroups.map((g) => (
          <button
            key={g.id}
            className={`filter-tab ${selectedGroupFilter === g.id ? 'active' : ''}`}
            onClick={() => setSelectedGroupFilter(g.id)}
            id={`filter-group-${g.id}`}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>

      {/* Overview Card */}
      <div className="card card-glow" style={{ marginBottom: '24px', padding: '20px' }} id="history-overview">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historical Settled Total
            </p>
            <p className="text-accent fw-700 text-3xl" style={{ marginTop: '4px' }}>
              {formatCurrency(totalSettledOverall)}
            </p>
          </div>
          <div className="flex items-center gap-8 text-secondary text-sm">
            <Layers size={18} />
            <span>{historyList.length} Period{historyList.length !== 1 ? 's' : ''} {t('allSettled')}</span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="section-header">
        <h2>{t('allSettled')} ({historyList.length})</h2>
      </div>

      {historyList.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <HistoryIcon size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p className="fw-600" style={{ marginBottom: '4px' }}>No completed settlements</p>
          <p className="text-secondary text-xs">
            When all members confirm payment, the record will appear here.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 16px', marginBottom: '24px' }}>
          {historyList.map((settle) => {
            const group = groups.find((g) => g.id === settle.groupId);
            const cycle = cycles?.find((c) => c.id === settle.cycleId || c.settlementId === settle.id);
            const txCount = settle.transactions?.length || 0;
            const dateStr = settle.completedAt || settle.date;

            return (
              <div
                key={settle.id}
                className="expense-row"
                onClick={() => setActiveSettlement(settle)}
                style={{ cursor: 'pointer' }}
                id={`history-item-${settle.id}`}
              >
                <div className="expense-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {group?.icon || '📜'}
                </div>
                <div className="expense-info">
                  <h3>{group?.name || 'Group Settlement'}</h3>
                  <p className="text-xs">
                    {formatDate(dateStr)} · {txCount} payment{txCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="expense-amount">
                  <p className="amount text-accent" style={{ fontWeight: 700 }}>
                    {formatCurrency(settle.totalSettled)}
                  </p>
                  <p className="date text-secondary" style={{ fontSize: '0.75rem' }}>
                    {cycle ? `Period #${cycle.id.slice(-3)}` : t('allSettled')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <SettlementDetailsModal
        settlement={activeSettlement}
        onClose={() => setActiveSettlement(null)}
      />
    </div>
  );
}
