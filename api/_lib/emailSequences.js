// ============================================================
// AVANI AGRO FOODS — Production Email Sequences & Positioning Model
// api/_lib/emailSequences.js
// Phase 3I: Autonomous Remediation & Sequence Architecture
//
// Positioning Rules:
// - "Export Trade Co-Ordinator"
// - "Indian sourcing and export coordination partner"
// - "Coordinates sourcing from qualified Indian manufacturing and processing partners."
// - "Specification, capacity and documentation are subject to confirmation with the manufacturing/processing partner."
// - ZERO claims of manufacturer, factory, farmer, certified producer, guaranteed pricing/capacity.
//
// Sequence Architecture: EXACTLY FIVE SEQUENCES (SEQ-01 to SEQ-05)
// SEQ-01: Initial Introduction
// SEQ-02: Specification / Requirement Follow-Up (+72h)
// SEQ-03: Sourcing / Sample / COA Follow-Up (+72h)
// SEQ-04: Value / Requirement Clarification Follow-Up (+72h)
// SEQ-05: Polite Close / Thank-You Message (+72h) -> COMPLETED
// ============================================================

export const SENDER_IDENTITY = {
  name: 'AVANI AGRO FOODS',
  email: 'sales@avaniagrofoods.com',
  formatted: 'AVANI AGRO FOODS <sales@avaniagrofoods.com>',
  replyTo: 'sales@avaniagrofoods.com',
  website: 'https://www.avaniagrofoods.com',
  contactPerson: 'Sachin Shinde',
  designation: 'Export Trade Co-Ordinator',
  approvedAddress: 'AVANI AGRO FOODS, Old Barshi Road, 5 No Chauk, KulswaminiNagar, Next to Sai School, Latur-413512, Maharashtra, India',
  phone: '+91 7219053645'
};

