import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Calendar, Check, Percent, Calculator, Scale, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import { calculateExpenseShares } from '../data/balanceEngine';
import Avatar from '../components/Avatar';

export default function AddExpense() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getUserGroups, getGroupMembers, addExpense, updateExpense, expenses, showToast } = useApp();
  const { t } = useLanguage();

  const editingExpenseId = location.state?.expenseId;
  const editingExpense = useMemo(() => {
    if (!editingExpenseId) return null;
    return expenses.find((e) => e.id === editingExpenseId) || null;
  }, [expenses, editingExpenseId]);

  const userGroups = useMemo(() => getUserGroups(), [getUserGroups]);

  const preselectedGroupId = location.state?.groupId || (userGroups[0]?.id ?? '');
  const [title, setTitle] = useState(editingExpense ? editingExpense.title : '');
  const [amount, setAmount] = useState(editingExpense ? editingExpense.amount.toString() : '');
  const [selectedGroup, setSelectedGroup] = useState(editingExpense ? editingExpense.groupId : preselectedGroupId);
  const [paidBy, setPaidBy] = useState(editingExpense ? editingExpense.paidBy : user.id);
  const [splitType, setSplitType] = useState(editingExpense ? editingExpense.splitType || 'equal' : 'equal');
  const [date, setDate] = useState(editingExpense ? editingExpense.date : new Date().toISOString().split('T')[0]);

  // Custom split inputs (for exact or percent splits)
  const [customShares, setCustomShares] = useState(editingExpense?.shares || {});
  const [customPercents, setCustomPercents] = useState({});

  const allMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return getGroupMembers(selectedGroup);
  }, [selectedGroup, getGroupMembers]);

  const [selectedParticipants, setSelectedParticipants] = useState(() => {
    if (editingExpense) {
      return editingExpense.participants || editingExpense.splitAmong || [];
    }
    if (!preselectedGroupId) return [];
    const members = getGroupMembers(preselectedGroupId);
    return members.map((m) => m.id);
  });

  function handleGroupChange(groupId) {
    setSelectedGroup(groupId);
    const members = getGroupMembers(groupId);
    setSelectedParticipants(members.map((m) => m.id));
    const userInGroup = members.some((m) => m.id === user.id);
    setPaidBy(userInGroup ? user.id : members[0]?.id || '');
  }

  function toggleParticipant(memberId) {
    setSelectedParticipants((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  }

  function selectAllParticipants() {
    setSelectedParticipants(allMembers.map((m) => m.id));
  }

  const emojiMap = {
    grocery: '🛒', groceries: '🛒', food: '🍕', dinner: '🍽️', lunch: '🍜',
    breakfast: '🥐', rent: '🏠', bill: '📄', internet: '🌐', wifi: '🌐',
    electricity: '⚡', power: '⚡', water: '💧', travel: '✈️', flight: '✈️',
    taxi: '🚕', cab: '🚕', uber: '🚕', bus: '🚌', movie: '🎬', cinema: '🎬',
    cafe: '☕', coffee: '☕', cleaning: '🧹', party: '🎉', default: '💰',
  };

  function guessEmoji(tText) {
    const lower = tText.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lower.includes(key)) return emoji;
    }
    return emojiMap.default;
  }

  const parsedAmount = parseFloat(amount) || 0;
  const participantCount = selectedParticipants.length;

  // Split-type specific memoized share calculations
  const equalShares = useMemo(() => {
    if (participantCount === 0 || parsedAmount <= 0) return {};
    return calculateExpenseShares({
      amount: parsedAmount,
      splitAmong: selectedParticipants,
      splitType: 'equal',
    });
  }, [parsedAmount, selectedParticipants, participantCount]);

  const exactShares = useMemo(() => {
    if (splitType !== 'exact' || participantCount === 0 || parsedAmount <= 0) return {};
    const result = {};
    selectedParticipants.forEach((id) => {
      result[id] = parseFloat(customShares[id]) || 0;
    });
    return result;
  }, [splitType, selectedParticipants, parsedAmount, participantCount, customShares]);

  const percentShares = useMemo(() => {
    if (splitType !== 'percentage' || participantCount === 0 || parsedAmount <= 0) return {};
    const result = {};
    selectedParticipants.forEach((id) => {
      const pct = parseFloat(customPercents[id]) || 0;
      result[id] = Math.round((parsedAmount * pct) / 100 * 100) / 100;
    });
    return result;
  }, [splitType, selectedParticipants, parsedAmount, participantCount, customPercents]);

  const computedShares = splitType === 'exact' ? exactShares : splitType === 'percentage' ? percentShares : equalShares;

  const representativeShare = participantCount > 0 ? computedShares[selectedParticipants[0]] || 0 : 0;

  // Validate shares total
  const sharesTotal = useMemo(() => {
    if (splitType === 'equal') return parsedAmount;
    let sum = 0;
    for (const id of selectedParticipants) {
      sum += computedShares[id] || 0;
    }
    return Math.round(sum * 100) / 100;
  }, [splitType, parsedAmount, selectedParticipants, computedShares]);

  const isValidSharesTotal = splitType === 'equal' || Math.abs(sharesTotal - parsedAmount) < 0.05;

  const isValid =
    title.trim().length > 0 &&
    parsedAmount > 0 &&
    selectedGroup !== '' &&
    paidBy !== '' &&
    participantCount > 0 &&
    isValidSharesTotal;

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!isValid || isSubmitting) {
      if (!title.trim()) showToast('Title is required');
      else if (parsedAmount <= 0) showToast('Amount must be greater than 0');
      else if (!isValidSharesTotal) showToast(`Sum of shares (${sharesTotal.toFixed(2)}) must equal total amount (${parsedAmount.toFixed(2)})`);
      return;
    }

    const expenseData = {
      groupId: selectedGroup,
      title: title.trim(),
      emoji: guessEmoji(title),
      amount: parsedAmount,
      paidBy,
      splitAmong: [...selectedParticipants],
      participants: [...selectedParticipants],
      splitType,
      shares: { ...computedShares },
      date,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, expenseData);
      } else {
        await addExpense(expenseData);
      }
      goBack();
    } catch (err) {
      showToast(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page" id="add-expense-page">
      <div className="page-header">
        <button className="btn-icon" onClick={goBack} id="add-expense-back">
          <ChevronLeft size={20} />
        </button>
        <h1>{editingExpenseId ? t('editExpenseTitle') : t('addExpenseTitle')}</h1>
        <div className="spacer" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-20">
        {/* Group Selector */}
        <div className="input-group">
          <label>{t('groups')}</label>
          <select
            className="input"
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            id="expense-group-select"
          >
            <option value="" disabled>Select a group</option>
            {userGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="input-group">
          <label>{t('expenseTitle')}</label>
          <input
            className="input"
            type="text"
            placeholder={t('expenseTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            id="expense-title-input"
            autoComplete="off"
          />
        </div>

        {/* Amount */}
        <div className="input-group">
          <label>{t('amount')} (₹)</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, pointerEvents: 'none',
            }}>₹</span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder={t('amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              id="expense-amount-input"
              style={{ paddingLeft: '30px' }}
            />
          </div>
        </div>

        {/* Paid By */}
        <div className="input-group">
          <label>{t('paidBy')}</label>
          <div className="paid-by-selector" id="paid-by-selector">
            {allMembers.map((m) => {
              const isMe = m.id === user.id;
              const selected = paidBy === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  className={`paid-by-option ${selected ? 'selected' : ''}`}
                  onClick={() => setPaidBy(m.id)}
                >
                  <Avatar user={m} selected={selected} size="sm" />
                  <span style={{ fontSize: '0.72rem', fontWeight: selected ? 600 : 400 }}>
                    {isMe ? 'You' : m.firstName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Split Type Selector Cards */}
        <div className="input-group">
          <label style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem', fontWeight: 600 }}>{t('splitType')}</label>
          <div className="split-type-container" id="split-type-selector">
            <button
              type="button"
              className={`split-type-card ${splitType === 'equal' ? 'active' : ''}`}
              onClick={() => setSplitType('equal')}
              id="split-tab-equal"
            >
              <div className="split-icon-wrapper">
                <Users size={22} />
              </div>
              <span className="split-title">Equal</span>
              <span className="split-desc">Split equally</span>
            </button>

            <button
              type="button"
              className={`split-type-card ${splitType === 'exact' ? 'active' : ''}`}
              onClick={() => setSplitType('exact')}
              id="split-tab-exact"
            >
              <div className="split-icon-wrapper">
                <Calculator size={22} />
              </div>
              <span className="split-title">Exact Amount</span>
              <span className="split-desc">Set custom amounts</span>
            </button>

            <button
              type="button"
              className={`split-type-card ${splitType === 'percentage' ? 'active' : ''}`}
              onClick={() => setSplitType('percentage')}
              id="split-tab-percent"
            >
              <div className="split-icon-wrapper">
                <Percent size={22} />
              </div>
              <span className="split-title">Percentage</span>
              <span className="split-desc">Split by percentage</span>
            </button>
          </div>
        </div>

        {/* Participants & Custom Input Rows */}
        <div className="input-group">
          <div className="flex items-center justify-between">
            <label style={{ marginBottom: 0 }}>{t('splitWith')}</label>
            {selectedParticipants.length < allMembers.length && (
              <button
                type="button"
                className="see-all"
                onClick={selectAllParticipants}
                style={{ fontSize: '0.72rem' }}
              >
                Select All
              </button>
            )}
          </div>
          <div className="card" style={{ padding: '0 14px' }}>
            {allMembers.map((m) => {
              const isMe = m.id === user.id;
              const isSelected = selectedParticipants.includes(m.id);
              return (
                <div key={m.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                  <div
                    className="member-row"
                    onClick={() => toggleParticipant(m.id)}
                    style={{ cursor: 'pointer' }}
                    id={`participant-${m.id}`}
                  >
                    <Avatar user={m} size="sm" selected={isSelected} />
                    <div className="member-info" style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.88rem' }}>{isMe ? 'You' : m.name}</h3>
                      {isSelected && parsedAmount > 0 && splitType === 'equal' && (
                        <p className="text-accent text-xs" style={{ marginTop: '2px' }}>
                          {formatCurrency(computedShares[m.id] || 0)}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border-light)',
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Custom Exact input */}
                  {isSelected && splitType === 'exact' && (
                    <div style={{ marginTop: '8px', paddingLeft: '40px' }}>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        placeholder="Amount (₹)"
                        value={customShares[m.id] || ''}
                        onChange={(e) => setCustomShares({ ...customShares, [m.id]: e.target.value })}
                        style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                      />
                    </div>
                  )}

                  {/* Custom Percent input */}
                  {isSelected && splitType === 'percentage' && (
                    <div style={{ marginTop: '8px', paddingLeft: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        className="input"
                        type="number"
                        step="1"
                        placeholder="Percent (%)"
                        value={customPercents[m.id] || ''}
                        onChange={(e) => setCustomPercents({ ...customPercents, [m.id]: e.target.value })}
                        style={{ fontSize: '0.85rem', padding: '6px 12px', flex: 1 }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>
                        = {formatCurrency(computedShares[m.id] || 0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Card */}
        {parsedAmount > 0 && participantCount > 0 && (
          <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card-alt)' }}>
            <div className="flex justify-between items-center">
              <span className="text-secondary text-sm">{t('yourPart')}</span>
              <span className="fw-700 text-accent" style={{ fontSize: '1rem' }}>
                {formatCurrency(computedShares[user.id] || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center" style={{ marginTop: '8px' }}>
              <span className="text-secondary text-xs">
                {formatCurrency(parsedAmount)} Total
              </span>
              <span className="text-secondary text-xs">
                {splitType === 'equal' ? t('splitEqual') : splitType === 'exact' ? t('splitExact') : t('splitPercent')}
              </span>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="input-group">
          <label>Date</label>
          <div style={{ position: 'relative' }}>
            <Calendar
              size={17}
              color="var(--text-secondary)"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ paddingLeft: '42px' }}
              id="expense-date-input"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={!isValid || isSubmitting}
          id="submit-expense-btn"
          style={{ opacity: (isValid && !isSubmitting) ? 1 : 0.45, marginTop: '4px' }}
        >
          {isSubmitting ? t('loading') : (editingExpenseId ? t('save') : t('addExpense'))}
        </button>
      </form>
    </div>
  );
}
