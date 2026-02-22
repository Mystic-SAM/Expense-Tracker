import { apiClient } from "@/app/apiClient";
import type { CreateTransactionBody } from "./transactionTypes";

export const transactionApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    createTransaction: builder.mutation<void, CreateTransactionBody>({
      query: (body) => ({
        url: "/transaction/create",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["transactions", "analytics"],
    }),
  }),
});

export const { useCreateTransactionMutation } = transactionApi;
