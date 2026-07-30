import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Calendar, Check, Percent, Calculator, Users, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [paidBy, setPaidBy] = useState(editingExpense ? editingExpense.paidBy : user?.id || '');
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

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [repeatSchedule, setRepeatSchedule] = useState('never');

  function handleGroupChange(groupId) {
    setSelectedGroup(groupId);
    const members = getGroupMembers(groupId);
    setSelectedParticipants(members.map((m) => m.id));
    const userInGroup = members.some((m) => m.id === user?.id);
    setPaidBy(userInGroup ? user?.id : members[0]?.id || '');
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

  // Split-type specific share calculations
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

    if (!selectedGroup) {
      showToast('Choose a group');
      return;
    }
    if (!title.trim()) {
      showToast('Tell us what you bought');
      return;
    }
    if (parsedAmount <= 0) {
      showToast('Enter an amount');
      return;
    }
    if (!paidBy) {
      showToast('Choose who paid');
      return;
    }
    if (!isValidSharesTotal) {
      showToast(`Sum of shares (${sharesTotal.toFixed(2)}) must equal total amount (${parsedAmount.toFixed(2)})`);
      return;
    }

    if (!isValid || isSubmitting) return;

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
        showToast('Bill updated');
      } else {
        await addExpense(expenseData);
        showToast('Bill added');
      }
      goBack();
    } catch (err) {
      showToast(err.message || "Couldn't save this bill. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page" id="add-expense-page">
      {/* HEADER (Minimal, no duplicate save/close buttons) */}
      <div className="page-header flex items-center justify-between" style={{ paddingBottom: '16px' }}>
        <button className="btn-icon" onClick={goBack} id="add-expense-back" aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {editingExpenseId ? 'Edit bill' : 'Add a bill'}
        </h1>
        <div style={{ width: '42px' }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-20">
        {/* 1. GROUP SELECTOR */}
        <div className="input-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Group
          </label>
          <select
            className="input"
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            id="expense-group-select"
          >
            <option value="" disabled>Select a group</option>
            {userGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.icon || '🏠'} {g.name}</option>
            ))}
          </select>
        </div>

        {/* 2. EXPENSE TITLE */}
        <div className="input-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            {t('kyaKharida')}
          </label>
          <input
            className="input"
            type="text"
            placeholder="Dinner, groceries, rent..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            id="expense-title-input"
            autoComplete="off"
          />
        </div>

        {/* 3. AMOUNT */}
        <div className="input-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            {t('kitnaLaga')}
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 700, pointerEvents: 'none',
            }}>₹</span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              id="expense-amount-input"
              style={{ paddingLeft: '32px', fontSize: '1.1rem', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* 4. WHO PAID? */}
        <div className="input-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            {t('kisnePaiseDiye')}
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: '10px',
            }}
            id="paid-by-selector"
          >
            {allMembers.map((m) => {
              const isMe = m.id === user?.id;
              const selected = paidBy === m.id;
              const memberName = isMe ? 'You' : m.firstName || m.name;

              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaidBy(m.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    background: selected ? 'var(--bg-card)' : 'var(--bg-input)',
                    border: selected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                  id={`paid-by-${m.id}`}
                >
                  <Avatar user={m} selected={selected} size="sm" />
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: selected ? 700 : 500,
                    marginTop: '6px',
                    color: selected ? 'var(--accent)' : 'var(--text-primary)',
                  }}>
                    {memberName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. ADVANCED OPTIONS TOGGLE (Collapsed by Default) */}
        <div className="flex justify-center" style={{ margin: '4px 0' }}>
          <button
            type="button"
            className="btn btn-ghost text-xs flex items-center gap-6"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.82rem' }}
            id="toggle-more-options-btn"
          >
            {showMoreOptions ? (
              <>Less options <ChevronUp size={16} /></>
            ) : (
              <>More options <ChevronDown size={16} /></>
            )}
          </button>
        </div>

        {/* ADVANCED OPTIONS CONTAINER */}
        {showMoreOptions && (
          <div
            className="flex flex-col gap-20"
            style={{
              padding: '18px',
              background: 'var(--bg-card-alt)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
            }}
            id="more-options-container"
          >
            {/* OPTION A — SPLIT TYPE */}
            <div className="input-group">
              <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                How should we split it?
              </label>
              <div
                id="split-type-selector"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '6px',
                  width: '100%',
                  overflow: 'hidden',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px',
                  boxSizing: 'border-box',
                }}
              >
                {[
                  { key: 'equal', label: 'Equal', icon: <Users size={14} /> },
                  { key: 'exact', label: 'Exact', icon: <Calculator size={14} /> },
                  { key: 'percentage', label: 'Percent', icon: <Percent size={14} /> },
                ].map((opt) => {
                  const isActive = splitType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSplitType(opt.key)}
                      id={`split-tab-${opt.key === 'percentage' ? 'percent' : opt.key}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        padding: '10px 2px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? '#000' : 'var(--text-secondary)',
                        fontFamily: 'var(--font)',
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{ display: 'inline-flex', flexShrink: 0 }}>{opt.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OPTION B — PARTICIPANTS */}
            <div className="input-group">
              <div className="flex items-center justify-between">
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Who was part of this bill?
                </label>
                {selectedParticipants.length < allMembers.length && (
                  <button
                    type="button"
                    className="see-all"
                    onClick={selectAllParticipants}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Select All
                  </button>
                )}
              </div>
              <div className="card" style={{ padding: '0 14px' }}>
                {allMembers.map((m) => {
                  const isMe = m.id === user?.id;
                  const isSelected = selectedParticipants.includes(m.id);
                  const memberName = isMe ? 'You' : m.firstName || m.name;

                  return (
                    <div key={m.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                      <div
                        className="member-row flex items-center justify-between"
                        onClick={() => toggleParticipant(m.id)}
                        style={{ cursor: 'pointer' }}
                        id={`participant-${m.id}`}
                      >
                        <div className="flex items-center gap-10">
                          <Avatar user={m} size="sm" selected={isSelected} />
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {memberName}
                            </span>
                            {isSelected && parsedAmount > 0 && splitType === 'equal' && (
                              <p className="text-accent text-xs" style={{ margin: 0, marginTop: '2px' }}>
                                {formatCurrency(computedShares[m.id] || 0)}
                              </p>
                            )}
                          </div>
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
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            = {formatCurrency(computedShares[m.id] || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OPTION C — DATE */}
            <div className="input-group">
              <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                When was it?
              </label>
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

            {/* OPTION D — REPEAT SCHEDULE */}
            <div className="input-group">
              <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Add this again later?
              </label>
              <div className="flex gap-8">
                {['never', 'weekly', 'monthly'].map((rep) => {
                  const isActive = (repeatSchedule || 'never') === rep;
                  return (
                    <button
                      key={rep}
                      type="button"
                      className={`btn flex-1 text-xs ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setRepeatSchedule(rep)}
                      id={`repeat-opt-${rep}`}
                      style={{ textTransform: 'capitalize', padding: '8px 4px' }}
                    >
                      {rep}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. SINGLE PRIMARY SUBMIT ACTION */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={!isValid || isSubmitting}
          id="submit-expense-btn"
          style={{ opacity: (isValid && !isSubmitting) ? 1 : 0.5, marginTop: '8px', minHeight: '48px', fontSize: '1rem', fontWeight: 800 }}
        >
          {isSubmitting ? 'Saving expense...' : (editingExpenseId ? 'Save Changes' : 'Save Expense')}
        </button>
      </form>
    </div>
  );
}
