import dotenv from 'dotenv';
dotenv.config();

import { Config } from '@netlify/functions';
import { slackUpdater } from '../../src/handler/slackUpdate';

export default async (req: Request) => {
  try {
    await slackUpdater();

    console.log('Slack status update completed.');
  } catch (error) {
    console.error('Error updating Slack status.', error.toString());
  }
};

// Check every 3 hours in case there are overrides
export const config: Config = {
  schedule: '0 */3 * * *',
};
