import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../translations/LanguageContext';
import { formatCurrency } from '../data/mockData';
import { calculateSettlementTransactions } from '../data/balanceEngine';
import Avatar from '../components/Avatar';

export default function BalanceBreakdown() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, getUserGroups, getBalancesForGroup, getUserById } = useApp();

  const userGroups = getUserGroups();

  // Aggregate person-by-person dues
  const youOweList = [];
  const youAreOwedList = [];

  userGroups.forEach((group) => {
    const balances = getBalancesForGroup(group.id);
    const txs = calculateSettlementTransactions(balances);

    txs.forEach((tx) => {
      if (tx.from === user?.id) {
        const toUser = getUserById(tx.to);
        if (toUser) {
          youOweList.push({
            id: `${group.id}-${toUser.id}`,
            groupId: group.id,
            groupName: group.name,
            member: toUser,
            amount: tx.amount,
          });
        }
      } else if (tx.to === user?.id) {
        const fromUser = getUserById(tx.from);
        if (fromUser) {
          youAreOwedList.push({
            id: `${group.id}-${fromUser.id}`,
            groupId: group.id,
            groupName: group.name,
            member: fromUser,
            amount: tx.amount,
          });
        }
      }
    });
  });

  const totalYouOwe = youOweList.reduce((sum, item) => sum + item.amount, 0);
  const totalYouAreOwed = youAreOwedList.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="page" id="balance-breakdown-page">
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate(-1)} id="breakdown-back-btn">
          <ChevronLeft size={20} />
        </button>
        <h1>Balance Summary</h1>
        <div className="spacer" />
      </div>

      <div className="flex flex-col gap-20" style={{ paddingTop: '8px' }}>
        {/* Section 1: You Owe */}
        {/* Contrast Effect: Tinted background for 'You Owe' section */}
        <div className="card" style={{ padding: '18px 20px', border: '1px solid rgba(255, 71, 87, 0.2)', background: 'rgba(255, 71, 87, 0.03)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div className="flex items-center gap-8">
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255, 71, 87, 0.15)',
                  color: 'var(--negative)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowDownLeft size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                You Owe
              </h2>
            </div>
            <span className="fw-800 text-negative" style={{ fontSize: '1.1rem' }}>
              {formatCurrency(totalYouOwe)}
            </span>
          </div>

          {youOweList.length === 0 ? (
            <p className="text-secondary text-xs text-center" style={{ padding: '12px 0' }}>
              You don't owe anyone money 🎉
            </p>
          ) : (
            <div className="flex flex-col gap-12">
              {youOweList.map((item) => (
                <div key={item.id} className="flex justify-between items-center" id={`owe-item-${item.member.id}`}>
                  <div className="flex items-center gap-10">
                    <Avatar user={item.member} size="sm" />
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        You owe {item.member.firstName || item.member.name}
                      </h4>
                      <p className="text-secondary text-xs" style={{ margin: 0 }}>
                        {item.groupName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <span className="fw-700 text-negative" style={{ fontSize: '0.9rem' }}>
                      {formatCurrency(item.amount)}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/settle/${item.groupId}`)}
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      id={`pay-btn-${item.member.id}`}
                    >
                      Settle Up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: You're Owed */}
        {/* Contrast Effect: Tinted background for 'You're Owed' section */}
        <div className="card" style={{ padding: '18px 20px', border: '1px solid rgba(0, 210, 106, 0.2)', background: 'rgba(0, 210, 106, 0.03)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div className="flex items-center gap-8">
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowUpRight size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                You're Owed
              </h2>
            </div>
            <span className="fw-800 text-accent" style={{ fontSize: '1.1rem' }}>
              {formatCurrency(totalYouAreOwed)}
            </span>
          </div>

          {youAreOwedList.length === 0 ? (
            <p className="text-secondary text-xs text-center" style={{ padding: '12px 0' }}>
              No one owes you money right now
            </p>
          ) : (
            <div className="flex flex-col gap-12">
              {youAreOwedList.map((item) => (
                <div key={item.id} className="flex justify-between items-center" id={`owed-item-${item.member.id}`}>
                  <div className="flex items-center gap-10">
                    <Avatar user={item.member} size="sm" />
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {item.member.firstName || item.member.name} owes you
                      </h4>
                      <p className="text-secondary text-xs" style={{ margin: 0 }}>
                        {item.groupName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <span className="fw-700 text-accent" style={{ fontSize: '0.9rem' }}>
                      {formatCurrency(item.amount)}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/settle/${item.groupId}`)}
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      id={`remind-btn-${item.member.id}`}
                    >
                      Remind
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
