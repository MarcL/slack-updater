import dotenv from 'dotenv';
dotenv.config();

import { schedule } from "@netlify/functions";
import { slackUpdateHandler } from '../../src/handler/slackUpdate';

// 3 pm every day
// const handler = schedule('0 15 * * *', slackUpdateHandler)

// Every 6 hours
const handler = schedule('0 */6 * * *', slackUpdateHandler)

export { handler };