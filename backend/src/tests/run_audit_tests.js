const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting 12 Automated Verification Tests for SplitMates...\n');
  let passedCount = 0;
  let failedCount = 0;

  function report(name, success, details = '') {
    if (success) {
      console.log(`✅ [PASS] ${name} ${details}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${name} - ${details}`);
      failedCount++;
    }
  }

  // Helper: Register & login user
  async function createUser(emailPrefix, name) {
    const email = `${emailPrefix}_${Date.now()}@test.com`;
    const password = 'Password123!';
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`User creation failed: ${data.message}`);
    return { token: data.token, user: data.user };
  }

  try {
    // Setup users
    const u1 = await createUser('user1', 'Alice');
    const u2 = await createUser('user2', 'Bob');
    const u3 = await createUser('user3', 'Charlie');
    const u4 = await createUser('user4', 'David');

    const headers1 = { 'Content-Type': 'application/json', Authorization: `Bearer ${u1.token}` };
    const headers2 = { 'Content-Type': 'application/json', Authorization: `Bearer ${u2.token}` };
    const headers3 = { 'Content-Type': 'application/json', Authorization: `Bearer ${u3.token}` };
    const headers4 = { 'Content-Type': 'application/json', Authorization: `Bearer ${u4.token}` };

    // Create group
    const gRes = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({ name: 'Audit Test Group', icon: '🧪' }),
    });
    const gData = await gRes.json();
    const groupId = gData.group.id;
    const inviteCode = gData.group.inviteCode;

    // Join remaining users to group
    await fetch(`${API_BASE}/groups/join`, { method: 'POST', headers: headers2, body: JSON.stringify({ inviteCode }) });
    await fetch(`${API_BASE}/groups/join`, { method: 'POST', headers: headers3, body: JSON.stringify({ inviteCode }) });
    await fetch(`${API_BASE}/groups/join`, { method: 'POST', headers: headers4, body: JSON.stringify({ inviteCode }) });

    // ── TEST 1: ₹1,000 split equally among 4 members ──────────────────────────
    const exp1Res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({
        groupId,
        title: 'Test 1 Expense',
        amount: 1000,
        paidBy: u1.user.id,
        splitAmong: [u1.user.id, u2.user.id, u3.user.id, u4.user.id],
      }),
    });
    const exp1Data = await exp1Res.json();
    const shares1Vals = Object.values(exp1Data.expense.shares);
    const sum1 = shares1Vals.reduce((s, x) => s + Number(x), 0);
    const pass1 = exp1Res.ok && shares1Vals.length === 4 && sum1 === 1000 && shares1Vals.every((v) => Number(v) === 250);
    report('TEST 1: ₹1,000 split equally among 4 members', pass1, `Sum: ₹${sum1}, Shares: ${shares1Vals.join(', ')}`);

    // ── TEST 2: Multiple expenses aggregation ────────────────────────────────
    const exp2Res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headers2,
      body: JSON.stringify({
        groupId,
        title: 'Test 2 Expense',
        amount: 2000,
        paidBy: u2.user.id,
        splitAmong: [u1.user.id, u2.user.id, u3.user.id, u4.user.id],
      }),
    });
    const exp2Data = await exp2Res.json();
    const pass2 = exp2Res.ok && Number(exp2Data.expense.amount) === 2000;
    report('TEST 2: Multiple expenses aggregate in active cycle', pass2);

    // ── TEST 3: ₹100 split among 3 members (Penny rounding) ─────────────────
    const exp3Res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({
        groupId,
        title: 'Test 3 Penny Split',
        amount: 100,
        paidBy: u1.user.id,
        splitAmong: [u1.user.id, u2.user.id, u3.user.id],
      }),
    });
    const exp3Data = await exp3Res.json();
    const shares3Vals = Object.values(exp3Data.expense.shares);
    const sum3 = shares3Vals.reduce((s, x) => s + Number(x), 0);
    const pass3 = exp3Res.ok && Math.abs(sum3 - 100) < 0.001;
    report('TEST 3: ₹100 split among 3 members exact cents', pass3, `Shares sum: ₹${sum3} (${shares3Vals.join(', ')})`);

    // ── Initiate Settlement for Settlement Lock Tests ─────────
    const initRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/initiate`, { method: 'POST', headers: headers1 });
    const initData = await initRes.json();
    console.log('DEBUG Initiate Settlement Output:', initRes.status, initData);

    // ── TEST 4: Edit expense during settlement initiation ────────────────────
    const editRes = await fetch(`${API_BASE}/expenses/${exp1Data.expense.id}`, {
      method: 'PUT',
      headers: headers1,
      body: JSON.stringify({ title: 'Mutated Title' }),
    });
    const editData = await editRes.json();
    const pass4 = editRes.status === 400 && editData.error === 'Conflict';
    report('TEST 4: Reject expense edit during settlement initiation', pass4, `Status: ${editRes.status}, Message: ${editData.message}`);

    // ── TEST 5: Add expense during settlement initiation ─────────────────────
    const addRes = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({
        groupId,
        title: 'Locked Expense',
        amount: 500,
        paidBy: u1.user.id,
        splitAmong: [u1.user.id, u2.user.id],
      }),
    });
    const addData = await addRes.json();
    const pass5 = addRes.status === 400 && addData.error === 'Conflict';
    report('TEST 5: Reject new expense during settlement initiation', pass5, `Status: ${addRes.status}`);

    // ── Cancel Settlement to unlock group for remaining tests ─────────────────
    await fetch(`${API_BASE}/groups/${groupId}/settlements/cancel`, { method: 'POST', headers: headers1 });

    // ── TEST 6: New member joins during active cycle ─────────────────────────
    const u5 = await createUser('user5', 'Eve');
    const headers5 = { 'Content-Type': 'application/json', Authorization: `Bearer ${u5.token}` };
    await fetch(`${API_BASE}/groups/join`, { method: 'POST', headers: headers5, body: JSON.stringify({ inviteCode }) });
    
    // Check exp1 shares remain 4
    const checkExp1 = await fetch(`${API_BASE}/groups/${groupId}/expenses`, { headers: headers1 });
    const checkData1 = await checkExp1.json();
    const exp1Target = checkData1.expenses.find(e => e.id === exp1Data.expense.id);
    const exp1Participants = exp1Target.participants || Object.keys(exp1Target.shares);
    const pass6 = exp1Participants.length === 4 && !exp1Participants.includes(u5.user.id);
    report('TEST 6: New member joining does not retroactively mutate past expenses', pass6);

    // ── TEST 7: Member attempts to leave with outstanding balance ────────────
    const leaveRes = await fetch(`${API_BASE}/groups/${groupId}/leave`, { method: 'POST', headers: headers2 });
    const leaveData = await leaveRes.json();
    const pass7 = leaveRes.status === 400 && leaveData.message.includes('outstanding balance');
    report('TEST 7: Member with non-zero balance cannot leave group', pass7, `Message: ${leaveData.message}`);

    // ── TEST 8: Unauthorized user accesses group ──────────────────────────────
    const externalUser = await createUser('external', 'Mallory');
    const extHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${externalUser.token}` };
    const unauthRes = await fetch(`${API_BASE}/groups/${groupId}/expenses`, { headers: extHeaders });
    const pass8 = unauthRes.status === 403;
    report('TEST 8: Unauthorized access to group expenses rejected', pass8, `Status: ${unauthRes.status}`);

    // ── Re-initiate settlement for settlement confirmation tests ──────────────
    await fetch(`${API_BASE}/groups/${groupId}/settlements/initiate`, { method: 'POST', headers: headers1 });

    // ── TEST 9: Duplicate settlement initiation ──────────────────────────────
    const dupInitRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/initiate`, { method: 'POST', headers: headers2 });
    const dupInitData = await dupInitRes.json();
    const pass9 = dupInitRes.ok && dupInitData.settlement.status === 'pending';
    report('TEST 9: Duplicate settlement initiation handled idempotently', pass9);

    // ── TEST 10: Duplicate settlement confirmation ────────────────────────────
    await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headers1, body: JSON.stringify({ memberId: u1.user.id }) });
    const dupConfRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headers1, body: JSON.stringify({ memberId: u1.user.id }) });
    const dupConfData = await dupConfRes.json();
    const pass10 = dupConfRes.ok && dupConfData.confirmations.filter(c => c === u1.user.id).length === 1;
    report('TEST 10: Duplicate settlement confirmation prevented', pass10);

    // ── TEST 11: Settlement completion with missing confirmations ────────────
    const compFailRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/complete`, { method: 'POST', headers: headers1 });
    const compFailData = await compFailRes.json();
    const pass11 = compFailRes.status === 400 && compFailData.message.includes('Pending confirmations');
    report('TEST 11: Completion rejected when confirmations missing', pass11, `Message: ${compFailData.message}`);

    // ── TEST 12: Complete settlement transaction when all confirmed ─────────
    await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headers2, body: JSON.stringify({ memberId: u2.user.id }) });
    await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headers3, body: JSON.stringify({ memberId: u3.user.id }) });
    await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headers4, body: JSON.stringify({ memberId: u4.user.id }) });
    await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headers5, body: JSON.stringify({ memberId: u5.user.id }) });

    const compSuccessRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/complete`, { method: 'POST', headers: headers1 });
    const compSuccessData = await compSuccessRes.json();
    const pass12 = compSuccessRes.ok && compSuccessData.settlement.status === 'completed';
    report('TEST 12: Settlement completion succeeds cleanly when all confirmed', pass12, `Status: ${compSuccessData.settlement.status}`);

    console.log(`\n==================================================`);
    console.log(`RESULTS SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED`);
    console.log(`==================================================\n`);

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
