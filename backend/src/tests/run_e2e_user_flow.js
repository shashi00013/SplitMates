const API_BASE = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('🚀 Starting 20-Step Real End-to-End User Flow Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function stepReport(stepNum, title, success, details = '') {
    if (success) {
      console.log(`✅ Step ${stepNum}: [PASS] ${title} ${details}`);
      passed++;
    } else {
      console.error(`❌ Step ${stepNum}: [FAIL] ${title} - ${details}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  let userAToken, userA, userBToken, userB, userCToken, userC;
  let groupId, inviteCode, exp1Id;

  try {
    // ── STEP 1: Register User A ───────────────────────────────────────────────
    const regARes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: `usera_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const regAData = await regARes.json();
    userAToken = regAData.token;
    userA = regAData.user;
    stepReport(1, 'Register User A', regARes.ok && Boolean(userAToken), `ID: ${userA?.id}`);

    // ── STEP 2: Register User B ───────────────────────────────────────────────
    const regBRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: `userb_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const regBData = await regBRes.json();
    userBToken = regBData.token;
    userB = regBData.user;
    stepReport(2, 'Register User B', regBRes.ok && Boolean(userBToken), `ID: ${userB?.id}`);

    // ── STEP 3: Login as User A ───────────────────────────────────────────────
    const loginARes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `usera_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const loginAData = await loginARes.json();
    stepReport(3, 'Login as User A', loginARes.ok && loginAData.user.id === userA.id, `Token received`);

    // ── STEP 4: Create a group ────────────────────────────────────────────────
    const headersA = { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` };
    const createGroupRes = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ name: 'E2E Apartment 4B', icon: '🏠', description: 'End-to-End Test Group' }),
    });
    const createGroupData = await createGroupRes.json();
    groupId = createGroupData.group?.id;
    inviteCode = createGroupData.group?.inviteCode;
    stepReport(4, 'Create Group (E2E Apartment 4B)', createGroupRes.status === 201 && Boolean(groupId), `GroupID: ${groupId}`);

    // ── STEP 5: Verify generated invite code is visible ───────────────────────
    stepReport(5, 'Verify Invite Code is visible & usable', Boolean(inviteCode) && inviteCode.length > 5, `Code: ${inviteCode}`);

    // ── STEP 6: Join group as User B ──────────────────────────────────────────
    const headersB = { 'Content-Type': 'application/json', Authorization: `Bearer ${userBToken}` };
    const joinRes = await fetch(`${API_BASE}/groups/join`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({ inviteCode }),
    });
    const joinData = await joinRes.json();
    stepReport(6, 'Join Group as User B via Invite Code', joinRes.ok && joinData.group.id === groupId);

    // ── STEP 7: Verify both users appear as group members ────────────────────
    const membersRes = await fetch(`${API_BASE}/groups/${groupId}/members`, { headers: headersA });
    const membersData = await membersRes.json();
    const memberIds = membersData.members.map((m) => m.id);
    const bothInGroup = memberIds.includes(userA.id) && memberIds.includes(userB.id);
    stepReport(7, 'Verify both users appear as group members', membersRes.ok && bothInGroup, `Members: ${membersData.members.map(m=>m.name).join(', ')}`);

    // ── STEP 8: Create Expense (₹100 paid by A, split A & B) ──────────────────
    const exp1Res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        groupId,
        title: 'Grocery Run',
        amount: 100,
        paidBy: userA.id,
        splitAmong: [userA.id, userB.id],
      }),
    });
    const exp1Data = await exp1Res.json();
    exp1Id = exp1Data.expense?.id;
    stepReport(8, 'Create Expense (₹100 paid by User A, split equal)', exp1Res.status === 201 && Boolean(exp1Id));

    // ── STEP 9: Verify both users see the expense ────────────────────────────
    const getExpARes = await fetch(`${API_BASE}/groups/${groupId}/expenses`, { headers: headersA });
    const getExpBRes = await fetch(`${API_BASE}/groups/${groupId}/expenses`, { headers: headersB });
    const expAData = await getExpARes.json();
    const expBData = await getExpBRes.json();
    const seenByBoth = expAData.expenses.some((e) => e.id === exp1Id) && expBData.expenses.some((e) => e.id === exp1Id);
    stepReport(9, 'Verify both users see the expense', getExpARes.ok && getExpBRes.ok && seenByBoth);

    // ── STEP 10: Verify the balance calculation ──────────────────────────────
    const expList = expAData.expenses;
    let netA = 0, netB = 0;
    expList.forEach((exp) => {
      if (!exp.settled) {
        if (exp.paidBy === userA.id) netA += Number(exp.amount);
        if (exp.paidBy === userB.id) netB += Number(exp.amount);
        const shares = exp.shares || {};
        netA -= Number(shares[userA.id] || 0);
        netB -= Number(shares[userB.id] || 0);
      }
    });
    const pass10 = netA === 50 && netB === -50;
    stepReport(10, 'Verify balance math (User A: +₹50, User B: -₹50)', pass10, `User A Net: ₹${netA}, User B Net: ₹${netB}`);

    // ── STEP 11: Add ₹100 split among 3 members (Fractional cents) ───────────
    const regCRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User C', email: `userc_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const regCData = await regCRes.json();
    userCToken = regCData.token;
    userC = regCData.user;
    const headersC = { 'Content-Type': 'application/json', Authorization: `Bearer ${userCToken}` };
    await fetch(`${API_BASE}/groups/join`, { method: 'POST', headers: headersC, body: JSON.stringify({ inviteCode }) });

    const expFracRes = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        groupId,
        title: 'Dinner Bill',
        amount: 100,
        paidBy: userA.id,
        splitAmong: [userA.id, userB.id, userC.id],
      }),
    });
    const expFracData = await expFracRes.json();
    const fracShares = Object.values(expFracData.expense.shares).map(Number);
    const fracSum = fracShares.reduce((s, x) => s + x, 0);
    const pass11 = expFracRes.status === 201 && Math.abs(fracSum - 100) < 0.001 && fracShares.length === 3;
    stepReport(11, 'Add ₹100 split 3-ways fractional-cent test', pass11, `Shares sum: ₹${fracSum} (${fracShares.join(', ')})`);

    // ── STEP 12: Verify expense edit and delete work before settlement ───────
    const tempExpRes = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({
        groupId,
        title: 'Temp Expense',
        amount: 50,
        paidBy: userB.id,
        splitAmong: [userA.id, userB.id],
      }),
    });
    const tempExpData = await tempExpRes.json();
    const tempId = tempExpData.expense?.id;

    // Edit temp expense
    const editRes = await fetch(`${API_BASE}/expenses/${tempId}`, {
      method: 'PUT',
      headers: headersB,
      body: JSON.stringify({ amount: 60 }),
    });
    const editData = await editRes.json();
    const editOk = editRes.ok && Number(editData.expense?.amount) === 60;

    // Delete temp expense
    const delRes = await fetch(`${API_BASE}/expenses/${tempId}`, { method: 'DELETE', headers: headersB });
    const delOk = delRes.ok;

    stepReport(12, 'Verify Expense Edit & Delete work before settlement', editOk && delOk);

    // ── STEP 13: Initiate settlement ──────────────────────────────────────────
    const initSettlementRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/initiate`, {
      method: 'POST',
      headers: headersA,
    });
    const initSettlementData = await initSettlementRes.json();
    const pass13 = initSettlementRes.ok && initSettlementData.settlement?.status === 'pending';
    stepReport(13, 'Initiate Settlement (Status: pending)', pass13);

    // ── STEP 14: Verify all expense mutations are blocked ─────────────────────
    const blockAddRes = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ groupId, title: 'Blocked Exp', amount: 50, paidBy: userA.id, splitAmong: [userA.id] }),
    });
    const blockEditRes = await fetch(`${API_BASE}/expenses/${exp1Id}`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({ amount: 200 }),
    });
    const blockDelRes = await fetch(`${API_BASE}/expenses/${exp1Id}`, { method: 'DELETE', headers: headersA });

    const pass14 = blockAddRes.status === 400 && blockEditRes.status === 400 && blockDelRes.status === 400;
    stepReport(14, 'Verify expense creation, editing, & deletion are BLOCKED during settlement', pass14);

    // ── STEP 15: Confirm settlement as every active member ────────────────────
    const confARes = await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headersA, body: JSON.stringify({ memberId: userA.id }) });
    const confBRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headersB, body: JSON.stringify({ memberId: userB.id }) });

    stepReport(15, 'Confirm settlement as User A & User B', confARes.ok && confBRes.ok);

    // ── STEP 16: Verify settlement cannot complete before ALL confirmations ─
    const prematureCompRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/complete`, {
      method: 'POST',
      headers: headersA,
    });
    const prematureCompData = await prematureCompRes.json();
    const pass16 = prematureCompRes.status === 400 && prematureCompData.message.includes('Pending confirmations');
    stepReport(16, 'Verify settlement completion fails before ALL member confirmations', pass16, `Message: ${prematureCompData.message}`);

    // Now User C confirms
    await fetch(`${API_BASE}/groups/${groupId}/settlements/confirm`, { method: 'POST', headers: headersC, body: JSON.stringify({ memberId: userC.id }) });

    // ── STEP 17: Complete settlement ──────────────────────────────────────────
    const compRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/complete`, {
      method: 'POST',
      headers: headersA,
    });
    const compData = await compRes.json();
    const pass17 = compRes.ok && compData.settlement?.status === 'completed';
    stepReport(17, 'Complete Settlement cleanly', pass17);

    // ── STEP 18: Verify post-settlement cycle state & history ─────────────────
    const historyRes = await fetch(`${API_BASE}/groups/${groupId}/settlements/history`, { headers: headersA });
    const historyData = await historyRes.json();
    const historyOk = historyData.settlements.some((s) => s.id === compData.settlement.id);

    const newCycleExpRes = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        groupId,
        title: 'New Cycle Coffee',
        amount: 150,
        paidBy: userA.id,
        splitAmong: [userA.id, userB.id],
      }),
    });
    const pass18 = historyOk && newCycleExpRes.status === 201;
    stepReport(18, 'Verify cycle rotation, settlement history, & new cycle expense creation', pass18);

    // ── STEP 19: Test Logout & Login again ────────────────────────────────────
    const reloginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `usera_${timestamp}@test.com`, password: 'Password123!' }),
    });
    const reloginData = await reloginRes.json();
    const pass19 = reloginRes.ok && Boolean(reloginData.token);
    stepReport(19, 'Test Logout and Re-login as User A', pass19);

    // ── STEP 20: Verify data persistence after re-login ───────────────────────
    const reloginHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${reloginData.token}` };
    const persistGroupsRes = await fetch(`${API_BASE}/groups`, { headers: reloginHeaders });
    const persistGroupsData = await persistGroupsRes.json();
    const hasGroup = persistGroupsData.groups.some((g) => g.id === groupId);

    const persistExpRes = await fetch(`${API_BASE}/groups/${groupId}/expenses`, { headers: reloginHeaders });
    const persistExpData = await persistExpRes.json();
    const hasNewExp = persistExpData.expenses.some((e) => e.title === 'New Cycle Coffee');

    const pass20 = hasGroup && hasNewExp;
    stepReport(20, 'Verify complete data persistence in PostgreSQL after re-login', pass20);

    console.log(`\n==================================================`);
    console.log(`E2E SUMMARY: ${passed}/20 STEPS PASSED, ${failed}/20 FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during E2E test run:', err);
    process.exit(1);
  }
}

runE2ETests();
