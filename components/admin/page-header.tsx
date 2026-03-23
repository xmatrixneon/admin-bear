"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Children, cloneElement, isValidElement, ReactElement, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  badge?: string;
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
  badge,
}: PageHeaderProps) {
  // Convert actions to array for mobile overflow handling
  const actionArray = Children.toArray(actions || []).filter(Boolean);

  return (
    <motion.div
      {...fadeUp()}
      className={cn(
        "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4",
        className
      )}
    >
      <div className="space-y-0.5 sm:space-y-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg">
            {description}
          </p>
        )}
      </div>
      {actionArray.length > 0 && (
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto overflow-x-auto">
          {/* Desktop - show all actions */}
          <div className="hidden sm:flex items-center gap-2">
            {actions}
          </div>
          {/* Mobile - show first action and overflow for rest */}
          <div className="flex sm:hidden items-center gap-2 w-full">
            {actionArray[0]}
            {actionArray.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <MoreVertical size={14} className="mr-1" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actionArray.slice(1).map((action, index) => {
                    // Handle Button elements - extract label from children
                    if (isValidElement(action) && action.type === Button) {
                      const buttonProps = action.props as any;
                      const handleClick = buttonProps.onClick;

                      // Try to get label from children
                      let label = `Action ${index + 2}`;
                      const children = buttonProps.children;

                      if (typeof children === 'string') {
                        label = children;
                      } else if (Array.isArray(children)) {
                        // Find text content in children array
                        const textChild = children.find((c: any) => typeof c === 'string');
                        if (textChild) label = textChild;
                      }

                      return (
                        <DropdownMenuItem
                          key={`mobile-action-${index}`}
                          onClick={handleClick}
                          disabled={buttonProps.disabled}
                        >
                          {label}
                        </DropdownMenuItem>
                      );
                    }
                    return null;
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
