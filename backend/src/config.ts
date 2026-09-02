import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend directory and root directory fallback
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export interface Config {
  PORT: number;
  NODE_ENV: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
}

export const config: Config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};

