import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-6 text-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
              <p className="text-slate-600">
                Você precisa estar autenticado para acessar esta página.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">Ir para Login</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Voltar ao Início</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
