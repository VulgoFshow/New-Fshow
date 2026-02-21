import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const uploadProfilePictureMutation = trpc.auth.uploadProfilePicture.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Você precisa estar autenticado para acessar esta página.</p>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700">Ir para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdateNickname = async () => {
    if (!nickname.trim()) {
      setError("Apelido não pode estar vazio");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await updateProfileMutation.mutateAsync({
        nickname,
      });
      setSuccess("Apelido atualizado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar apelido";
      setError(message);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];

        try {
          await uploadProfilePictureMutation.mutateAsync({
            base64: base64Data,
            mimeType: file.type,
          });
          setSuccess("Foto de perfil atualizada com sucesso!");
          setUploadProgress(0);
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erro ao fazer upload";
          setError(message);
          setUploadProgress(0);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar arquivo";
      setError(message);
    }
  };

  const initials = (user.nickname || "")
    .split("_")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">Meu Perfil</CardTitle>
            <CardDescription>Gerencie suas informações de conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Foto de Perfil</h3>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-slate-200">
                  <AvatarImage src={user.profilePictureUrl || ""} alt={user.nickname || ""} />
                  <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProfilePictureMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploadProfilePictureMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Alterar Foto
                      </>
                    )}
                  </Button>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <p className="text-sm text-slate-600">{uploadProgress}% enviado</p>
                  )}
                  <p className="text-xs text-slate-500">
                    JPEG, PNG, WebP ou GIF. Máximo 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Section */}
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                value={user.email || ""}
                disabled
                className="bg-slate-50 border-slate-200 text-slate-600"
              />
              <p className="text-xs text-slate-500">O e-mail não pode ser alterado</p>
            </div>

            {/* Nickname Section */}
            <div className="space-y-2 pt-4 border-t">
              <label htmlFor="nickname" className="text-sm font-medium">
                Apelido
              </label>
              <div className="flex gap-2">
              <Input
                id="nickname"
                type="text"
                value={nickname || ""}
                onChange={(e) => setNickname(e.target.value)}
                disabled={updateProfileMutation.isPending}
                className="border-slate-200"
              />
                <Button
                  onClick={handleUpdateNickname}
                  disabled={updateProfileMutation.isPending || nickname === (user.nickname || "")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                3-30 caracteres, apenas letras, números e underscore
              </p>
            </div>

            {/* Account Info */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium">Informações da Conta</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">ID da Conta</p>
                  <p className="font-mono text-slate-900">{user.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Função</p>
                  <p className="capitalize text-slate-900">{user.role}</p>
                </div>
                <div>
                  <p className="text-slate-500">Membro desde</p>
                  <p className="text-slate-900">{new Date(user.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
