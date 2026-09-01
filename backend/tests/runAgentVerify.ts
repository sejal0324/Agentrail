import { runGrowthAgent } from '../src/agent/runGrowthAgent.js';
import { growthAgent } from '../src/agent/growthAgent.js';

async function runExecutionModuleVerification() {
  console.log('--- START RUN GROWTH AGENT EXECUTION MODULE VERIFICATION ---');

  // 1. Verify function exports
  if (typeof runGrowthAgent !== 'function') {
    throw new Error('runGrowthAgent is not exported as a function');
  }
  console.log('1. runGrowthAgent function export verified.');

  // 2. Verify agent association
  if (growthAgent.name !== 'AgentRail Growth Agent') {
    throw new Error(`Expected agent name 'AgentRail Growth Agent', got '${growthAgent.name}'`);
  }
  console.log('2. growthAgent association verified.');

  console.log('\n--- EXECUTION MODULE VERIFICATION PASSED ---');
}

runExecutionModuleVerification().catch((err) => {
  console.error('\nVerification Failed with Error:', err.message);
  process.exit(1);
});
