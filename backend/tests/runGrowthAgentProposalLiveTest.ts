import dotenv from 'dotenv';
import path from 'path';
import { runGrowthAgent } from '../src/agent/runGrowthAgent.js';

// Load .env from repository root
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // Fallback if run from repo root directly

async function main() {
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new Error('Neither GROQ_API_KEY nor OPENAI_API_KEY is configured in .env');
  }

  console.log('--- START GROWTH AGENT NEGOTIATION & PROPOSAL LIVE TEST ---');
  const userQuery = 'I want to buy the HW-LAPTOP and the HW-DOCK accessory. Can you give me a bundle discount for ₹85,000 total and create a formal purchase proposal for me?';
  console.log(`Buyer Query: "${userQuery}"\n`);

  const response = await runGrowthAgent(userQuery);
  console.log('--- AGENT RESPONSE ---');
  console.log(response);
  console.log('\n--- END GROWTH AGENT NEGOTIATION & PROPOSAL LIVE TEST ---');
}

main().catch((err) => {
  console.error('Execution failed:', err.message || err);
  process.exit(1);
});
