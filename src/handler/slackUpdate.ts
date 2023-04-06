import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getOnCallFromSchedule } from '../../src/api/pagerduty'
import { setSlackTopic, getSlackTopic } from '../../src/api/slack'

const getSlackUserIdFromName = (name: string) : string => {
    const slackUserIds : Record<string, string> = {
        // 'Nick Taylor': '<@U039JSDDGSD>',
        // 'Marc Littlemore': '<@U03EGNN3AAV>',
        // 'Rob Stanford': '<@U0359H4DRFA>',
        // 'Sarah Etter': '<@U039K8C44HH>',
        // 'Lennart Jörgens': '<@U04MSL9CFA9>',
        // 'Michal Piechowiak': '<@U04MMK0EHV4>'
        'Nick Taylor': '<@U6R63MMQD>',
        'Marc Littlemore': '<@U6R63MMQD>',
        'Rob Stanford': '<@U6R63MMQD>',
        'Sarah Etter': '<@U6R63MMQD>',
        'Lennart Jörgens': '<@U6R63MMQD>',
        'Michal Piechowiak': '<@U6R63MMQD4>'
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
    
        const topic = `First responder: ${userNameOrSlackId}`;
        const updated = await updateIfTopicUnchanged(topic, slackChannel);
    
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

export { slackUpdateHandler }