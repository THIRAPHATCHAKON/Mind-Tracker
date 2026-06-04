import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Bell } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[280px] transition-all duration-300">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="lg:hidden flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs" aria-hidden="true">MT</span>
              </div>
              <h1 className="font-semibold">Mind Tracker</h1>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
              {user && (
                <div className="flex items-center gap-3" role="region" aria-label="User menu">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div
                    className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="text-sm font-semibold text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="main-content" className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
