"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  trend?: { value: number; direction: "up" | "down" };
  loading?: boolean;
  className?: string;
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
}: StatsCardProps) {
  return (
    <motion.div {...fadeUp()} className={className}>
      <Card className={cn(bgColor, "border-border hover:shadow-sm transition-shadow")}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(color, "p-2.5 rounded-lg bg-background/50")}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{title}</p>
              {loading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold truncate">{value}</p>
                  {trend && (
                    <span
                      className={cn(
                        "text-xs flex items-center gap-0.5",
                        trend.direction === "up" ? "text-green-500" : "text-red-500"
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
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
