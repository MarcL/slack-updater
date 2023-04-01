import { WebClient } from '@slack/web-api'

export const setSlackTopic = async (topic: string, channel: string) => {
    const token = process.env.SLACK_TOKEN;
    const web = new WebClient(token);

    // Check existing topic
    // const currentChannelInfo = await web.conversations.info({channel});
    // const {channel: {topic: {value: currentTopic}}} = currentChannelInfo;

    // if (currentTopic === topic) {
    //     console.log('Not updating channel as topic is unchanged');
    //     return false;
    // }
    
    await web.conversations.setTopic({topic, channel});
    
    return true;
};
