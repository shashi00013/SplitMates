import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Bell,
  Edit3,
  History as HistoryIcon,
  Globe,
  X,
  Check,
  Camera,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/mockData';
import Avatar from '../components/Avatar';
import NotificationsModal from '../components/NotificationsModal';

const PRESET_CHARACTERS = ['🦊', '🐯', '🦁', '🐼', '🐱', '🐶', '🚀', '🦄', '⚡', '👑'];

export default function Profile() {
  const navigate = useNavigate();
  const {
    user,
    setUser,
    getUserGroups,
    getAllExpensesForUser,
    getSettlementHistory,
    getTotalBalances,
    logout,
    showToast,
    notifications,
    unreadCount,
    markNotificationRead,
  } = useApp();

  const { language, setLanguage, t, languages } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();

  const userGroups = getUserGroups();
  const totalExpenses = getAllExpensesForUser().length;
  const userSettlements = getSettlementHistory();
  const totalSettlements = userSettlements.length;
  const { totalOwed, totalOwe, totalBalance = 0 } = getTotalBalances();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Draft profile edit state
  const [draftName, setDraftName] = useState(user?.name || '');
  const [draftAvatar, setDraftAvatar] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  function handleOpenEditModal() {
    setDraftName(user?.name || '');
    setDraftAvatar(user?.avatar || null);
    setShowEditModal(true);
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size should be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDraftAvatar(event.target.result);
        showToast('Photo uploaded!');
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProfile() {
    if (!user) return;
    const updatedUser = {
      ...user,
      name: draftName.trim() || user.name,
      firstName: (draftName.trim() || user.name).split(' ')[0],
      avatar: draftAvatar,
    };
    setUser(updatedUser);
    setShowEditModal(false);
    showToast('Profile updated successfully!');
  }

  return (
    <div className="page" id="profile-page">
      <div className="page-header">
        <div className="spacer" />
        <h1>{t('profile')}</h1>
        <button
          className="btn-icon"
          id="edit-profile-btn"
          aria-label="Edit profile"
          onClick={handleOpenEditModal}
        >
          <Edit3 size={17} />
        </button>
      </div>

      {/* Profile Header */}
      <div className="profile-header" style={{ marginBottom: '24px', paddingTop: '8px' }}>
        <div
          style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
          onClick={handleOpenEditModal}
          id="profile-avatar-clickable"
        >
          <Avatar user={user} size="xl" />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--accent)',
              color: '#000',
              borderRadius: '50%',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '2px solid var(--bg-primary)',
            }}
          >
            <Camera size={14} />
          </div>
        </div>

        <div className="text-center" style={{ marginTop: '10px' }}>
          <h2 style={{ fontSize: '1.35rem', letterSpacing: '-0.01em', marginBottom: '4px', color: 'var(--text-primary)' }}>
            {user?.name}
          </h2>
          <p className="text-secondary text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Balance Summary Card */}
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

      {/* 4-Column Side-by-Side Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '24px',
        }}
        id="profile-4col-stats"
      >
        <div
          className="card"
          onClick={() => navigate('/groups')}
          style={{ cursor: 'pointer', padding: '12px 6px', textAlign: 'center' }}
          id="stat-card-groups"
        >
          <p className="text-accent fw-800" style={{ fontSize: '1.15rem', marginBottom: '2px' }}>
            {userGroups.length}
          </p>
          <p className="text-secondary text-xs fw-600" style={{ fontSize: '0.72rem' }}>
            Groups
          </p>
        </div>

        <div
          className="card"
          onClick={() => navigate('/expenses')}
          style={{ cursor: 'pointer', padding: '12px 6px', textAlign: 'center' }}
          id="stat-card-expenses"
        >
          <p className="text-accent fw-800" style={{ fontSize: '1.15rem', marginBottom: '2px' }}>
            {totalExpenses}
          </p>
          <p className="text-secondary text-xs fw-600" style={{ fontSize: '0.72rem' }}>
            Expenses
          </p>
        </div>

        <div
          className="card"
          onClick={() => navigate('/history')}
          style={{ cursor: 'pointer', padding: '12px 6px', textAlign: 'center' }}
          id="stat-card-settled"
        >
          <p className="text-accent fw-800" style={{ fontSize: '1.15rem', marginBottom: '2px' }}>
            {totalSettlements}
          </p>
          <p className="text-secondary text-xs fw-600" style={{ fontSize: '0.72rem' }}>
            Settled
          </p>
        </div>

        <div
          className="card"
          style={{ padding: '12px 6px', textAlign: 'center' }}
          id="stat-card-total"
        >
          <p
            className={totalBalance > 0 ? 'text-accent fw-800' : totalBalance < 0 ? 'text-negative fw-800' : 'text-secondary fw-800'}
            style={{ fontSize: '0.95rem', marginBottom: '2px', whiteSpace: 'nowrap' }}
          >
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-secondary text-xs fw-600" style={{ fontSize: '0.72rem' }}>
            Net Balance
          </p>
        </div>
      </div>

      {/* Real Functional Settings Menu List */}
      <div className="menu-list" style={{ marginBottom: '20px' }} id="profile-menu">
        <button className="menu-item" id="menu-language" onClick={() => setShowLanguageModal(true)}>
          <Globe size={20} style={{ color: 'var(--accent)' }} />
          <span className="menu-label">{t('language')}</span>
          <span className="text-secondary text-sm" style={{ fontWeight: 600, color: 'var(--accent)' }}>
            {languages.find((l) => l.code === language)?.nativeLabel}
          </span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-history" onClick={() => navigate('/history')}>
          <HistoryIcon size={20} />
          <span className="menu-label">{t('history')}</span>
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-notifications" onClick={() => setShowNotificationsModal(true)}>
          <Bell size={20} />
          <span className="menu-label">{t('notifications')}</span>
          {unreadCount > 0 && (
            <span className="text-xs fw-700" style={{ background: 'var(--negative)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '10px' }}>
              {unreadCount} new
            </span>
          )}
          <ChevronRight size={16} className="menu-chevron" />
        </button>

        <button className="menu-item" id="menu-theme" onClick={() => setShowThemeModal(true)}>
          {themeMode === 'light' ? <Sun size={20} style={{ color: 'var(--accent)' }} /> : themeMode === 'dark' ? <Moon size={20} style={{ color: 'var(--accent)' }} /> : <Monitor size={20} style={{ color: 'var(--accent)' }} />}
          <span className="menu-label">App Theme</span>
          <span className="text-secondary text-sm" style={{ fontWeight: 600, color: 'var(--accent)', textTransform: 'capitalize' }}>
            {themeMode === 'system' ? 'System' : `${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}`}
          </span>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', maxWidth: '380px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t('selectLanguage')}</h2>
              <button className="btn-icon" onClick={() => setShowLanguageModal(false)} style={{ color: 'var(--text-secondary)' }}>
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
                      background: isSelected ? 'var(--accent-dim)' : 'var(--bg-input)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      borderRadius: '12px',
                    }}
                    id={`lang-option-${lang.code}`}
                  >
                    <div className="flex flex-col text-left">
                      <strong style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontSize: '0.95rem' }}>{lang.nativeLabel}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lang.label}</span>
                    </div>
                    {isSelected && <Check size={18} style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeModal && (
        <div className="modal-overlay" onClick={() => setShowThemeModal(false)} id="theme-modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', maxWidth: '380px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Select App Theme</h2>
              <button className="btn-icon" onClick={() => setShowThemeModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-10">
              {[
                { code: 'light', label: 'Light Mode', sub: 'Bright, clean layout', icon: <Sun size={18} /> },
                { code: 'dark', label: 'Dark Mode', sub: 'Sleek, low-light theme', icon: <Moon size={18} /> },
                { code: 'system', label: 'System Default', sub: 'Matches your OS preference', icon: <Monitor size={18} /> },
              ].map((tOption) => {
                const isSelected = themeMode === tOption.code;
                return (
                  <button
                    key={tOption.code}
                    type="button"
                    className="card flex justify-between items-center"
                    onClick={() => {
                      setThemeMode(tOption.code);
                      setShowThemeModal(false);
                      showToast(`Theme set to ${tOption.label}`);
                    }}
                    style={{
                      padding: '14px 16px',
                      background: isSelected ? 'var(--accent-dim)' : 'var(--bg-input)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      borderRadius: '12px',
                    }}
                    id={`theme-option-${tOption.code}`}
                  >
                    <div className="flex items-center gap-12 text-left">
                      <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {tOption.icon}
                      </span>
                      <div className="flex flex-col text-left">
                        <strong style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontSize: '0.95rem' }}>{tOption.label}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tOption.sub}</span>
                      </div>
                    </div>
                    {isSelected && <Check size={18} style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Avatar Selection Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)} id="edit-profile-modal-overlay">
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '92%' }}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t('edit')} {t('profile')}</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
              id="avatar-file-input"
            />

            <div className="flex flex-col gap-16">
              {/* Current Avatar Preview & Upload Action */}
              <div className="flex flex-col items-center gap-10">
                <div style={{ position: 'relative' }}>
                  <Avatar user={{ ...user, avatar: draftAvatar }} size="xl" />
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '20px',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }}
                  id="upload-photo-btn"
                >
                  <Upload size={14} /> Upload Custom Photo
                </button>
              </div>

              {/* Character Avatar Presets Grid */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <p className="text-secondary text-xs fw-600" style={{ marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Or Choose a Character Avatar
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '10px',
                  }}
                >
                  {PRESET_CHARACTERS.map((char) => {
                    const isSelected = draftAvatar === char;
                    return (
                      <button
                        key={char}
                        type="button"
                        onClick={() => setDraftAvatar(char)}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          fontSize: '1.4rem',
                          background: isSelected ? 'var(--accent-dim)' : 'var(--bg-input)',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                        id={`avatar-char-${char}`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Field */}
              <div className="input-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Your Name</label>
                <input
                  className="input"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Enter your name"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                  id="edit-profile-name-input"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-10" style={{ marginTop: '4px' }}>
                {draftAvatar && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setDraftAvatar(null)}
                    style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)', borderColor: 'var(--border-light)' }}
                  >
                    Reset Initial
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  style={{ flex: 2, fontWeight: 700 }}
                  id="save-profile-btn"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Working Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={(id) => markNotificationRead(id)}
        onMarkAllRead={() => markNotificationRead('all')}
      />
    </div>
  );
}
