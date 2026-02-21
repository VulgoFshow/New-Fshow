import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Lock, Upload, User, Shield } from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900">
            Sistema de Contas
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Gerencie sua conta com segurança. Cadastro simples, autenticação elegante e perfil completo.
          </p>

          {isAuthenticated ? (
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/profile">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <User className="mr-2 h-5 w-5" />
                  Ir para Perfil
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Criar Conta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Entrar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Recursos
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Perfil Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Crie seu perfil com apelido, e-mail e foto de perfil personalizada.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Autenticação Segura</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Senhas criptografadas com PBKDF2 e sessões seguras com JWT.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Upload de Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Faça upload de sua foto de perfil com armazenamento seguro em S3.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Proteção de Rotas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Rotas privadas protegidas com autenticação e redirecionamento automático.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Info Section */}
      {isAuthenticated && user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-slate-50">
            <CardHeader>
              <CardTitle className="text-2xl">Bem-vindo, {user.nickname}!</CardTitle>
              <CardDescription>
                Você está autenticado e pode acessar todas as funcionalidades do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">E-mail</p>
                  <p className="font-semibold text-slate-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Função</p>
                  <p className="font-semibold text-slate-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Membro desde</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
