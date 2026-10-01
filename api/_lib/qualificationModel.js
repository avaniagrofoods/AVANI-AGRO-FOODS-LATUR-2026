// ============================================================
// AVANI AGRO FOODS — SERVERLESS QUALIFICATION MODEL BRIDGE
// Re-exports from src/data/qualificationModel.js
// ============================================================

export * from '../../src/data/qualificationModel.js';

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  const model = require('../../src/data/qualificationModel.js');
  module.exports = model;
}
