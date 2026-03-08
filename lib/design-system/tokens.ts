export const designTokens = {
  color: {
    brand: {
      primary: "hsl(146 62% 38%)",
      primaryHover: "hsl(146 62% 33%)",
      primarySoft: "hsl(147 51% 94%)",
      ink: "hsl(221 39% 11%)",
      glow: "hsl(153 58% 51%)",
    },
    neutral: {
      0: "hsl(0 0% 100%)",
      50: "hsl(210 20% 98%)",
      100: "hsl(220 18% 96%)",
      200: "hsl(220 16% 90%)",
      300: "hsl(219 13% 82%)",
      500: "hsl(220 9% 46%)",
      700: "hsl(222 27% 18%)",
      900: "hsl(223 39% 11%)",
    },
    status: {
      success: {
        solid: "hsl(145 63% 42%)",
        soft: "hsl(147 52% 93%)",
        text: "hsl(146 70% 22%)",
      },
      warning: {
        solid: "hsl(38 92% 50%)",
        soft: "hsl(48 100% 94%)",
        text: "hsl(28 84% 24%)",
      },
      danger: {
        solid: "hsl(0 78% 54%)",
        soft: "hsl(0 100% 96%)",
        text: "hsl(0 63% 32%)",
      },
      info: {
        solid: "hsl(217 91% 60%)",
        soft: "hsl(214 100% 96%)",
        text: "hsl(221 60% 32%)",
      },
      muted: {
        solid: "hsl(220 8% 46%)",
        soft: "hsl(220 18% 95%)",
        text: "hsl(222 19% 30%)",
      },
    },
    gradient: {
      heroStart: "hsl(147 51% 94%)",
      heroEnd: "hsl(210 20% 98%)",
      accentStart: "hsl(146 62% 38%)",
      accentEnd: "hsl(217 91% 60%)",
    },
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    pill: "9999px",
  },
  shadow: {
    sm: "0 1px 2px rgb(15 23 42 / 0.05)",
    md: "0 8px 24px rgb(15 23 42 / 0.08)",
    lg: "0 18px 50px rgb(15 23 42 / 0.12)",
    glow: "0 18px 50px rgb(22 163 74 / 0.15)",
  },
  spacing: {
    section: "clamp(4rem, 8vw, 7rem)",
    pageX: "clamp(1rem, 3vw, 2rem)",
    pageY: "clamp(1.5rem, 3vw, 2.5rem)",
  },
  layout: {
    pageMaxWidth: "80rem",
    readingMaxWidth: "48rem",
    sidebarWidth: "17rem",
    sidebarCollapsedWidth: "4.75rem",
    headerHeight: "4.25rem",
  },
  typography: {
    hero: "clamp(2.75rem, 6vw, 4.75rem)",
    pageTitle: "clamp(1.875rem, 3vw, 2.75rem)",
    sectionTitle: "clamp(1.5rem, 2vw, 2rem)",
    body: "1rem",
    small: "0.875rem",
  },
  motion: {
    fast: "150ms",
    base: "220ms",
    slow: "320ms",
  },
} as const

export const taskStatusTokens = {
  pending: {
    label: "等待中",
    tone: "muted",
  },
  processing: {
    label: "进行中",
    tone: "info",
  },
  completed: {
    label: "已完成",
    tone: "success",
  },
  failed: {
    label: "失败",
    tone: "danger",
  },
} as const

export const repositoryStatusTokens = {
  active: {
    label: "已启用",
    tone: "success",
  },
  inactive: {
    label: "未启用",
    tone: "muted",
  },
  configured: {
    label: "已配置",
    tone: "info",
  },
  unconfigured: {
    label: "未配置",
    tone: "warning",
  },
} as const

export const navigationTokens = {
  items: [
    { title: "仓库", href: "/repositories" },
    { title: "任务", href: "/tasks" },
    { title: "设置", href: "/settings" },
  ],
} as const
