import { getOnCallFromSchedule } from '../../src/api/pagerduty';
import { setSlackTopic, getSlackTopic } from '../../src/api/slack';

// TODO: Find a better way to map PagerDuty names to Slack to avoid hard-coding
const getSlackUserIdFromName = (name: string): string => {
  // Use tag syntax with user ID so it links to the user
  const slackUserIds: Record<string, string> = {
    'Marc Littlemore': '<@U03EGNN3AAV>',
    'Rob Stanford': '<@U0359H4DRFA>',
    'Michal Piechowiak': '<@U04MMK0EHV4>',
    'Tatyana Novell': '<@U03AULLNQUX>',
  };

  return slackUserIds[name] ?? name;
};

const updateIfTopicChanged = async (
  topic: string,
  channel: string,
  alwaysUpdate: boolean
): Promise<boolean> => {
  const oldTopic = await getSlackTopic(channel);

  if (!alwaysUpdate && oldTopic === topic) {
    console.log(`Not updating channel (${channel}) as topic is unchanged`);
    return false;
  }

  console.log(`Updating channel (${channel}) with topic: ${topic}`);
  // await setSlackTopic(topic, channel);

  return true;
};

const slackUpdater = async (
  pdScheduleId = process.env.PAGER_DUTY_SCHEDULE_ID,
  alwaysUpdate = false
) => {
  try {
    if (!process.env.SLACK_CHANNEL_ID) {
      throw new Error('Missing SLACK_CHANNEL_ID environment variable');
    }

    const slackChannel = process.env.SLACK_CHANNEL_ID;

    let person;
    try {
      person = await getOnCallFromSchedule(pdScheduleId);
    } catch (error) {
      throw new Error('Error getting on call from schedule');
    }
    const {
      user: { summary: userName },
    } = person;

    const userNameOrSlackId = getSlackUserIdFromName(userName);

    const topic = `First responder: ${userNameOrSlackId}`;
    const updated = await updateIfTopicChanged(
      topic,
      slackChannel,
      alwaysUpdate
    );

    return { status: 'OK', message: topic, updated };
  } catch (error) {
    console.error(error.toString());
    return {
      status: 'ERROR',
      message: error.toString(),
      updated: false,
    };
  }
};

export { slackUpdater };
