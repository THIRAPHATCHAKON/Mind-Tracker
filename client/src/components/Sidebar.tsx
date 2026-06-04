import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Settings,
  User,
  Menu,
  X,
  Brain,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Weekly Progress", path: "/weekly" },
  { icon: TrendingUp, label: "Monthly Reports", path: "/monthly" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const { dark, toggle } = useTheme();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden"
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <AnimatePresence mode="wait">
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: open ? 280 : 0,
            opacity: 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border overflow-hidden",
            "hidden lg:block"
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex flex-col h-full p-4 min-w-[280px]">
            <Link to="/dashboard" className="flex items-center gap-3 px-2 py-4" aria-label="Mind Tracker Home">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Mind Tracker</h2>
                <p className="text-xs text-muted-foreground">Track your growth</p>
              </div>
            </Link>

            <Separator className="my-2" />

            <nav className="flex-1 space-y-1 py-4" role="menubar">
              {menuItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} role="menuitem">
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                      {item.label}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-2" />

            <div className="flex items-center justify-between px-2 py-3">
              <span className="text-sm text-muted-foreground">Theme</span>
              <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-[280px] h-full bg-card border-r border-border p-4"
              onClick={(e) => e.stopPropagation()}
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <h2 className="font-bold text-lg">Mind Tracker</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="space-y-1" role="menubar">
                {menuItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setOpen(false)} role="menuitem">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center justify-between px-2 py-3 mt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Theme</span>
                <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
