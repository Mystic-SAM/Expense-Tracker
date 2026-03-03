import { apiClient } from "@/app/apiClient";
import type { UpdateReportSettingParams } from "./reportTypes";

export const reportApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    updateReportSetting: builder.mutation<void, UpdateReportSettingParams>({
      query: (payload) => ({
        url: "/report/update-setting",
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

export const {
  useUpdateReportSettingMutation
} = reportApi;