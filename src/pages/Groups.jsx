import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, AlertCircle, Plus, Link2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';

export default function Groups() {
  const { user, getUserGroups, getBalancesForGroup, isLoadingGroups, groupsError, refreshGroups, selectGroup } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const userGroups = getUserGroups();

  function handleSelectGroup(groupId) {
    selectGroup(groupId);
    navigate(`/group/${groupId}`);
  }

  return (
    <div className="page" id="groups-page">
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate('/')} id="groups-back-btn">
          <ChevronLeft size={20} />
        </button>
        <h1>{t('myGroups')}</h1>
        <div className="flex items-center gap-8">
          <button
            className="btn btn-primary btn-sm flex items-center gap-4"
            onClick={() => setShowCreateModal(true)}
            id="open-create-group-btn"
          >
            <Plus size={16} /> {t('createGroup')}
          </button>
        </div>
      </div>

      {/* Secondary Join Action */}
      <div className="flex justify-between items-center" style={{ marginBottom: '16px', padding: '0 4px' }}>
        <span className="text-xs text-secondary">{userGroups.length} {userGroups.length === 1 ? 'group' : 'groups'}</span>
        <button
          className="text-xs text-accent flex items-center gap-4"
          onClick={() => setShowJoinModal(true)}
          id="open-join-group-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          <Link2 size={14} /> {t('joinAGroup')}
        </button>
      </div>

      {/* Loading State */}
      {isLoadingGroups && (
        <div className="card text-center" style={{ padding: '30px 20px', marginBottom: '16px' }}>
          <p className="text-secondary text-sm">{t('loading')}</p>
        </div>
      )}

      {/* Error State */}
      {groupsError && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', border: '1px solid var(--negative)', background: 'rgba(255, 59, 48, 0.08)' }}>
          <div className="flex items-center gap-10 text-negative" style={{ marginBottom: '8px' }}>
            <AlertCircle size={18} />
            <span className="fw-600 text-sm">Failed to load groups</span>
          </div>
          <p className="text-secondary text-xs" style={{ marginBottom: '12px' }}>{groupsError}</p>
          <button className="btn btn-secondary btn-full text-xs" onClick={refreshGroups}>
            Try Again
          </button>
        </div>
      )}

      {/* Groups List */}
      <div className="flex flex-col gap-10">
        {!isLoadingGroups && userGroups.map((group) => {
          const balances = getBalancesForGroup(group.id);
          const myBalance = user ? (balances[user.id] || 0) : 0;
          const statusClass = myBalance > 0 ? 'text-accent' : myBalance < 0 ? 'text-negative' : 'text-secondary';
          const labelText = myBalance > 0 ? t('youGet') : myBalance < 0 ? t('youPay') : t('allSettled');
          const displayAmount = myBalance === 0 ? '₹0.00' : formatCurrency(Math.abs(myBalance));

          return (
            <div
              key={group.id}
              className="group-card"
              onClick={() => handleSelectGroup(group.id)}
              id={`group-link-${group.id}`}
              style={{ cursor: 'pointer' }}
            >
              <div className="group-card-icon">{group.icon || '🏠'}</div>
              <div className="group-card-info">
                <h3>{group.name}</h3>
                <p>
                  {group.memberIds.length} {t('peopleInGroup')}
                  {group.description ? ` · ${group.description}` : ''}
                </p>
              </div>
              <div className="group-card-balance">
                <p className={`balance-label ${statusClass}`}>
                  {labelText}
                </p>
                <p className={`balance-amount ${statusClass}`}>
                  {displayAmount}
                </p>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {!isLoadingGroups && userGroups.length === 0 && (
          <div className="card text-center" style={{ padding: '40px 20px' }}>
            <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🏘️</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>No Groups Found</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '20px' }}>
              You aren't a member of any active groups yet.
            </p>
            <div className="flex gap-10">
              <button
                className="btn btn-primary flex-1"
                onClick={() => setShowCreateModal(true)}
                id="empty-create-group-btn"
              >
                {t('createGroup')}
              </button>
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setShowJoinModal(true)}
                id="empty-join-group-btn"
              >
                {t('joinAGroup')}
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinGroupModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </div>
  );
}
