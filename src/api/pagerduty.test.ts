import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

let mockPd = vi.fn().mockResolvedValue({
  data: {
    schedule: {},
  },
});

vi.doMock('@pagerduty/pdjs', () => {
  return {
    api: vi.fn().mockReturnValue(mockPd),
  };
});

describe('pagerduty', async () => {
  const { api } = await import('@pagerduty/pdjs');
  const { getOnCallFromSchedule } = await import('./pagerduty');
  const defaultApiToken = 'default-token';
  const defaultId = 'default-id';
  const defaultDate = new Date(2023, 3, 23);
  const defaultSchedule = {
    schedule: {
      final_schedule: {
        rendered_schedule_entries: [],
      },
    },
  };

  beforeEach(() => {
    vi.stubEnv('PAGERDUTY_API_USER_TOKEN', defaultApiToken);

    mockPd.mockResolvedValue({
      data: defaultSchedule,
    });

    vi.useFakeTimers();
    vi.setSystemTime(defaultDate);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('should throw expected error if PAGERDUTY_API_USER_TOKEN environment variable is missing', async () => {
    delete process.env.PAGERDUTY_API_USER_TOKEN;

    await expect(() => getOnCallFromSchedule(defaultId)).rejects.toThrowError(
      /^Missing PAGERDUTY_API_USER_TOKEN environment variable$/
    );
  });

  test('should initialise PagerDuty client with given PAGERDUTY_API_USER_TOKEN environment variable', async () => {
    await getOnCallFromSchedule(defaultId);

    expect(api).toHaveBeenCalledWith({ token: defaultApiToken });
  });

  test('should call getSchedule with expected id and date', async () => {
    const expectedId = 'expected-id';
    await getOnCallFromSchedule(expectedId);

    expect(mockPd).toHaveBeenCalledWith({
      endpoint: `/schedules/${expectedId}`,
      method: 'GET',
      data: {
        time_zone: 'UTC',
        since: defaultDate.toISOString(),
      },
    });
  });

  test('should return empty object if person not found in the schedule', async () => {
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
        summary: 'Expected Name',
      },
    };
    const expectedSchedule = {
      schedule: {
        final_schedule: {
          rendered_schedule_entries: [expectedPerson],
        },
      },
    };

    mockPd.mockResolvedValue({
      data: expectedSchedule,
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
        summary: 'Not This expectedPerson',
      },
    };
    const expectedPerson = {
      start: defaultDate.toISOString(),
      end: dayAfter.toISOString(),
      user: {
        id: 'expected-id',
        summary: 'Expected Name',
      },
    };

    const expectedSchedule = {
      schedule: {
        final_schedule: {
          rendered_schedule_entries: [firstPerson, expectedPerson],
        },
      },
    };

    mockPd.mockResolvedValue({
      data: expectedSchedule,
    });

    const person = await getOnCallFromSchedule(defaultId);

    expect(person).toEqual(expectedPerson);
  });
});