export const EMAIL_SEQUENCES = {
  'SEQ-01': {
    sequenceId: 'SEQ-01',
    sequenceNumber: 1,
    name: 'Initial Sourcing Introduction',
    step: 'EMAIL_1',
    timingHours: 0,
    subject: 'Indian Origin Sourcing Coordination: {{product_focus}} Specifications for {{company_name}}',
    previewText: 'B2B export coordination for Indian agricultural ingredients',
    cta: 'Request technical data sheet or share intake specifications',
    bodyText: `Dear {{contact_name}},

I am reaching out from Avani Agro Foods, based in Latur, Maharashtra, India. We operate as an Export Trade Co-Ordinator and Indian sourcing and export coordination partner for agricultural ingredients.

Given {{company_name}}'s focus on importing and distributing quality agricultural commodities, we assist international buyers in coordinating direct origin sourcing from qualified Indian manufacturing and processing partners.

Our core coordinated ingredients include:
- Moringa Oleifera Leaf Powder (shadow-dried, 80-100 mesh, lab-verified microbiology)
- Dehydrated Red Onion Powder (high pungency, low moisture, processed for industrial food blending)

Specification, capacity, and documentation are subject to confirmation with the manufacturing/processing partner for each production lot.

If you are currently reviewing origin sources or open to comparing lot specifications, we would be glad to share:
- Certificate of Analysis (COA) and microbiological parameters
- Available export packaging options
- Representative lab samples for quality evaluation

Please let us know your standard specification requirements or if we may provide a technical data sheet for your review.

Sincerely,
Sachin Shinde
Avani Agro Foods
Export Trade Co-Ordinator
Old Barshi Road, 5 No Chauk, KulswaminiNagar, Next to Sai School, Latur-413512, Maharashtra, India
Phone: +91 7219053645 | Web: www.avaniagrofoods.com

Opt-out: If you prefer not to receive commercial sourcing proposals, please reply with 'UNSUBSCRIBE' and your address will be permanently removed.`,
    allowedAudience: 'Eligible B2B Importers & Sourcing Executives',
    stopConditions: ['REPLY_DETECTED', 'OPT_OUT', 'BOUNCE', 'COMPLAINT', 'GLOBAL_STOP', 'UNAUTHORIZED']
  },

  'SEQ-02': {
    sequenceId: 'SEQ-02',
    sequenceNumber: 2,
    name: 'Specification & Requirement Follow-Up',
    step: 'EMAIL_2',
    timingHours: 72,
    subject: 'Follow-up: Specification & Intake Parameters for {{company_name}}',
    previewText: 'Confirming specification and intake criteria with processing partners',
    cta: 'Share intake specifications or quality parameters',
    bodyText: `Dear {{contact_name}},

I am following up on my previous note regarding Indian origin sourcing coordination for {{product_focus}}.

As an Export Trade Co-Ordinator, Avani Agro Foods helps international procurement teams align specific physical, chemical, and microbiological requirements with audited processing partners in Maharashtra, India.

To ensure any proposal aligns with {{company_name}}'s standards:
- Do your current product lines require conventional or certified organic grade?
- What particle size / mesh and moisture parameters do your intake facilities require?
- Are there specific destination port requirements (e.g., CIF / FOB terms)?

Specification, capacity, and documentation are subject to confirmation with the manufacturing/processing partner.

If helpful, we can forward a representative Certificate of Analysis (COA) from recent partner production runs.

Best regards,
Sachin Shinde
Avani Agro Foods
Export Trade Co-Ordinator
Old Barshi Road, 5 No Chauk, KulswaminiNagar, Next to Sai School, Latur-413512, Maharashtra, India
Phone: +91 7219053645 | Web: www.avaniagrofoods.com

Opt-out: To unsubscribe from future sourcing communications, simply reply with 'UNSUBSCRIBE'.`,
    allowedAudience: 'Active SEQ-01 Recipients with No Reply after 72h',
    stopConditions: ['REPLY_DETECTED', 'OPT_OUT', 'BOUNCE', 'COMPLAINT', 'GLOBAL_STOP', 'UNAUTHORIZED']
  },

  'SEQ-03': {
    sequenceId: 'SEQ-03',
    sequenceNumber: 3,
    name: 'Evaluation Samples & COA Review',
    step: 'EMAIL_3',
    timingHours: 72,
    subject: 'Sample Evaluation & Laboratory Analysis for {{company_name}}',
    previewText: 'Lab evaluation samples and batch test data directly from origin',
    cta: 'Request physical evaluation samples',
    bodyText: `Dear {{contact_name}},

I wanted to quickly check whether {{company_name}}'s procurement desk would be interested in receiving a laboratory evaluation sample for {{product_focus}}.

As an Indian sourcing and export coordination partner, Avani Agro Foods coordinates sample dispatches directly from partner processing facilities so your quality assurance team can independently verify:
- Aroma, color, and particle size consistency
- Moisture content and physical parameters
- Independent third-party microbiological and heavy metal lab reports

Specification, capacity, and documentation are subject to confirmation with the manufacturing/processing partner.

If you would like to test a representative sample, simply reply with your preferred shipping address and contact details, and we will coordinate courier dispatch.

Sincerely,
Sachin Shinde
Avani Agro Foods
Export Trade Co-Ordinator
Old Barshi Road, 5 No Chauk, KulswaminiNagar, Next to Sai School, Latur-413512, Maharashtra, India
Phone: +91 7219053645 | Web: www.avaniagrofoods.com

Opt-out: If you do not wish to receive sourcing introductions, reply with 'UNSUBSCRIBE'.`,
    allowedAudience: 'Active SEQ-02 Recipients with No Reply after 72h',
    stopConditions: ['REPLY_DETECTED', 'OPT_OUT', 'BOUNCE', 'COMPLAINT', 'GLOBAL_STOP', 'UNAUTHORIZED']
  },

  'SEQ-04': {
    sequenceId: 'SEQ-04',
    sequenceNumber: 4,
    name: 'Procurement Timing & Requirement Clarification',
    step: 'EMAIL_4',
    timingHours: 72,
    subject: 'Procurement Review: Indian Ingredient Sourcing for {{company_name}}',
    previewText: 'Aligning origin coordination with your upcoming buying calendar',
    cta: 'Clarify seasonal procurement schedule or direct to relevant buyer',
    bodyText: `Dear {{contact_name}},

I understand this may be a busy procurement period for {{company_name}}.

As an Export Trade Co-Ordinator connecting global importers with qualified Indian agricultural processors, our objective is simply to understand if origin ingredient sourcing from India is on your roadmap for upcoming buying cycles.

If you have existing contract commitments or are not currently reviewing suppliers for {{product_focus}}, please feel free to let us know. We are happy to align with your seasonal review calendar.

Specification, capacity, and documentation are subject to confirmation with the manufacturing/processing partner.

Would it be better to reconnect next quarter, or is there another department head we should address regarding commercial specifications?

Best regards,
Sachin Shinde
Avani Agro Foods
Export Trade Co-Ordinator
Old Barshi Road, 5 No Chauk, KulswaminiNagar, Next to Sai School, Latur-413512, Maharashtra, India
Phone: +91 7219053645 | Web: www.avaniagrofoods.com

Opt-out: To opt out of future B2B trade inquiries, reply with 'UNSUBSCRIBE'.`,
    allowedAudience: 'Active SEQ-03 Recipients with No Reply after 72h',
    stopConditions: ['REPLY_DETECTED', 'OPT_OUT', 'BOUNCE', 'COMPLAINT', 'GLOBAL_STOP', 'UNAUTHORIZED']
  },

  'SEQ-05': {
    sequenceId: 'SEQ-05',
    sequenceNumber: 5,
    name: 'Polite Close & Thank-You Message',
    step: 'EMAIL_5',
    timingHours: 72,
    subject: 'Thank you from Avani Agro Foods — Keeping in Touch',
    previewText: 'Closing our outreach with gratitude and keeping communication channels open',
    cta: 'Reconnect when sourcing needs arise',
    bodyText: `Dear {{contact_name}},

Thank you very much for your time and consideration over the past few weeks.

I recognize that {{company_name}} may not currently have an active requirement for Indian origin agricultural ingredients, or that your existing supply arrangements are well established.

We will pause our outreach and will not send further automated follow-ups.

Should your sourcing requirements evolve, or if you ever need origin pricing benchmarks, technical specifications, or sample lots for Moringa Oleifera leaf powder or Dehydrated Red Onion powder from India, our door remains open.

Specification, capacity, and documentation are subject to confirmation with the manufacturing/processing partner.

You can reach me directly at sales@avaniagrofoods.com or visit www.avaniagrofoods.com whenever convenient.

Thank you again for your time, and we wish {{company_name}} continued success.

Warm regards,
Sachin Shinde
Avani Agro Foods
Export Trade Co-Ordinator
Old Barshi Road, 5 No Chauk, KulswaminiNagar, Next to Sai School, Latur-413512, Maharashtra, India
Phone: +91 7219053645 | Web: www.avaniagrofoods.com

Opt-out: To ensure you receive no further communications, reply with 'UNSUBSCRIBE'.`,
    allowedAudience: 'Active SEQ-04 Recipients with No Reply after 72h',
    stopConditions: ['SEQUENCE_COMPLETED', 'NO_FURTHER_AUTOMATION']
  }
};

