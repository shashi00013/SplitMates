import {
  calculateExpenseShares,
  calculateMemberBalances,
  calculateOverallBalances,
  calculateSettlementTransactions,
  calculateCycleSummary,
} from '../src/data/balanceEngine.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} | Expected: ${expected}, Got: ${actual}`);
  }
}

function runBalanceEngineUnitTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING BALANCE ENGINE UNIT TESTS');
  console.log('====================================================\n');

  // Test 1: Equal Split ($900 / 3 members = $300 each)
  console.log('1️⃣ Testing Equal Split ($900 / 3 members)...');
  const shares1 = calculateExpenseShares({
    amount: 900,
    splitAmong: ['u1', 'u2', 'u3'],
    splitType: 'equal',
  });
  assertEquals(shares1['u1'], 300, 'User 1 share');
  assertEquals(shares1['u2'], 300, 'User 2 share');
  assertEquals(shares1['u3'], 300, 'User 3 share');
  console.log('   ✅ Equal split 900 / 3 passed!');

  // Test 2: Equal Split with cent remainder ($100 / 3 members = 33.34, 33.33, 33.33)
  console.log('\n2️⃣ Testing Equal Split cent remainder ($100 / 3 members)...');
  const shares2 = calculateExpenseShares({
    amount: 100,
    splitAmong: ['u1', 'u2', 'u3'],
    splitType: 'equal',
  });
  const sum2 = shares2['u1'] + shares2['u2'] + shares2['u3'];
  assertEquals(Math.round(sum2 * 100) / 100, 100, 'Sum of shares equals original amount');
  assertEquals(shares2['u1'], 33.34, 'User 1 share (gets +1 cent remainder)');
  assertEquals(shares2['u2'], 33.33, 'User 2 share');
  assertEquals(shares2['u3'], 33.33, 'User 3 share');
  console.log('   ✅ Cent remainder distribution passed!');

  // Test 3: Member Net Balances & Zero-Sum Invariant
  console.log('\n3️⃣ Testing Member Net Balances & Zero-Sum Invariant...');
  const expenses = [
    {
      id: 'e1',
      groupId: 'g1',
      amount: 1200,
      paidBy: 'u1',
      splitAmong: ['u1', 'u2', 'u3'],
      splitType: 'equal',
      settled: false,
    },
  ];
  const balances = calculateMemberBalances('g1', expenses, ['u1', 'u2', 'u3']);
  assertEquals(balances['u1'], 800, 'Payer (u1) net balance (+800)');
  assertEquals(balances['u2'], -400, 'Participant (u2) net balance (-400)');
  assertEquals(balances['u3'], -400, 'Participant (u3) net balance (-400)');

  const totalSum = Object.values(balances).reduce((sum, val) => sum + val, 0);
  assertEquals(Math.round(totalSum * 100) / 100, 0, 'Zero-sum invariant (sum of balances = 0)');
  console.log('   ✅ Zero-sum invariant passed!');

  // Test 4: Greedy Settlement Transactions
  console.log('\n4️⃣ Testing Settlement Transaction Resolution...');
  const txs = calculateSettlementTransactions(balances);
  assertEquals(txs.length, 2, 'Two transactions generated');
  assert(
    (txs[0].from === 'u2' && txs[0].to === 'u1' && txs[0].amount === 400) ||
    (txs[0].from === 'u3' && txs[0].to === 'u1' && txs[0].amount === 400),
    'First settlement transaction correct'
  );
  const totalSettledAmount = txs.reduce((sum, t) => sum + t.amount, 0);
  assertEquals(totalSettledAmount, 800, 'Total settled amount equals net receivable amount');
  console.log('   ✅ Settlement transaction resolution passed!');

  console.log('\n====================================================');
  console.log('🎉 ALL BALANCE ENGINE UNIT TESTS PASSED!');
  console.log('====================================================\n');
}

runBalanceEngineUnitTests();
