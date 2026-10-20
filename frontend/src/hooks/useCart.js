import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../api";

export function useCart(province = null) {
  return useQuery({
    queryKey: ["cart", province],
    queryFn: () => api.getCart(province),
    placeholderData: keepPreviousData,
  });
}

export function useCartMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (cartSummary) => {
      queryClient.setQueryData(["cart", null], cartSummary);
      queryClient.invalidateQueries({ queryKey: ["cart"], predicate: (query) => query.queryKey[1] !== null });
    },
  });
}
