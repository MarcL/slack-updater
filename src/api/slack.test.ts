import { beforeEach, describe, expect, test, vi } from 'vitest';
import { WebClient } from '@slack/web-api';
import { setSlackTopic, getSlackTopic } from './slack';

vi.mock('@slack/web-api', () => {
    return {
        WebClient: vi.fn()
    };
});

describe('slack', () => {
    const defaultTopic = 'default topic';
    const defaultChannel = 'C123456';
    const defaultSlackToken = 'default-slack-token';

    let mockSetTopic;
    let mockInfo;

    beforeEach(() => {
        process.env.SLACK_TOKEN = defaultSlackToken;

        mockSetTopic = vi.fn();
        mockInfo = vi.fn();

        // @ts-ignore - need to work out how to properly type the vi.fn() mockImplementation
        WebClient.mockImplementation(() => {
            return {
                conversations: {
                    setTopic: mockSetTopic,
                    info: mockInfo
                }
            }
        });
    });

    describe('setSlackTopic', () => {
        test('should throw expected error if SLACK_TOKEN environment variable is missing', async () => {
            delete process.env.SLACK_TOKEN;

            await expect(() => setSlackTopic(defaultTopic, defaultChannel)).rejects.toThrowError(/^Missing SLACK_TOKEN environment variable$/);
        });

        test('should initialise Slack client with SLACK_TOKEN environment variable', async () => {
            const expectedSlackToken = 'expected-slack-token';
            process.env.SLACK_TOKEN = expectedSlackToken;

            await setSlackTopic(defaultTopic, defaultChannel);

            expect(WebClient).toHaveBeenCalledWith(expectedSlackToken)
        });

        test('should set expected conversation topic', async () => {
            const expectedTopic = 'expected topic';
            await setSlackTopic(expectedTopic, defaultChannel);

            expect(mockSetTopic).toHaveBeenCalledWith({topic: expectedTopic, channel: expect.any(String)});
        });

        test('should set expected conversation channel', async () => {
            const expectedChannel = 'C-EXPECTED-CHANNEL';
            await setSlackTopic(defaultTopic, expectedChannel);

            expect(mockSetTopic).toHaveBeenCalledWith({topic: expect.any(String), channel: expectedChannel});
        });
    });

    describe('getSlackTopic', () => {
        beforeEach(() => {
            mockInfo.mockImplementation(() => {
                return {
                    channel: {
                        topic: {
                            value: 'default value'
                        }
                    }
                };
            });
        });

        test('should throw expected error if SLACK_TOKEN environment variable is missing', async () => {
            delete process.env.SLACK_TOKEN;

            await expect(() => getSlackTopic(defaultTopic)).rejects.toThrowError(/^Missing SLACK_TOKEN environment variable$/);
        });
        
        test('should initialise Slack client with SLACK_TOKEN environment variable', async () => {
            const expectedSlackToken = 'expected-slack-token-2';
            process.env.SLACK_TOKEN = expectedSlackToken;

            await getSlackTopic(defaultTopic);

            expect(WebClient).toHaveBeenCalledWith(expectedSlackToken);
        });

        test('should retrieve expected conversation topic from given slackChannel', async () => {
            const expectedChannel = 'C-EXPECTED-CHANNEL';
            await getSlackTopic(expectedChannel);

            expect(mockInfo).toHaveBeenCalledWith({channel: expectedChannel});
        });

        test('should return expected channel topic if set', async () => {
            const expectedTopic = 'expected topic';
            mockInfo.mockImplementation(() => {
                return {
                    channel: {
                        topic: {
                            value: expectedTopic
                        }
                    }
                };
            });

            const topic = await getSlackTopic(defaultChannel);

            expect(topic).toEqual(expectedTopic);
        });

        test('should return empty channel topic if topic is not set', async () => {
            mockInfo.mockImplementation(() => {
                return {
                    channel: {
                    }
                };
            });

            const topic = await getSlackTopic(defaultChannel);

            expect(topic).toEqual('');
        });

        test('should return empty channel topic if channel is not set', async () => {
            mockInfo.mockImplementation(() => {
                return {};
            });

            const topic = await getSlackTopic(defaultChannel);

            expect(topic).toEqual('');
        });
    });
});
