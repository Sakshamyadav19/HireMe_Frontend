import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MatchResultsProvider } from "@/contexts/MatchResultsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut } from "lucide-react";

const navLinkClass =
  "text-sm font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[hsl(320,60%,70%)] to-[hsl(280,50%,60%)] text-white hover:opacity-90 transition-opacity";

export default function ProtectedLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/home";
  const isAISearch = pathname === "/aisearch";
  const isSaved = pathname === "/saved";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            to="/home"
            className="flex items-center gap-2 text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(320,60%,70%)] to-[hsl(280,50%,60%)] flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">JobMatch</span>
          </Link>
          <Link
            to="/home"
            className={isHome ? navLinkClass : "text-sm font-bold px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"}
          >
            Home
          </Link>
          <Link
            to="/aisearch"
            className={isAISearch ? navLinkClass : "text-sm font-bold px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"}
          >
            AI Job Search
          </Link>
          <Link
            to="/saved"
            className={isSaved ? navLinkClass : "text-sm font-bold px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"}
          >
            Saved Jobs
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>
      <MatchResultsProvider>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </MatchResultsProvider>
    </div>
  );
}
