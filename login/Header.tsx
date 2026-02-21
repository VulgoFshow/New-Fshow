import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useEmailAuth } from "@/hooks/useEmailAuth";
import { LogOut, User, Home } from "lucide-react";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { logout } = useEmailAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const initials = (user?.nickname || "")
    .split("_")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="font-semibold text-slate-900 hidden sm:inline">Sistema de Contas</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link href="/">
                  <Button
                    variant={isActive("/") ? "default" : "ghost"}
                    className={isActive("/") ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Início
                  </Button>
                </Link>

                <Link href="/profile">
                  <Button
                    variant={isActive("/profile") ? "default" : "ghost"}
                    className={isActive("/profile") ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.nickname || ""} />
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.nickname}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Meu Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700">Registrar</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
