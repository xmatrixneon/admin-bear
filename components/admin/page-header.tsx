"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const fadeUp = () => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24 },
});

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      {...fadeUp()}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
