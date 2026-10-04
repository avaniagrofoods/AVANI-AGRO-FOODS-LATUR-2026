const fs = require('fs');
const path = require('path');

console.log('--- TEST 5: PHASE 3F TEMPLATE MAPPING & COMPLIANCE ---');

const brainDir = 'C:\\Users\\ALPHA-1\\.gemini\\antigravity\\brain\\c47ae283-a95c-4ba0-90ce-6297b044189f';
const templates = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_EMAIL_TEMPLATE_MATRIX.json'), 'utf8'));
const segData = JSON.parse(fs.readFileSync(path.join(brainDir, 'PHASE_3F_SEGMENT_MAPPING.json'), 'utf8'));

// Verify all 7 templates exist
const requiredTemplates = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07'];
requiredTemplates.forEach(tId => {
  if (!templates[tId]) throw new Error(`Template ${tId} is missing from template matrix!`);
});

// Check template content compliance using word boundaries
const prohibitedPatterns = [
  /\bbest price\b/i,
  /\bbest quality\b/i,
  /\bguaranteed\b/i,
  /\bleading exporter\b/i,
  /\blargest\b/i,
  /\bdetox\b/i,
  /\bcure\b/i,
  /\bmedical\b/i
];

Object.values(templates).forEach(t => {
  const body = t.bodyText;
  prohibitedPatterns.forEach(pattern => {
    if (pattern.test(body)) {
      throw new Error(`Template ${t.templateId} contains prohibited pattern: ${pattern}`);
    }
  });

  const bodyLower = body.toLowerCase();
  if (!bodyLower.includes('latur') || !bodyLower.includes('maharashtra') || !bodyLower.includes('india')) {
    throw new Error(`Template ${t.templateId} missing physical business address!`);
  }

  if (!bodyLower.includes('unsubscribe') && !bodyLower.includes('opt-out')) {
    throw new Error(`Template ${t.templateId} missing unsubscribe mechanism!`);
  }
});

// Verify all 16 records have valid template assignments
segData.forEach(r => {
  if (!requiredTemplates.includes(r.templateId)) {
    throw new Error(`Record ${r.recordId} has invalid template assignment: ${r.templateId}`);
  }
});

console.log('[PASS] Templates T01-T07 verified compliant with zero prohibited claims.');
