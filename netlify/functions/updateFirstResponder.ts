import dotenv from 'dotenv';
dotenv.config();

import { Handler, HandlerEvent, HandlerContext, schedule } from "@netlify/functions";
import { getOnCallFromSchedule } from '../../src/pagerduty'
import { setSlackTopic } from '../../src/slack'

const slackUpdateHandler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        const firstResponderScheduleId = process.env.PAGER_DUTY_SCHEDULE_ID;
        const slackChannel = process.env.SLACK_CHANNEL_ID;
    
        const person = await getOnCallFromSchedule(firstResponderScheduleId);
        const {user: {summary: userName}} = person;
    
        const topic = `First responder: ${userName}`;
        const updated = await setSlackTopic(topic, slackChannel);
    
        return {
            statusCode: 200,
            body: JSON.stringify({status: 'OK', topic, updated})
        };
    } catch (error) {
        console.error(error.toString())
        return {
            statusCode: 500,
            body: JSON.stringify({status: 'ERROR', error: error.toString()})
        };
    }
};

// 3 pm every day
// const handler = schedule('0 15 * * *', slackUpdateHandler)

// Every 6 hours
const handler = schedule('0 */6 * * *', slackUpdateHandler)

export { handler };