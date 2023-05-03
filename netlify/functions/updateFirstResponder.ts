import dotenv from 'dotenv';
dotenv.config();

import { schedule } from "@netlify/functions";
import { slackUpdateHandler } from '../../src/handler/slackUpdate';

// Check every 3 hours in case there are overrides
const handler = schedule('0 */3 * * *', slackUpdateHandler)

export { handler };
