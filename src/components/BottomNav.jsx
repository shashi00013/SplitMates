import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Receipt, User, Plus } from 'lucide-react';
import { useLanguage } from '../translations/LanguageContext';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const tabs = [
    { path: '/', labelKey: 'home', icon: Home },
    { path: '/groups', labelKey: 'groups', icon: Users },
    { path: '/add-expense', labelKey: 'addExpense', isAdd: true },
    { path: '/expenses', labelKey: 'expenses', icon: Receipt },
    { path: '/profile', labelKey: 'profile', icon: User },
  ];

  return (
    <nav className="bottom-nav" id="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map((tab) =>
          tab.isAdd ? (
            <button
              key="add"
              className="nav-item-add"
              onClick={() => navigate('/add-expense')}
              aria-label="Add Expense"
              id="nav-add-expense"
            >
              <Plus strokeWidth={2.5} />
            </button>
          ) : (
            <button
              key={tab.path}
              className={`nav-item ${location.pathname === tab.path ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
              id={`nav-${tab.labelKey}`}
            >
              <tab.icon size={22} />
              <span>{t(tab.labelKey)}</span>
            </button>
          )
        )}
      </div>
    </nav>
  );
}
