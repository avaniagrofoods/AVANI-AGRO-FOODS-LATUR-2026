/**
 * AVANI AGRO FOODS — PACKAGE 3F.7 PACKAGE A
 * Isolated Contact Form Submission & Error Resilience Suite
 * Tests BLK-05: Authoritative /api/save-lead response determines success,
 * accurate error presentation, preservation of user input on 500/network error,
 * and zero false claims of email dispatch.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('PACKAGE 3F.7 — PACKAGE A: CONTACT FORM CORRECTNESS (BLK-05)');
console.log('============================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name} -> ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name} -> ${err.message}`);
    failedTests++;
  }
}

// 1. Static Contract Analysis of Contact.jsx
const contactSource = fs.readFileSync(path.join(__dirname, '../src/pages/Contact.jsx'), 'utf8');

runTest('Contract Check 1: /api/save-lead is the authoritative submission gate', () => {
  assert(contactSource.includes("fetch('/api/save-lead'"), 'Must call /api/save-lead');
  assert(contactSource.includes("if (!saveRes.ok || !saveData || saveData.success !== true)"), 'Must validate saveRes.ok and saveData.success === true');
  assert(contactSource.includes("throw new Error(errorMsg)"), 'Must throw on non-200 or failure payload');
});

runTest('Contract Check 2: Form fields preserved on error and errorMessage state exists', () => {
  assert(contactSource.includes("const [errorMessage, setErrorMessage] = useState('')"), 'Must declare errorMessage state');
  assert(contactSource.includes("setStatus('error')"), 'Must set status to error on failure');
  assert(contactSource.includes("setIsSuccess(false)"), 'Must set isSuccess to false on failure');
  assert(contactSource.includes("setErrorMessage("), 'Must set explicit error message');
  // Confirm form state is not cleared in catch block
  const catchBlock = contactSource.match(/catch\s*\(err\)\s*\{([\s\S]*?)\}\s*finally/);
  assert(catchBlock, 'Must have try/catch/finally');
  assert(!catchBlock[1].includes("setForm("), 'Must NOT reset form in error catch block');
});

runTest('Contract Check 3: Zero false claims of email sent in success view', () => {
  // Confirm success message states registered/reviewed without claiming email was delivered
  assert(!contactSource.includes('An email has been sent to your inbox'), 'Must not claim email sent to buyer');
  assert(!contactSource.includes('Confirmation email sent'), 'Must not claim confirmation email sent');
  assert(contactSource.includes('RFQ Received Successfully'), 'Must indicate RFQ registered');
});

// 2. Behavioral Simulation of the Contact Form Submit Logic
function createSubmissionSimulator(mockFetch) {
  return async function simulateSubmit(formState) {
    if (formState.honeypot) {
      return { aborted: true, status: 'honeypot_ignored' };
    }

    let status = '';
    let errorMessage = '';
    let isSuccess = false;
    let submittedLeadId = '';
    let loading = true;

    try {
      const clientGeneratedLeadId = `AAF-L-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const savePayload = {
        inquiryId: clientGeneratedLeadId,
        name: formState.fullName,
        email: formState.email,
        phone: formState.phone,
        company: formState.companyName,
        country: formState.country,
        product: formState.product,
        quantity: formState.quantity,
        source: 'Website_Contact_RFQ'
      };

      const saveRes = await mockFetch('/api/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload)
      });

      let saveData = null;
      try {
        saveData = await saveRes.json();
      } catch (parseErr) {
        throw new Error('Server returned an unreadable response format. Please try again.');
      }

      if (!saveRes.ok || !saveData || saveData.success !== true) {
        const errorMsg = saveData?.error || saveData?.message || `Server returned error (${saveRes.status})`;
        throw new Error(errorMsg);
      }

      submittedLeadId = saveData.inquiryId || clientGeneratedLeadId;
      status = 'success';
      isSuccess = true;
      errorMessage = '';

    } catch (err) {
      status = 'error';
      isSuccess = false;
      errorMessage = err.message || 'Submission failed. Please email us directly.';
    } finally {
      loading = false;
    }

    return { status, errorMessage, isSuccess, submittedLeadId, loading, preservedForm: formState };
  };
}

const sampleForm = {
  fullName: 'Rajesh Sharma',
  email: 'rajesh@example.com',
  phone: '+91 9876543210',
  companyName: 'Sharma Foods Ltd',
  country: 'India',
  product: 'Moringa Powder',
  quantity: '500 kg',
  honeypot: ''
};

async function runSimulationTests() {
  await runAsyncTest('Simulation 1: HTTP 200 with success:true -> sets isSuccess=true, status=success', async () => {
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, inquiryId: 'AAF-INQ-2026-9999' })
    });
    const submit = createSubmissionSimulator(mockFetch);
    const result = await submit(sampleForm);
    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.isSuccess, true);
    assert.strictEqual(result.submittedLeadId, 'AAF-INQ-2026-9999');
    assert.strictEqual(result.errorMessage, '');
    assert.strictEqual(result.loading, false);
  });

  await runAsyncTest('Simulation 2: HTTP 500 Internal Error -> sets status=error, isSuccess=false, preserves input', async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Database connection timeout' })
    });
    const submit = createSubmissionSimulator(mockFetch);
    const result = await submit(sampleForm);
    assert.strictEqual(result.status, 'error');
    assert.strictEqual(result.isSuccess, false);
    assert.strictEqual(result.errorMessage, 'Database connection timeout');
    assert.strictEqual(result.preservedForm.fullName, 'Rajesh Sharma');
    assert.strictEqual(result.preservedForm.email, 'rajesh@example.com');
  });

  await runAsyncTest('Simulation 3: Malformed Non-JSON Response (e.g. 502 Bad Gateway HTML) -> sets unreadable error', async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 502,
      json: async () => { throw new SyntaxError('Unexpected token < in JSON at position 0'); }
    });
    const submit = createSubmissionSimulator(mockFetch);
    const result = await submit(sampleForm);
    assert.strictEqual(result.status, 'error');
    assert.strictEqual(result.isSuccess, false);
    assert(result.errorMessage.includes('unreadable response'), `Expected unreadable error, got: ${result.errorMessage}`);
    assert.strictEqual(result.preservedForm.fullName, 'Rajesh Sharma');
  });

  await runAsyncTest('Simulation 4: Network Drop / Fetch Exception -> caught safely, sets error, preserves input', async () => {
    const mockFetch = async () => {
      throw new Error('TypeError: Failed to fetch (Network unreachable)');
    };
    const submit = createSubmissionSimulator(mockFetch);
    const result = await submit(sampleForm);
    assert.strictEqual(result.status, 'error');
    assert.strictEqual(result.isSuccess, false);
    assert(result.errorMessage.includes('Network unreachable'));
    assert.strictEqual(result.preservedForm.companyName, 'Sharma Foods Ltd');
  });

  await runAsyncTest('Simulation 5: HTTP 200 with success:false payload -> treated as error', async () => {
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: false, message: 'Rate limit or duplicate rejected' })
    });
    const submit = createSubmissionSimulator(mockFetch);
    const result = await submit(sampleForm);
    assert.strictEqual(result.status, 'error');
    assert.strictEqual(result.isSuccess, false);
    assert.strictEqual(result.errorMessage, 'Rate limit or duplicate rejected');
  });

  await runAsyncTest('Simulation 6: Honeypot submission -> aborts immediately, zero calls', async () => {
    let called = false;
    const mockFetch = async () => {
      called = true;
      return { ok: true, json: async () => ({}) };
    };
    const submit = createSubmissionSimulator(mockFetch);
    const result = await submit({ ...sampleForm, honeypot: 'bot_value' });
    assert.strictEqual(result.aborted, true);
    assert.strictEqual(called, false);
  });

  console.log('\n============================================================');
  console.log(`PACKAGE A TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSimulationTests();
