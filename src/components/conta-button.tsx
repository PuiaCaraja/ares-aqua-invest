import { Link } from "@tanstack/react-router";
import { LogIn, UserRound } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function ContaButton() {
  const { user, ready } = useSession();
  const signedIn = ready && user;
  return (
    <Link
      to={signedIn ? "/minha-conta" : "/auth"}
      className="inline-flex items-center gap-2 rounded-full border border-neon/50 px-4 py-2 text-xs font-semibold text-neon transition hover:bg-neon/10 hover:shadow-neon"
    >
      {signedIn ? <UserRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
      {signedIn ? "Minha Conta" : "Entrar"}
    </Link>
  );
}
