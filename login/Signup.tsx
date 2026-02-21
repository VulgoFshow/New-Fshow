import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { useEmailAuth } from "@/hooks/useEmailAuth";
import { Loader2, AlertCircle } from "lucide-react";

export default function Signup() {
  const { signup, error, isLoading } = useEmailAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password || !nickname) {
      setLocalError("Todos os campos são obrigatórios");
      return;
    }

    try {
      await signup(email, password, nickname);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao registrar";
      setLocalError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            Registre-se para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || localError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || localError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                Apelido
              </label>
              <Input
                id="nickname"
                type="text"
                placeholder="seu_apelido"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isLoading}
                className="border-slate-200"
              />
              <p className="text-xs text-slate-500">
                3-30 caracteres, apenas letras, números e underscore
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="border-slate-200"
              />
              <p className="text-xs text-slate-500">
                Mínimo 8 caracteres, 1 maiúscula, 1 minúscula e 1 número
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-slate-600">Já tem uma conta? </span>
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Faça login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
