import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../api";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isPending } = useQuery({ queryKey: ["me"], queryFn: api.getMe, staleTime: Infinity });

  const onSuccess = (nextUser) => {
    queryClient.setQueryData(["me"], nextUser);
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.removeQueries({ queryKey: ["orders"] });
  };

  return {
    user,
    isPending,
    login: useMutation({ mutationFn: api.login, onSuccess }),
    register: useMutation({ mutationFn: api.register, onSuccess }),
    logout: useMutation({ mutationFn: api.logout, onSuccess }),
  };
}
