const API_BASE = 'http://localhost:5000/api';

async function runMultiSessionConcurrencyTest() {
  console.log('⚡ Starting Multi-Session & Parallel Concurrency Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function report(name, success, details = '') {
    if (success) {
      console.log(`✅ [PASS] ${name} ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  let userA, tokenA, userB, tokenB;
  let groupId, inviteCode;

  try {
    // 1. Independent Session Auth
    const regARes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Session A User', email: `sessA_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const regA = await regARes.json();
    tokenA = regA.token;
    userA = regA.user;

    const regBRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Session B User', email: `sessB_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const regB = await regBRes.json();
    tokenB = regB.token;
    userB = regB.user;

    const headersA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` };
    const headersB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` };

    report('Session Setup', regARes.ok && regBRes.ok, `User A: ${userA.id}, User B: ${userB.id}`);

    // 2. Group Creation & Joining across sessions
    const groupRes = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ name: 'Concurrency Test Flat', icon: '⚡' }),
    });
    const groupData = await groupRes.json();
    groupId = groupData.group.id;
    inviteCode = groupData.group.inviteCode;

    const joinRes = await fetch(`${API_BASE}/groups/join`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({ inviteCode }),
    });
    report('Group Join across independent sessions', joinRes.ok);

    // 3. User A creates expense ₹100
    const expARes = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        groupId,
        title: 'Electricity',
        amount: 100,
        paidBy: userA.id,
        splitAmong: [userA.id, userB.id],
      }),
    });
    report('User A creates expense', expARes.status === 201);

    // 4. User B fetches expenses & balance
    const expBGetRes = await fetch(`${API_BASE}/groups/${groupId}/expenses`, { headers: headersB });
    const expBGetData = await expBGetRes.json();
    const seesExpA = expBGetData.expenses.some((e) => e.title === 'Electricity');
    report('User B sees User A expense upon fetch', seesExpA);

    // 5. PARALLEL CONCURRENT MUTATIONS (Simultaneous expense creation)
    console.log('\n🔄 Executing simultaneous concurrent expense creation...');
    const [pA, pB] = await Promise.all([
      fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
          groupId,
          title: 'Concurrent A Expense',
          amount: 200,
          paidBy: userA.id,
          splitAmong: [userA.id, userB.id],
        }),
      }),
      fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({
          groupId,
          title: 'Concurrent B Expense',
          amount: 300,
          paidBy: userB.id,
          splitAmong: [userA.id, userB.id],
        }),
      }),
    ]);

    const pAData = await pA.json();
    const pBData = await pB.json();
    report('Parallel simultaneous expense creation', pA.ok && pB.ok, `Exp A status: ${pA.status}, Exp B status: ${pB.status}`);

    // Verify database state contains all 3 expenses
    const finalExpRes = await fetch(`${API_BASE}/groups/${groupId}/expenses`, { headers: headersA });
    const finalExpData = await finalExpRes.json();
    const all3Exist = finalExpData.expenses.length === 3;
    report('Database integrity check: No dropped expenses under race condition', all3Exist, `Total active expenses: ${finalExpData.expenses.length}`);

    // 6. Parallel Settlement Confirmation Race Condition
    await fetch(`${API_BASE}/groups/${groupId}/settlements/initiate`, { method: 'POST', headers: headersA });

    const [confA, confB] = await Promise.all([
      fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headersA, body: JSON.stringify({ memberId: userA.id }) }),
      fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headersB, body: JSON.stringify({ memberId: userB.id }) }),
    ]);
    report('Parallel simultaneous settlement confirmations', confA.ok && confB.ok);

    // Complete settlement
    const compRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/complete`, { method: 'POST', headers: headersA });
    const compData = await compRes.json();
    report('Settlement completion after parallel confirmations', compRes.ok && compData.settlement?.status === 'completed');

    console.log(`\n==================================================`);
    console.log(`CONCURRENCY RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during concurrency test:', err);
    process.exit(1);
  }
}

runMultiSessionConcurrencyTest();
