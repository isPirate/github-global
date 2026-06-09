/* eslint-disable @next/next/no-html-link-for-pages */
import { Globe2 } from "lucide-react"

const footerLinks = [
  { label: "GitHub 登录", href: "/api/auth/signin" },
  { label: "仓库管理", href: "/repositories" },
  { label: "任务追踪", href: "/tasks" },
  { label: "设置中心", href: "/settings" },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/70 bg-slate-950 py-10 text-slate-300">
      <div className="page-container flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">GitHub Global</p>
              <p className="text-sm text-slate-400">
                GitHub 仓库自动化翻译平台
              </p>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            当前前端重构聚焦在统一产品表达、梳理操作路径，并让现有能力在更完整的界面中被正确呈现。
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {footerLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-slate-300 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <div className="page-container mt-8 border-t border-border/40 pt-6">
        <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-400 sm:flex-row sm:gap-6">
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=34162102003426"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-white"
          >
            <img
              src="/beian-icon.png"
              alt="公安备案"
              className="h-4 w-4"
            />
            皖公网安备34162102003426号
          </a>
          <a
            href="https://beian.miit.gov.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            皖ICP备2026009215号-1
          </a>
        </div>
      </div>
    </footer>
  )
}
