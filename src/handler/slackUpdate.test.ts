import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { slackUpdater } from './slackUpdate';
import { getOnCallFromSchedule } from '../api/pagerduty';
import { getSlackTopic } from '../api/slack';

vi.mock('../api/pagerduty');
vi.mock('../api/slack');

describe('slackUpdater', () => {
  const defaultPagerDutyScheduleId = 'default-pd-id';
  const defaultSlackChannelId = 'default-slack-channel-id';
  const defaultName = 'Default Name';
  const defaultTopic = '';

  beforeEach(() => {
    vi.stubEnv('PAGER_DUTY_SCHEDULE_ID', defaultPagerDutyScheduleId);
    vi.stubEnv('SLACK_CHANNEL_ID', defaultSlackChannelId);

    // @ts-ignore - Work out how to set the mocked type
    getOnCallFromSchedule.mockResolvedValue({
      user: {
        summary: defaultName,
      },
    });

    // @ts-ignore - Work out how to set the mocked type
    getSlackTopic.mockResolvedValue(defaultTopic);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('should return expected response if SLACK_CHANNEL_ID environment variable is missing', async () => {
    const expectedResponse = {
      status: 'ERROR',
      message: 'Error: Missing SLACK_CHANNEL_ID environment variable',
      updated: false,
    };

    delete process.env.SLACK_CHANNEL_ID;

    await expect(slackUpdater()).resolves.toEqual(expectedResponse);
  });

  test('should return expected response if user is found in schedule', async () => {
    const expectedResponse = {
      status: 'OK',
      message: `First responder: ${defaultName}`,
      updated: true,
    };

    await expect(slackUpdater()).resolves.toEqual(expectedResponse);
  });

  test('should return expected response if user is found in schedule and topic is set to the same text', async () => {
    const expectedName = 'Expected Name';
    const expectedResponse = {
      status: 'OK',
      message: `First responder: ${expectedName}`,
      updated: false,
    };

    // @ts-ignore - Work out how to set the mocked type
    getOnCallFromSchedule.mockResolvedValue({
      user: {
        summary: expectedName,
      },
    });

    // @ts-ignore - Work out how to set the mocked type
    getSlackTopic.mockResolvedValue(`First responder: ${expectedName}`);

    await expect(slackUpdater()).resolves.toEqual(expectedResponse);
  });

  test('should return expected slack user id instead of name if user is found in schedule and ID is found', async () => {
    const expectedName = '<@U03EGNN3AAV>';
    const expectedResponse = {
      status: 'OK',
      message: `First responder: ${expectedName}`,
      updated: true,
    };

    // @ts-ignore - Work out how to set the mocked type
    getOnCallFromSchedule.mockResolvedValue({
      user: {
        summary: 'Marc Littlemore',
      },
    });

    await expect(slackUpdater()).resolves.toEqual(expectedResponse);
  });

  test('should return expected error if schedule is not found', async () => {
    const expectedResponse = {
      status: 'ERROR',
      message: 'Error: Error getting on call from schedule',
      updated: false,
    };

    // @ts-ignore - Work out how to set the mocked type
    getOnCallFromSchedule.mockRejectedValue();

    await expect(slackUpdater()).resolves.toEqual(expectedResponse);
  });
});
