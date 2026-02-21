import { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function useEmailAuth() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const signupMutation = trpc.auth.signup.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const signup = useCallback(
    async (email: string, password: string, nickname: string) => {
      try {
        setError(null);
        const result = await signupMutation.mutateAsync({
          email,
          password,
          nickname,
        });
        if (result.success) {
          navigate("/profile", { replace: true });
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao registrar";
        setError(message);
        throw err;
      }
    },
    [signupMutation, navigate]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        const result = await loginMutation.mutateAsync({
          email,
          password,
        });
        if (result.success) {
          navigate("/profile", { replace: true });
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao fazer login";
        setError(message);
        throw err;
      }
    },
    [loginMutation, navigate]
  );

  const logout = useCallback(async () => {
    try {
      setError(null);
      await logoutMutation.mutateAsync();
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer logout";
      setError(message);
      throw err;
    }
  }, [logoutMutation, navigate]);

  return {
    signup,
    login,
    logout,
    error,
    setError,
    isLoading: signupMutation.isPending || loginMutation.isPending || logoutMutation.isPending,
  };
}
