import { validateSplitMatesQR } from '../src/utils/qrValidation.js';

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

function runQRValidationUnitTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING STRICT QR VALIDATION UNIT TESTS');
  console.log('====================================================\n');

  // Test 1: Valid SplitMates Join URL
  console.log('1️⃣ Testing Valid SplitMates Join URL...');
  const res1 = validateSplitMatesQR('https://splitmates.app/join/7F3A9B');
  assertEquals(res1.isValid, true, 'Valid URL is accepted');
  assertEquals(res1.inviteCode, '7F3A9B', 'Extracted invite code is 7F3A9B');
  console.log('   ✅ Valid URL test passed!');

  // Test 2: Valid Custom Scheme (splitly://join/XYZ999)
  console.log('\n2️⃣ Testing Valid Custom Scheme URI...');
  const res2 = validateSplitMatesQR('splitly://join/XYZ999');
  assertEquals(res2.isValid, true, 'Custom scheme is accepted');
  assertEquals(res2.inviteCode, 'XYZ999', 'Extracted custom scheme code');
  console.log('   ✅ Custom scheme test passed!');

  // Test 3: Valid Standalone Invite Code
  console.log('\n3️⃣ Testing Standalone Invite Code...');
  const res3 = validateSplitMatesQR('7F3A9B');
  assertEquals(res3.isValid, true, 'Standalone code is accepted');
  assertEquals(res3.inviteCode, '7F3A9B', 'Extracted code');
  console.log('   ✅ Standalone code test passed!');

  // Test 4: REJECT Google URL
  console.log('\n4️⃣ Testing Invalid Google URL rejection...');
  const res4 = validateSplitMatesQR('https://google.com');
  assertEquals(res4.isValid, false, 'Google URL is rejected locally');
  assertEquals(res4.errorTitle, 'Invalid SplitMates QR', 'Rejection error title');
  console.log('   ✅ Google URL rejection passed!');

  // Test 5: REJECT UPI Payment QR
  console.log('\n5️⃣ Testing Invalid UPI Payment QR rejection...');
  const res5 = validateSplitMatesQR('upi://pay?pa=test@upi&pn=Store&am=500');
  assertEquals(res5.isValid, false, 'UPI payment QR rejected locally');
  console.log('   ✅ UPI payment QR rejection passed!');

  // Test 6: REJECT WiFi QR
  console.log('\n6️⃣ Testing Invalid WiFi QR rejection...');
  const res6 = validateSplitMatesQR('WIFI:S:MyNetwork;T:WPA;P:secret123;;');
  assertEquals(res6.isValid, false, 'WiFi QR rejected locally');
  console.log('   ✅ WiFi QR rejection passed!');

  // Test 7: REJECT Arbitrary Text / Sentence
  console.log('\n7️⃣ Testing Invalid Random Text rejection...');
  const res7 = validateSplitMatesQR('Hello world this is a random text QR code');
  assertEquals(res7.isValid, false, 'Random text rejected locally');
  console.log('   ✅ Random text rejection passed!');

  console.log('\n====================================================');
  console.log('🎉 ALL QR VALIDATION UNIT TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runQRValidationUnitTests();
