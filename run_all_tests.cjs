const { execSync } = require('child_process');

const scripts = [
  'scripts/test_phase_3f_authorization_gate.cjs',
  'scripts/test_phase_3f_dry_run.cjs',
  'scripts/test_phase_3f_duplicates.cjs',
  'scripts/test_phase_3f_integrity.cjs',
  'scripts/test_phase_3f_suppression.cjs',
  'scripts/test_phase_3f_template_mapping.cjs',
  'scripts/test_phase_3g_all.cjs',
  'scripts/test_phase_3h_preflight.cjs',
  'scripts/test_p2_verification_readiness.cjs',
  'scripts/test_phase_3i_sequences.cjs',
  'scripts/test_phase_3j_remediation.cjs',
  'scripts/test_phase_3k_webhook.cjs'
];

let failed = false;

for (const script of scripts) {
  console.log(`Running ${script}...`);
  try {
    execSync(`node ${script}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Script ${script} failed.`);
    failed = true;
    break;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
