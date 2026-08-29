import dotenv from 'dotenv';

// Load environment variables using the existing setup
dotenv.config();

export interface Config {
  PORT: number;
  NODE_ENV: string;
}

export const config: Config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
