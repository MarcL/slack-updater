import { beforeEach, describe, expect, test, vi } from 'vitest';
import PagerDuty from 'node-pagerduty';
import { getOnCallFromSchedule } from './pagerduty';
import { afterEach } from 'node:test';

vi.mock('node-pagerduty', () => {
    return {
        default: vi.fn()
    };
});

describe('pagerduty', () => {
    const defaultApiToken = 'default-token';
    const defaultId = 'default-id';
    const defaultDate = new Date(2023, 3, 23);
    const defaultSchedule = {
        schedule: {
            schedule_layers: [
                {
                    rendered_schedule_entries: []
                }
            ]
        }
    };
    let mockGetSchedule;

    beforeEach(() => {
        process.env.PAGERDUTY_API_USER_TOKEN = defaultApiToken;

        mockGetSchedule = vi.fn().mockResolvedValue({
            body: JSON.stringify(defaultSchedule)
        });

        PagerDuty.mockImplementation(() => {
            return {
                schedules: {
                    getSchedule: mockGetSchedule
                }
            };
        });

        vi.useFakeTimers();
        vi.setSystemTime(defaultDate);
    });

    test('should throw expected error if PAGERDUTY_API_USER_TOKEN environment variable is missing', async () => {
        delete process.env.PAGERDUTY_API_USER_TOKEN;

        await expect(() => getOnCallFromSchedule(defaultId)).rejects.toThrowError(/^Missing PAGERDUTY_API_USER_TOKEN environment variable$/);
    });

    test('should initialise PagerDuty client with given PAGERDUTY_API_USER_TOKEN environment variable', async () => {
        await getOnCallFromSchedule(defaultId);

        expect(PagerDuty).toHaveBeenCalledWith(defaultApiToken);
    });

    test('should call getSchedule with expected id and date', async () => {
        const expectedId = 'expected-id';
        await getOnCallFromSchedule(expectedId);

        expect(mockGetSchedule)
            .toHaveBeenCalledWith(expectedId, {time_zone: 'UTC', since: defaultDate.toISOString()});
    });

    test('should return empty object if person not found in the schedule', async () => {
        mockGetSchedule = vi.fn().mockResolvedValue({
            body: JSON.stringify(defaultSchedule)
        });

        const person = await getOnCallFromSchedule(defaultId);

        expect(person).toEqual({});
    });

    test('should return expected person if date is within their schedule', async () => {
        const dayAfter = new Date(defaultDate);
        dayAfter.setDate(defaultDate.getDate() + 1);

        const expectedPerson = {
            start: defaultDate.toISOString(),
            end: dayAfter.toISOString(),
            user: {
                id: 'expected-id',
                summary: 'Expected Name'
            }
        };
        const expectedSchedule = {
            schedule: {
                schedule_layers: [
                    {
                        rendered_schedule_entries: [
                            expectedPerson
                        ]
                    }
                ]
            }
        };
        mockGetSchedule = vi.fn().mockResolvedValue({
            body: JSON.stringify(expectedSchedule)
        });

        const person = await getOnCallFromSchedule(defaultId);

        expect(person).toEqual(expectedPerson);
    });

    test('should return second person if date is within their schedule', async () => {
        const dayAfter = new Date(defaultDate);
        dayAfter.setDate(defaultDate.getDate() + 1);
        const twoDaysAfter = new Date(dayAfter);
        twoDaysAfter.setDate(dayAfter.getDate() + 1);

        const firstPerson = {
            start: dayAfter.toISOString(),
            end: twoDaysAfter.toISOString(),
            user: {
                id: 'expected-id',
                summary: 'Not This expectedPerson'
            }
        };
        const expectedPerson = {
            start: defaultDate.toISOString(),
            end: dayAfter.toISOString(),
            user: {
                id: 'expected-id',
                summary: 'Expected Name'
            }
        };

        const expectedSchedule = {
            schedule: {
                schedule_layers: [
                    {
                        rendered_schedule_entries: [
                            firstPerson,
                            expectedPerson
                        ]
                    }
                ]
            }
        };
        mockGetSchedule = vi.fn().mockResolvedValue({
            body: JSON.stringify(expectedSchedule)
        });

        const person = await getOnCallFromSchedule(defaultId);

        expect(person).toEqual(expectedPerson);
    });
});
