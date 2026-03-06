import { apiClient } from "@/app/apiClient";
import type { FilterParams, SummaryAnalyticsResponse } from "./analyticsTypes";

export const analyticsApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    summaryAnalytics: builder.query<SummaryAnalyticsResponse, FilterParams>({
      query: ({ preset, from, to }) => ({
        url: "/analytics/summary",
        method: "GET",
        params: { preset, from, to }
      }),
      providesTags: ["analytics"],
    }),
  }),
});

export const {
  useSummaryAnalyticsQuery,
} = analyticsApi;