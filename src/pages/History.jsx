import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDate } from '../data/mockData';
import SettlementDetailsModal from '../components/SettlementDetailsModal';

export default function History() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { groups, getUserGroups, getSettlementHistory } = useApp();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [activeSettlement, setActiveSettlement] = useState(null);

  const userGroups = getUserGroups();
  const historyList = getSettlementHistory(selectedGroupFilter === 'all' ? null : selectedGroupFilter);

  return (
    <div className="page" id="history-page">
      {/* 1. Header (Minimal and clean) */}
      <div className="page-header flex items-center justify-between" style={{ paddingBottom: '12px' }}>
        <button className="btn-icon" onClick={() => navigate('/profile')} id="history-back-btn" aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('history')}
        </h1>
        <div style={{ width: '42px' }} />
      </div>

      {/* 2. Group Filter Segmented Control */}
      {userGroups.length > 0 && (
        <div
          className="flex gap-4"
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '20px',
            overflowX: 'auto',
          }}
          id="history-group-filters"
        >
          <button
            type="button"
            className={`text-xs fw-700`}
            onClick={() => setSelectedGroupFilter('all')}
            id="filter-group-all"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: selectedGroupFilter === 'all' ? 'var(--bg-card)' : 'transparent',
              color: selectedGroupFilter === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All Groups
          </button>
          {userGroups.map((g) => {
            const isSelected = selectedGroupFilter === g.id;
            return (
              <button
                key={g.id}
                type="button"
                className={`text-xs fw-700`}
                onClick={() => setSelectedGroupFilter(g.id)}
                id={`filter-group-${g.id}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isSelected ? 'var(--bg-card)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.icon || '🏠'} {g.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. History List */}
      {historyList.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 20px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📜</p>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            No settlement history yet
          </h3>
          <p className="text-secondary text-sm" style={{ maxWidth: '280px', margin: '0 auto' }}>
            When all members confirm payment, completed settlements will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-12" style={{ marginBottom: '24px' }}>
          {historyList.map((settle) => {
            const group = groups.find((g) => g.id === settle.groupId);
            const memberCount = group?.memberIds?.length || settle.memberCount || 0;
            const dateStr = settle.completedAt || settle.date;

            return (
              <div
                key={settle.id}
                className="card card-hover flex justify-between items-center"
                onClick={() => setActiveSettlement(settle)}
                style={{ padding: '16px 18px', cursor: 'pointer' }}
                id={`history-item-${settle.id}`}
              >
                <div className="flex items-center gap-12">
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--accent-dim)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    {group?.icon || '📜'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {group?.name || 'Group Settlement'}
                    </h3>
                    <p className="text-accent text-xs fw-600" style={{ margin: 0, marginTop: '2px' }}>
                      Settlement complete
                    </p>
                    <p className="text-secondary text-xs" style={{ margin: 0, marginTop: '2px' }}>
                      {memberCount > 0 ? `${memberCount} members · ` : ''}{formatDate(dateStr)}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p className="fw-800 text-accent" style={{ fontSize: '1.05rem', margin: 0 }}>
                    {formatCurrency(settle.totalSettled)}
                  </p>
                  <p className="text-secondary text-xs" style={{ margin: 0, marginTop: '2px' }}>
                    settled
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
