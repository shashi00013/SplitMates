import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Settings, HelpCircle, LogOut, Moon, Bell, Shield, Edit3, History as HistoryIcon, Globe, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import Avatar from '../components/Avatar';

export default function Profile() {
  const navigate = useNavigate();
  const { user, getUserGroups, getAllExpensesForUser, getSettlementHistory, getTotalBalances, logout, showToast } = useApp();
  const { language, setLanguage, t, languages } = useLanguage();

  const userGroups = getUserGroups();
  const totalExpenses = getAllExpensesForUser().length;
  const userSettlements = getSettlementHistory();
  const totalSettlements = userSettlements.length;
  const { totalOwed, totalOwe } = getTotalBalances();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState(null); // 'notifications' | 'privacy' | 'help' | 'settings'

  return (
    <div className="page" id="profile-page">
      <div className="page-header">
        <div className="spacer" />
        <h1>{t('profile')}</h1>
        <button
          className="btn-icon"
          id="edit-profile-btn"
          aria-label="Edit profile"
          onClick={() => setShowEditModal(true)}
        >
          <Edit3 size={17} />
        </button>
      </div>

      {/* Profile Header */}
      <div className="profile-header" style={{ marginBottom: '24px', paddingTop: '8px' }}>
        <Avatar user={user} size="xl" />
        <div className="text-center">
          <h2 style={{ fontSize: '1.35rem', letterSpacing: '-0.01em', marginBottom: '4px', color: '#FFFFFF' }}>
            {user?.name}
          </h2>
          <p className="text-secondary text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Balance Summary Card with Simple Wording */}
      <div className="card card-glow" style={{ marginBottom: '20px', padding: '18px 20px' }}>
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-accent fw-700" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
              {formatCurrency(totalOwed)}
            </p>
            <p className="text-secondary text-xs" style={{ marginTop: '4px', fontWeight: 600 }}>
              {t('youGet')}
            </p>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-color)' }} />
          <div className="text-center flex-1">
            <p className="text-negative fw-700" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
              {formatCurrency(totalOwe)}
            </p>
            <p className="text-secondary text-xs" style={{ marginTop: '4px', fontWeight: 600 }}>
              {t('youPay')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats" style={{ marginBottom: '24px' }} id="profile-stats">
        <div className="stat-card" onClick={() => navigate('/groups')} style={{ cursor: 'pointer' }}>
          <p className="stat-value">{userGroups.length}</p>
          <p className="stat-label">{t('groups')}</p>
        </div>
        <div className="stat-card" onClick={() => navigate('/expenses')} style={{ cursor: 'pointer' }}>
          <p className="stat-value">{totalExpenses}</p>
          <p className="stat-label">{t('expenses')}</p>
        </div>
        <div className="stat-card" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }} id="stat-settled">
          <p className="stat-value">{totalSettlements}</p>
          <p className="stat-label">{t('allSettled')}</p>
        </div>
      </div>

      {/* Settings Menu List */}
      <div className="menu-list" style={{ marginBottom: '20px' }} id="profile-menu">
        <button className="menu-item" id="menu-language" onClick={() => setShowLanguageModal(true)}>
          <Globe size={20} style={{ color: '#A3E635' }} />
          <span className="menu-label">{t('language')}</span>
          <span className="text-secondary text-sm" style={{ fontWeight: 600, color: '#A3E635' }}>
            {languages.find((l) => l.code === language)?.nativeLabel}
          </span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-history" onClick={() => navigate('/history')}>
          <HistoryIcon size={20} />
          <span className="menu-label">{t('history')}</span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-notifications" onClick={() => setActiveInfoModal('notifications')}>
          <Bell size={20} />
          <span className="menu-label">{t('notifications')}</span>
          <span className="text-secondary text-xs" style={{ background: 'rgba(163, 230, 53, 0.15)', color: '#A3E635', padding: '2px 8px', borderRadius: '10px' }}>Active</span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-darkmode" onClick={() => showToast('Dark Mode is enabled by default')}>
          <Moon size={20} />
          <span className="menu-label">{t('darkMode')}</span>
          <span className="text-secondary text-sm">On</span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-privacy" onClick={() => setActiveInfoModal('privacy')}>
          <Shield size={20} />
          <span className="menu-label">{t('privacy')}</span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-settings" onClick={() => setActiveInfoModal('settings')}>
          <Settings size={20} />
          <span className="menu-label">{t('settings')}</span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-help" onClick={() => setActiveInfoModal('help')}>
          <HelpCircle size={20} />
          <span className="menu-label">{t('helpSupport')}</span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>
      </div>

      {/* Logout */}
      <button
        className="btn btn-danger-text btn-full"
        id="logout-btn"
        onClick={logout}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}
      >
        <LogOut size={17} /> {t('logOut')}
      </button>

      {/* Language Selector Modal */}
      {showLanguageModal && (
        <div className="modal-overlay" onClick={() => setShowLanguageModal(false)} id="language-modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#1A1A1A', borderRadius: '20px', padding: '24px', maxWidth: '380px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>{t('selectLanguage')}</h2>
              <button className="btn-icon" onClick={() => setShowLanguageModal(false)} style={{ color: '#888' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-10">
              {languages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className="card flex justify-between items-center"
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageModal(false);
                      showToast(`Language set to ${lang.label}`);
                    }}
                    style={{
                      padding: '14px 16px',
                      background: isSelected ? 'rgba(163, 230, 53, 0.12)' : '#111111',
                      border: isSelected ? '1px solid #A3E635' : '1px solid #333333',
                      cursor: 'pointer',
                      borderRadius: '12px',
                    }}
                    id={`lang-option-${lang.code}`}
                  >
                    <div className="flex flex-col text-left">
                      <strong style={{ color: isSelected ? '#A3E635' : '#FFFFFF', fontSize: '0.95rem' }}>{lang.nativeLabel}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#888888' }}>{lang.label}</span>
                    </div>
                    {isSelected && <Check size={18} style={{ color: '#A3E635' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Info Modals for Settings, Privacy, Notifications, Help */}
      {activeInfoModal && (
        <div className="modal-overlay" onClick={() => setActiveInfoModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#1A1A1A', borderRadius: '20px', padding: '24px', maxWidth: '380px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                {activeInfoModal === 'notifications' && t('notifications')}
                {activeInfoModal === 'privacy' && t('privacy')}
                {activeInfoModal === 'settings' && t('settings')}
                {activeInfoModal === 'help' && t('helpSupport')}
              </h2>
              <button className="btn-icon" onClick={() => setActiveInfoModal(null)} style={{ color: '#888' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888888', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              {activeInfoModal === 'notifications' && 'In-app notifications and SMS updates are active for instant expense tracking.'}
              {activeInfoModal === 'privacy' && 'SplitMates uses encrypted tokens and integer-cent calculations to keep your expense data private and secure.'}
              {activeInfoModal === 'settings' && `Logged in as ${user?.email}. App version v1.2.0 (Production Ready).`}
              {activeInfoModal === 'help' && 'Need assistance? Tap below to email support or visit splitmates.app/help.'}
            </p>
            <button className="btn btn-primary btn-full" onClick={() => setActiveInfoModal(null)} style={{ background: '#A3E635', color: '#000', fontWeight: 700 }}>
              {t('done')}
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#1A1A1A', borderRadius: '20px', padding: '24px', maxWidth: '380px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>{t('edit')} {t('profile')}</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)} style={{ color: '#888' }}>
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-12">
              <div className="input-group">
                <label style={{ color: '#888' }}>Name</label>
                <input className="input" defaultValue={user?.name} readOnly />
              </div>
              <div className="input-group">
                <label style={{ color: '#888' }}>Email</label>
                <input className="input" defaultValue={user?.email} readOnly />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888' }}>Profile details are synced with your authenticated account.</p>
              <button className="btn btn-primary btn-full" onClick={() => setShowEditModal(false)} style={{ background: '#A3E635', color: '#000', fontWeight: 700 }}>
                {t('done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
