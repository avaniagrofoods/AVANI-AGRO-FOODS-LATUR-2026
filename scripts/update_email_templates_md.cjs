const fs = require('fs');
const path = require('path');

const rootFile = path.join(__dirname, '..', 'PHASE_3F_EMAIL_TEMPLATES.md');
const brainFile = 'C:\\Users\\ALPHA-1\\.gemini\\antigravity\\brain\\c47ae283-a95c-4ba0-90ce-6297b044189f\\PHASE_3F_EMAIL_TEMPLATES.md';

let content = fs.readFileSync(rootFile, 'utf8');

// Replace address
content = content.replace(/Old Barshi Road, KulswaminiNagar, 5 No Chauk, Next to Sai School, Latur-413512, Maharashtra, India/g, 'Old Barshi Road, 5 No Chauk, KulswaminiNagar, Next to Sai School, Latur-413512, Maharashtra, India');

// Replace signature to include Export Trade Co-Ordinator
content = content.replace(/Avani Agro Foods\r?\nOld Barshi Road/g, 'Avani Agro Foods\nExport Trade Co-Ordinator\nOld Barshi Road');

const { EMAIL_SEQUENCES } = require('../api/_lib/emailSequences.js');

let seqDoc = '\n---\n\n# AVANI AGRO FOODS — PHASE 3I FIVE PRODUCTION EMAIL SEQUENCES (SEQ-01 to SEQ-05)\n' +
  '**Governance:** Strict B2B Sourcing Propositions | Export Trade Co-Ordinator Positioning | Reply Stops Follow-up | 72h Follow-up Delay\n\n' +
  '### Sequence Architecture:\n' +
  '- **SEQ-01 (EMAIL 1):** Initial Sourcing Introduction (Day 0)\n' +
  '- **SEQ-02 (EMAIL 2):** Specification & Requirement Follow-Up (+72h if no reply)\n' +
  '- **SEQ-03 (EMAIL 3):** Evaluation Samples & COA Review (+72h if no reply)\n' +
  '- **SEQ-04 (EMAIL 4):** Procurement Timing & Requirement Clarification (+72h if no reply)\n' +
  '- **SEQ-05 (EMAIL 5):** Polite Close & Thank-You Message (+72h if no reply) -> `sequence_status = COMPLETED`\n\n';

Object.values(EMAIL_SEQUENCES).forEach(seq => {
  seqDoc += `## Sequence ${seq.sequenceId}: ${seq.name}\n` +
    `- **Sequence Number:** ${seq.sequenceNumber} (${seq.step})\n` +
    `- **Timing:** ${seq.timingHours === 0 ? 'Day 0 (Initial Dispatch)' : `+${seq.timingHours} hours after previous step if no reply`}\n` +
    `- **Subject:** \`${seq.subject}\`\n` +
    `- **Preview Text:** \`${seq.previewText}\`\n` +
    `- **CTA:** ${seq.cta}\n` +
    `- **Stop Conditions:** ${seq.stopConditions.join(', ')}\n\n` +
    '```text\n' +
    seq.bodyText + '\n' +
    '```\n\n---\n\n';
});

if (!content.includes('PHASE 3I FIVE PRODUCTION EMAIL SEQUENCES')) {
  content += seqDoc;
}

fs.writeFileSync(rootFile, content, 'utf8');
if (fs.existsSync(path.dirname(brainFile))) {
  fs.writeFileSync(brainFile, content, 'utf8');
}
console.log('Successfully updated PHASE_3F_EMAIL_TEMPLATES.md');
