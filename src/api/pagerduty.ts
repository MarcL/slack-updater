import { api } from '@pagerduty/pdjs';

export const getOnCallFromSchedule = async (scheduleId: string) => {
  if (!process.env.PAGERDUTY_API_USER_TOKEN) {
    throw new Error('Missing PAGERDUTY_API_USER_TOKEN environment variable');
  }

  const apiToken = process.env.PAGERDUTY_API_USER_TOKEN;
  const pd = api({ token: apiToken });

  const dateNow = new Date();
  const dateNowIso = dateNow.toISOString();

  // By default PD will get 2 weeks worth of schedule
  const options = {
    time_zone: 'UTC',
    since: dateNowIso,
  };

  //   const response = await pd.schedules.getSchedule(scheduleId, options);
  const { data } = await pd({
    endpoint: `/schedules/${scheduleId}`,
    method: 'GET',
    data: options,
  });

  // Look at first layer's rendered schedule
  const teamLayer = data?.schedule?.final_schedule?.rendered_schedule_entries;

  const person = teamLayer?.find((item) => {
    const startDate = new Date(item.start);
    const endDate = new Date(item.end);

    return dateNow >= startDate && dateNow <= endDate;
  });

  return person ?? {};
};
