import dotenv from 'dotenv';
dotenv.config();

import { Handler, HandlerEvent, HandlerContext, schedule } from "@netlify/functions";
import { getOnCallFromSchedule } from '../../src/pagerduty'
import { setSlackTopic, getSlackTopic } from '../../src/slack'

const getSlackUserIdFromName = (name: string) : string => {
    const slackUserIds : Record<string, string> = {
        'Nick Taylor': '<@U039JSDDGSD>',
        'Marc Littlemore': '<@U03EGNN3AAV>',
        'Rob Stanford': '<@U0359H4DRFA>',
        'Sarah Etter': '<@U039K8C44HH>',
        'Lennart Jörgens': '<@U04MSL9CFA9>',
        'Michal Piechowiak': '<@U04MMK0EHV4>'
    };

    return slackUserIds[name] ?? name;
};

const updateIfTopicUnchanged = async (topic: string, channel: string) : Promise<boolean> => {
    const oldTopic = await getSlackTopic(channel);
    if (oldTopic === topic) {
        console.log(`Not updating channel (${channel}) as topic is unchanged`);
        return false;
    }
    
    await setSlackTopic(topic, channel);

    return true;
};

const slackUpdateHandler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        if (!process.env.PAGER_DUTY_SCHEDULE_ID) {
            throw new Error('Missing PAGER_DUTY_SCHEDULE_ID environment variable');
        }

        if (!process.env.SLACK_CHANNEL_ID) {
            throw new Error('Missing SLACK_CHANNEL_ID environment variable');
        }

        const firstResponderScheduleId = process.env.PAGER_DUTY_SCHEDULE_ID;
        const slackChannel = process.env.SLACK_CHANNEL_ID;
    
        const person = await getOnCallFromSchedule(firstResponderScheduleId);
        const {user: {summary: userName}} = person;

        const userNameOrSlackId = getSlackUserIdFromName(userName);
    
        const topic = `First responder: ${userNameOrSlackId} (${new Date().toISOString()})`;
        const updated = updateIfTopicUnchanged(topic, slackChannel);
    
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