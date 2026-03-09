# UI Modernization Design Document

**Date:** 2026-03-09
**Approach:** Incremental Modernization
**Style:** shadcn/ui default system
**Responsive:** Mobile-first

## Overview

This document outlines the design for modernizing the MeowSMS Admin Dashboard UI with a mobile-first responsive approach using shadcn/ui components.

## 1. Layout & Navigation

### Responsive Sidebar System

- **Mobile (<768px):** Sheet-based drawer with hamburger trigger in header
- **Desktop (>=768px):** Collapsible sidebar with icon-only collapsed state

### Header Structure

```
Mobile:  [≡] │ Page Title              │ [Theme]
Desktop: [≡] │ Breadcrumb > Page       │ [Theme] [User]
```

### Sidebar Content

- Logo area with app name
- Navigation items with icons and labels
- User info section at bottom
- Logout button

## 2. Core Components

### StatsCard

```tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; direction: "up" | "down" };
  loading?: boolean;
  color?: string;
}
```

- Mobile: Full width or 2-column grid
- Desktop: 4-column grid
- Visual: Icon in colored circle, title in muted text, bold value

### PageHeader

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}
```

- Consistent spacing across all pages
- Responsive: stacks on mobile

### FilterBar

- Search input with icon
- Filter dropdowns
- Sort dropdown
- Mobile: Collapsible or stacked
- Desktop: Horizontal row

### DataTable (Mobile-First)

- Built on TanStack Table
- Features: sorting, filtering, pagination, row selection
- Mobile: Card-based list view
- Desktop: Full table with horizontal scroll

## 3. Page Updates

### Dashboard Page

| Section | Mobile | Desktop |
|---------|--------|---------|
| Header | Stacked | Side-by-side |
| Stats Grid | 2 columns | 4 columns |
| Period Overview | 2 columns | 4 columns |
| Charts | Full width, stacked | 2 columns side-by-side |
| Quick Actions | 2 columns | 4 columns |

### Users Page

| Section | Mobile | Desktop |
|---------|--------|---------|
| Stats Cards | 2 columns | 4 columns |
| Filter Bar | Stacked, collapsible | Horizontal row |
| User List | Card-based list | Data table |
| Pagination | Compact | Full with page numbers |

### Other Pages (Wallets, Transactions, Services, etc.)

- Follow same patterns established above
- Consistent page headers and filter bars
- Mobile card views for tabular data

## 4. Responsive Breakpoints

```css
sm: 640px   /* Small devices */
md: 768px   /* Tablets - sidebar switches */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

## 5. shadcn Components to Use

Already installed:
- sidebar, sheet, button, card, input, table, dropdown-menu, dialog, badge, avatar, skeleton, pagination, separator, tooltip

May need:
- Additional chart components if needed
- Any missing utility components

## 6. Implementation Order

1. Create reusable components (StatsCard, PageHeader, FilterBar)
2. Update layout with mobile-first responsive sidebar
3. Update Dashboard page
4. Update Users page
5. Update remaining pages (Wallets, Transactions, etc.)
6. Final polish and testing
