import { apiClient } from "@/app/apiClient";
import type {
  CreateTransactionBody,
  GetAllTransactionParams,
  GetAllTransactionResponse,
  GetSingleTransactionResponse,
  UpdateTransactionPayload
} from "./transactionTypes";

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

    getAllTransactions: builder.query<GetAllTransactionResponse, GetAllTransactionParams>({
      query: (params) => {
        const { keyword = undefined, type = undefined, recurringStatus = undefined, pageNumber = 1, pageSize = 10 } = params;

        return ({
          url: "/transaction/all",
          method: "GET",
          params: {
            keyword,
            type,
            recurringStatus,
            pageNumber,
            pageSize,
          },
        })
      },
      providesTags: ["transactions"],
    }),

    getSingleTransaction: builder.query<GetSingleTransactionResponse, string>({
      query: (id) => ({
        url: `/transaction/${id}`,
        method: "GET",
      }),
    }),

    updateTransaction: builder.mutation<void, UpdateTransactionPayload>({
      query: ({ id, transaction }) => ({
        url: `/transaction/update/${id}`,
        method: "PUT",
        body: transaction,
      }),
      invalidatesTags: ["transactions"],
    }),

  }),
});

export const {
  useCreateTransactionMutation,
  useGetAllTransactionsQuery,
  useGetSingleTransactionQuery,
  useUpdateTransactionMutation,
} = transactionApi;
