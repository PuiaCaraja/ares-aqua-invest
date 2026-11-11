import { Link } from "@tanstack/react-router";
import { LogIn, UserRound } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccountAccess } from "@/lib/access.functions";

export function ContaButton() {
  const { user, ready } = useSession();
  const signedIn = ready && user;
  const fetchAccess = useServerFn(getAccountAccess);
  const { data: access } = useQuery({
    queryKey: ["account-access", user?.id],
    queryFn: () => fetchAccess(),
    enabled: Boolean(signedIn),
    retry: false,
  });
  const admin = Boolean(signedIn && access?.role === "admin");
  return (
    <Link
      to={admin ? "/admin" : signedIn ? "/minha-conta" : "/auth"}
      className="inline-flex items-center gap-2 rounded-full border border-neon/50 px-4 py-2 text-xs font-semibold text-neon transition hover:bg-neon/10 hover:shadow-neon"
    >
      {signedIn ? <UserRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
      {admin ? "Administração" : signedIn ? "Minha Conta" : "Entrar"}
    </Link>
  );
}
