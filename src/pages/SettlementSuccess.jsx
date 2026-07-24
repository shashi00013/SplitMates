import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency, formatDateTime } from '../data/mockData';

export default function SettlementSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { startNewCycle } = useApp();
  const entry = location.state?.historyEntry;

  const totalSettled = entry?.totalSettled || 0;
  const memberCount = entry?.memberCount || 0;
  const date = entry?.date || new Date().toISOString();

  const groupName = location.state?.groupName;

  function handleStartNewCycle() {
    if (entry?.groupId) {
      startNewCycle(entry.groupId);
    }
    navigate('/');
  }

  return (
    <div
      className="page"
      id="settlement-success-page"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '90dvh', paddingBottom: '40px' }}
    >
      {/* Success Hero */}
      <div className="text-center" style={{ marginBottom: '32px' }}>
        <div
          className="success-icon-wrapper"
          style={{ width: '96px', height: '96px', marginBottom: '24px' }}
        >
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '10px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Settlement Complete! 🎉
        </h1>
        <p className="text-secondary" style={{ lineHeight: 1.6 }}>
          All balances cleared for {groupName || 'this group'}. New cycle started.
        </p>
      </div>

      {/* Summary Card */}
      <div className="summary-card card-glow" style={{ marginBottom: '32px' }} id="settlement-summary">
        <p className="text-secondary text-xs fw-600" style={{
          marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Settlement Summary
        </p>
        <div className="summary-row">
          <span className="label">Total Settled</span>
          <span className="value text-accent" style={{ fontWeight: 700 }}>{formatCurrency(totalSettled)}</span>
        </div>
        <div className="summary-row">
          <span className="label">{t('peopleInGroup')}</span>
          <span className="value">{memberCount}</span>
        </div>
        <div className="summary-row">
          <span className="label">Date</span>
          <span className="value" style={{ fontSize: '0.85rem' }}>{formatDateTime(date)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-10">
        <button
          className="btn btn-primary btn-full"
          onClick={handleStartNewCycle}
          id="view-updated-balance-btn"
        >
          View Updated Balance
        </button>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/history')}
          id="view-history-btn"
        >
          {t('history')}
        </button>
      </div>
    </div>
  );
}
