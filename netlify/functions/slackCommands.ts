import { Config, Context } from '@netlify/functions';
import { slackUpdater } from '../../src/handler/slackUpdate';

const slackMarkdownResponse = (text, ephemeral = true) => ({
  mrkdwn: true,
  response_type: ephemeral ? 'ephemeral' : 'in_channel',
  text,
});

export default async (req: Request, context: Context) => {
  const parameterText = await req.text();
  const params = new URLSearchParams(parameterText);
  const command = params.get('command');

  // TODO: Verify request signature

  let slackResponse;

  // TODO: Refactor for multiple commands and
  // move code out of function handler
  if (command == '/oncall') {
    try {
      await slackUpdater(true);

      slackResponse = slackMarkdownResponse('Updating on-call...');
    } catch (error) {
      console.error('Error updating Slack status.', error.toString());

      slackResponse = slackMarkdownResponse('Error updating on-call...');
    }
  } else {
    slackResponse = slackMarkdownResponse(`Unknown command: ${command}`);
  }

  return new Response(JSON.stringify(slackResponse), {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const config: Config = {
  method: 'POST',
  path: '/commands',
};
