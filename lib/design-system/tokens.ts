/**
 * Design System Tokens
 *
 * This file contains all the design tokens used throughout the application.
 * These tokens are based on the GitHub green theme design system.
 */

/**
 * Color Tokens (HSL values for Tailwind)
 */
export const colors = {
  brand: {
    primary: 'hsl(138 76% 40%)',      // #2da44e
    hover: 'hsl(138 76% 35%)',        // Deep green hover
    light: 'hsl(138 76% 94%)',        // Light background
  },
  semantic: {
    success: 'hsl(138 76% 40%)',      // Green - Completed
    warning: 'hsl(38 92% 50%)',       // Orange - In Progress
    error: 'hsl(0 84% 60%)',          // Red - Failed
    info: 'hsl(199 89% 48%)',         // Blue - Info
  },
  neutral: {
    text: {
      primary: 'hsl(220 10% 10%)',
      secondary: 'hsl(220 8% 45%)',
      disabled: 'hsl(220 8% 70%)',
    },
    bg: {
      primary: 'hsl(0 0% 100%)',
      secondary: 'hsl(220 20% 97%)',
      tertiary: 'hsl(220 20% 94%)',
    },
    border: {
      default: 'hsl(220 13% 91%)',
      subtle: 'hsl(220 13% 95%)',
      strong: 'hsl(220 13% 80%)',
    },
  },
} as const

/**
 * Spacing Tokens (in rem, based on 4px base unit)
 */
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const

/**
 * Border Radius Tokens
 */
export const radius = {
  sm: '0.25rem',    // 4px - Small elements
  md: '0.375rem',   // 6px - Default (GitHub style)
  lg: '0.5rem',     // 8px - Cards
  xl: '0.75rem',    // 12px - Large cards
  full: '9999px',   // Pill shaped
} as const

/**
 * Shadow Tokens
 */
export const shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  lg: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  xl: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '2xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const

/**
 * Typography Tokens
 */
export const typography = {
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

/**
 * Layout Tokens
 */
export const layout = {
  sidebar: {
    width: '260px',
    collapsedWidth: '72px',
  },
  header: {
    height: '64px',
  },
  container: {
    maxWidth: '1400px',
    padding: '2rem',
  },
} as const

/**
 * Breakpoint Tokens (matches Tailwind defaults)
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/**
 * Animation Tokens (durations in ms)
 */
export const animation = {
  duration: {
    fast: 150,
    base: 200,
    slow: 300,
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const

/**
 * Z-Index Tokens
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 100,
} as const

/**
 * Status configuration for translation tasks
 */
export const taskStatus = {
  pending: {
    label: '等待中',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: 'clock',
  },
  processing: {
    label: '进行中',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: 'loader',
  },
  completed: {
    label: '已完成',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: 'check-circle',
  },
  failed: {
    label: '失败',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'x-circle',
  },
} as const

/**
 * Navigation configuration
 */
export const navigation = {
  items: [
    { title: '仓库', href: '/repositories', icon: 'Github' },
    { title: '任务', href: '/tasks', icon: 'FileText' },
    { title: '设置', href: '/settings', icon: 'Settings' },
  ],
} as const
