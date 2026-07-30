import { useState } from 'react';
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
  Sparkles,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/mockData';
import { authApi } from '../services/apiService';
import { getAvatarById } from '../data/avatars';
import Avatar from '../components/Avatar';
import NotificationsModal from '../components/NotificationsModal';
import AvatarPickerModal from '../components/AvatarPickerModal';

export default function Profile() {
  const navigate = useNavigate();
  const {
    user,
    setUser,
    getTotalBalances,
    logout,
    showToast,
    notifications,
    unreadCount,
    markNotificationRead,
  } = useApp();

  const { language, setLanguage, t, languages } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();

  const { totalBalance = 0 } = getTotalBalances();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Draft profile edit state
  const [draftName, setDraftName] = useState(user?.name || '');

  const currentAvatarInfo = getAvatarById(user?.avatarId || user?.avatar || 'avatar_01');

  function handleOpenEditModal() {
    setDraftName(user?.name || '');
    setShowEditModal(true);
  }

  async function handleSelectAvatar(newAvatarId) {
    if (!user) return;
    const updatedUser = {
      ...user,
      avatar: newAvatarId,
      avatarId: newAvatarId,
    };
    setUser(updatedUser);
    showToast('Avatar updated!');
    try {
      await authApi.updateProfile({ avatarId: newAvatarId, avatar: newAvatarId });
    } catch (err) {
      // handled offline
    }
  }

  async function handleSaveProfile() {
    if (!user) return;
    const newName = draftName.trim() || user.name;
    const updatedUser = {
      ...user,
      name: newName,
      firstName: newName.split(' ')[0],
    };
    setUser(updatedUser);
    setShowEditModal(false);
    showToast('Profile updated!');
    try {
      await authApi.updateProfile({ name: newName });
    } catch (err) {
      // handled offline
    }
  }

  return (
    <div className="page" id="profile-page">
      {/* 1. Header (Minimal) */}
      <div className="page-header flex items-center justify-between" style={{ paddingBottom: '12px' }}>
        <div style={{ width: '42px' }} />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('profile')}
        </h1>
        <button
          className="btn-icon"
          id="edit-profile-btn"
          aria-label="Edit profile"
          onClick={handleOpenEditModal}
        >
          <Edit3 size={17} />
        </button>
      </div>

      {/* 2. User Identity Header */}
      <div className="flex flex-col items-center text-center page-section" style={{ paddingTop: '8px' }}>
        <div
          style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
          onClick={() => setShowAvatarModal(true)}
          id="profile-avatar-clickable"
        >
          <Avatar user={user} size="xl" />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.01em', marginTop: '12px', marginBottom: '2px', color: 'var(--text-primary)' }}>
          {user?.name}
        </h2>
        <p className="text-secondary text-xs" style={{ marginBottom: '10px' }}>{user?.email}</p>

        <button
          type="button"
          className="btn btn-secondary btn-sm flex items-center gap-6"
          onClick={() => setShowAvatarModal(true)}
          id="change-avatar-btn"
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, borderColor: 'var(--accent)', color: 'var(--accent)' }}
        >
          <Sparkles size={14} /> [ Change Avatar ]
        </button>
      </div>

      {/* 3. One Unified Net Balance Card (Matching Home Screen) */}
      <div
        className="card card-glow text-center page-section card-hover"
        style={{ padding: '20px', cursor: 'pointer' }}
        onClick={() => navigate('/')}
        id="profile-net-balance-card"
      >
        <p className="text-secondary text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
          {t('netBalance')}
        </p>
        <p className="financial-hero-amount" style={{ color: totalBalance > 0 ? 'var(--accent)' : totalBalance < 0 ? 'var(--negative)' : 'var(--text-primary)' }}>
          {formatCurrency(Math.abs(totalBalance))}
        </p>
        {totalBalance > 0 ? (
          <p className="text-accent text-sm fw-600" style={{ marginTop: '8px' }}>
            ↑ {t('youGet')} {formatCurrency(Math.abs(totalBalance))}
          </p>
        ) : totalBalance < 0 ? (
          <p className="text-negative text-sm fw-600" style={{ marginTop: '8px' }}>
            ↓ {t('youPay')} {formatCurrency(Math.abs(totalBalance))}
          </p>
        ) : (
          <p className="text-sm fw-600" style={{ marginTop: '8px', color: 'var(--positive)' }}>
            All settled up 🎉
          </p>
        )}
      </div>

      {/* 4. Account Security Section */}
      <div className="page-section">
        <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', paddingLeft: '4px' }}>
          Account Security
        </p>
        <div className="card" style={{ padding: '0 16px' }} id="account-security-menu">
          <div
            className="flex justify-between items-center"
            style={{ padding: '14px 0', cursor: 'pointer' }}
            onClick={() => navigate('/change-password')}
            id="menu-change-password"
          >
            <div className="flex items-center gap-12">
              <KeyRound size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Change Password</span>
            </div>
            <ChevronRight size={16} className="text-secondary" />
          </div>
        </div>
      </div>

      {/* 5. Clean Single-Tap Settings List */}
      <div className="page-section">
        <p className="text-secondary text-xs fw-700" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', paddingLeft: '4px' }}>
          Settings & Preferences
        </p>
        <div className="card" style={{ padding: '0 16px' }} id="preferences-menu">
          {/* Appearance / Theme */}
          <div
            className="flex justify-between items-center"
            style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
            onClick={() => setShowThemeModal(true)}
            id="menu-theme"
          >
            <div className="flex items-center gap-12">
              <div style={{ color: 'var(--accent)' }}>
                {themeMode === 'light' ? <Sun size={20} /> : themeMode === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Appearance</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-secondary text-xs fw-600" style={{ textTransform: 'capitalize' }}>
                {themeMode === 'system' ? 'System' : `${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}`}
              </span>
              <ChevronRight size={16} className="text-secondary" />
            </div>
          </div>

          {/* Language */}
          <div
            className="flex justify-between items-center"
            style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
            onClick={() => setShowLanguageModal(true)}
            id="menu-language"
          >
            <div className="flex items-center gap-12">
              <Globe size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Language</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-secondary text-xs fw-600">
                {languages.find((l) => l.code === language)?.nativeLabel}
              </span>
              <ChevronRight size={16} className="text-secondary" />
            </div>
          </div>

          {/* Notifications */}
          <div
            className="flex justify-between items-center"
            style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
            onClick={() => setShowNotificationsModal(true)}
            id="menu-notifications"
          >
            <div className="flex items-center gap-12">
              <Bell size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
            </div>
            <div className="flex items-center gap-6">
              {unreadCount > 0 && (
                <span className="text-xs fw-700" style={{ background: 'var(--negative)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '10px' }}>
                  {unreadCount} new
                </span>
              )}
              <ChevronRight size={16} className="text-secondary" />
            </div>
          </div>

          {/* History */}
          <div
            className="flex justify-between items-center"
            style={{ padding: '14px 0', cursor: 'pointer' }}
            onClick={() => navigate('/history')}
            id="menu-history"
          >
            <div className="flex items-center gap-12">
              <HistoryIcon size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Settlement History</span>
            </div>
            <ChevronRight size={16} className="text-secondary" />
          </div>
        </div>
      </div>

      {/* 5. Logout Action */}
      <div style={{ marginTop: '8px' }}>
        <button
          className="btn btn-secondary btn-full"
          id="logout-btn"
          onClick={logout}
          style={{ color: 'var(--negative)', fontWeight: 700, minHeight: '46px' }}
        >
          <LogOut size={16} /> {t('logOut')}
        </button>
      </div>

      {/* Language Selector Modal */}
      {showLanguageModal && (
        <div className="modal-overlay" onClick={() => setShowLanguageModal(false)} id="language-modal-overlay">
          <div className="modal-content flex flex-col gap-16" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', maxWidth: '380px' }}>
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Select Language</h2>
              <button className="btn-icon" onClick={() => setShowLanguageModal(false)} aria-label="Close">
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
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
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
          <div className="modal-content flex flex-col gap-16" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', maxWidth: '380px' }}>
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>App Theme</h2>
              <button className="btn-icon" onClick={() => setShowThemeModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-10">
              {[
                { code: 'light', label: 'Light Mode', sub: 'Bright, clean layout', icon: <Sun size={18} /> },
                { code: 'dark', label: 'Dark Mode', sub: 'Sleek, low-light theme', icon: <Moon size={18} /> },
                { code: 'system', label: 'System Default', sub: 'Matches OS preference', icon: <Monitor size={18} /> },
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
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)} id="edit-profile-modal-overlay">
          <div
            className="modal-content flex flex-col gap-16"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', maxWidth: '400px' }}
          >
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Edit Profile</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-10">
              <Avatar user={user} size="xl" />
              <button
                type="button"
                className="btn btn-outline text-xs flex items-center gap-6"
                onClick={() => {
                  setShowEditModal(false);
                  setShowAvatarModal(true);
                }}
                style={{ borderRadius: 'var(--radius-full)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 }}
                id="open-avatar-picker-btn"
              >
                <Sparkles size={14} /> [ Change Avatar ]
              </button>
            </div>

            <div className="input-group">
              <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Your Name</label>
              <input
                className="input"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Enter your name"
                id="edit-profile-name-input"
              />
            </div>

            <div className="flex gap-10">
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleSaveProfile}
                style={{ fontWeight: 800 }}
                id="save-profile-btn"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatarId={user?.avatarId || user?.avatar || 'avatar_01'}
        onSelectAvatar={handleSelectAvatar}
      />

      {/* Notifications Modal */}
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
