import { WebClient } from '@slack/web-api';

const createSlackClient = () => {
  if (!process.env.SLACK_TOKEN) {
    throw new Error('Missing SLACK_TOKEN environment variable');
  }

  const token = process.env.SLACK_TOKEN;
  return new WebClient(token);
};

export const setSlackTopic = async (
  topic: string,
  channel: string
): Promise<void> => {
  const client = createSlackClient();
  await client.conversations.setTopic({ topic, channel });
};

export const getSlackTopic = async (channel: string): Promise<string> => {
  const client = createSlackClient();

  const currentChannelInfo = await client.conversations.info({ channel });
  const topic = currentChannelInfo.channel?.topic?.value ?? '';

  return topic;
};

// TODO: Not sure if we can do this due to lack of Slack permissions
// export const getUserByEmail = async (emailAddress: string): Promise<string> => {
//   const client = createSlackClient();

//   const user = await client.users.lookupByEmail({
//     email: emailAddress,
//   });

//   return user;
// };
