"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Server,
  CreditCard,
  Tag,
  Settings,
  LogOut,
  Wallet,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/dashboard/users", icon: Users },
  { title: "Services", href: "/dashboard/services", icon: Server },
  { title: "Promocodes", href: "/dashboard/promocodes", icon: Tag },
  { title: "Transactions", href: "/dashboard/transactions", icon: CreditCard },
  { title: "Wallets", href: "/dashboard/wallets", icon: Wallet },
  { title: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Only read localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) setAdminUser(JSON.parse(stored));
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">MeowSMS Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-secondary",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t space-y-3">
        {/* Only render user info after mount to avoid hydration mismatch */}
        {mounted && adminUser && (
          <div className="px-3">
            <p className="text-sm font-medium">
              {adminUser?.name || adminUser?.firstName || "Admin"}
            </p>
            <p className="text-xs text-muted-foreground">
              {adminUser?.telegramId || adminUser?.username || "Administrator"}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}