// Backward Compatibility Mapping for T01 - T07
export const LEGACY_TEMPLATE_MAP = {
  T01: { sequenceId: 'SEQ-01', productFocus: 'Moringa Oleifera Leaf Powder' },
  T02: { sequenceId: 'SEQ-01', productFocus: 'Moringa Oleifera Leaf Powder' },
  T03: { sequenceId: 'SEQ-01', productFocus: 'Dehydrated Red Onion Powder' },
  T04: { sequenceId: 'SEQ-01', productFocus: 'Dehydrated Red Onion Powder' },
  T05: { sequenceId: 'SEQ-01', productFocus: 'Moringa & Dehydrated Red Onion Powder' },
  T06: { sequenceId: 'SEQ-01', productFocus: 'Agricultural Ingredients (Moringa & Onion)' },
  T07: { sequenceId: 'SEQ-01', productFocus: 'Organic Moringa & Dehydrated Alliums' }
};

export function renderSequenceEmail(sequenceId, variables = {}) {
  const seq = EMAIL_SEQUENCES[sequenceId];
  if (!seq) {
    throw new Error(`Invalid sequence ID: ${sequenceId}`);
  }

  const contactName = variables.contact_name || variables.contactPerson || 'Procurement Executive';
  const companyName = variables.company_name || variables.companyName || 'your organization';
  const productFocus = variables.product_focus || variables.product || 'Moringa & Dehydrated Red Onion Powder';

  let subject = seq.subject
    .replace(/\{\{contact_name\}\}/g, contactName)
    .replace(/\{\{company_name\}\}/g, companyName)
    .replace(/\{\{product_focus\}\}/g, productFocus);

  let body = seq.bodyText
    .replace(/\{\{contact_name\}\}/g, contactName)
    .replace(/\{\{company_name\}\}/g, companyName)
    .replace(/\{\{product_focus\}\}/g, productFocus);

  return {
    sequenceId: seq.sequenceId,
    sequenceNumber: seq.sequenceNumber,
    step: seq.step,
    from: SENDER_IDENTITY.formatted,
    to: variables.email || variables.recipient_email,
    replyTo: SENDER_IDENTITY.replyTo,
    subject,
    bodyText: body,
    cta: seq.cta,
    timingHours: seq.timingHours
  };
}
