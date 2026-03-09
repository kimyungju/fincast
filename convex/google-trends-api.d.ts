declare module "google-trends-api" {
  interface TrendsOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    category?: number;
    property?: string;
    granularTimeResolution?: boolean;
  }

  function interestOverTime(options: TrendsOptions): Promise<string>;
  function interestByRegion(options: TrendsOptions): Promise<string>;
  function relatedQueries(options: TrendsOptions): Promise<string>;
  function relatedTopics(options: TrendsOptions): Promise<string>;
  function dailyTrends(options: { geo: string; trendDate?: Date }): Promise<string>;
  function realTimeTrends(options: { geo: string; category?: string }): Promise<string>;

  const _default: {
    interestOverTime: typeof interestOverTime;
    interestByRegion: typeof interestByRegion;
    relatedQueries: typeof relatedQueries;
    relatedTopics: typeof relatedTopics;
    dailyTrends: typeof dailyTrends;
    realTimeTrends: typeof realTimeTrends;
  };
  export default _default;
}
