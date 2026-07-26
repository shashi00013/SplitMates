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
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85dvh', paddingBottom: '40px' }}
    >
      {/* Success Hero */}
      <div className="text-center" style={{ marginBottom: '28px' }}>
        <div
          className="success-icon-wrapper"
          style={{ width: '80px', height: '80px', margin: '0 auto 20px auto', background: 'var(--accent-dim)', color: 'var(--accent)' }}
        >
          <Check size={40} strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Settlement complete 🎉
        </h1>
        <p className="text-secondary text-sm" style={{ lineHeight: 1.5 }}>
          Everyone is settled up for {groupName || 'this group'}.
        </p>
      </div>

      {/* Summary Card */}
      <div className="card card-glow page-section" style={{ padding: '20px', marginBottom: '28px' }} id="settlement-summary">
        <p className="text-secondary text-xs fw-700" style={{
          marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Settlement Summary
        </p>
        <div className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
          <span className="text-secondary text-sm">Total Settled</span>
          <span className="fw-800 text-accent" style={{ fontSize: '1.1rem' }}>{formatCurrency(totalSettled)}</span>
        </div>
        {memberCount > 0 && (
          <div className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span className="text-secondary text-sm">Members</span>
            <span className="fw-700 text-primary" style={{ fontSize: '0.9rem' }}>{memberCount} members</span>
          </div>
        )}
        <div className="flex justify-between items-center" style={{ padding: '8px 0' }}>
          <span className="text-secondary text-sm">Date</span>
          <span className="text-secondary text-xs">{formatDateTime(date)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-10">
        <button
          className="btn btn-primary btn-full"
          onClick={handleStartNewCycle}
          id="view-updated-balance-btn"
          style={{ minHeight: '48px', fontSize: '1rem', fontWeight: 800 }}
        >
          View Updated Balance
        </button>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/history')}
          id="view-history-btn"
          style={{ minHeight: '44px', fontSize: '0.9rem' }}
        >
          View History
        </button>
      </div>
    </div>
  );
}
