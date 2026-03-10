"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  trend?: { value: number; direction: "up" | "down" };
  loading?: boolean;
  className?: string;
  href?: string;
  description?: string;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24, delay },
});

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "text-primary",
  bgColor = "bg-primary/5",
  trend,
  loading = false,
  className,
  href,
  description,
}: StatsCardProps) {
  const content = (
    <Card className={cn(
      "group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300",
      "hover:shadow-lg hover:shadow-primary/5",
      href && "cursor-pointer",
      className
    )}>
      {/* Background gradient accent */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-50",
        bgColor
      )} />

      <CardContent className="p-4 md:p-5 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-xl md:text-2xl font-bold tracking-tight truncate">{value}</p>
                {trend && (
                  <span
                    className={cn(
                      "hidden sm:inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full",
                      trend.direction === "up"
                        ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50"
                        : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/50"
                    )}
                  >
                    {trend.direction === "up" ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {trend.value}%
                  </span>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground hidden md:block">{description}</p>
            )}
          </div>

          <div className={cn(
            "shrink-0 p-2.5 md:p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
            bgColor,
            color
          )}>
            <Icon size={20} strokeWidth={1.75} />
          </div>
        </div>

        {href && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
            <span>View details</span>
            <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <motion.div {...fadeUp()}>
        <Link href={href}>{content}</Link>
      </motion.div>
    );
  }

  return <motion.div {...fadeUp()}>{content}</motion.div>;
}
