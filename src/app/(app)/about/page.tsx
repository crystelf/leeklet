"use client";

import {
  Info,
  Heart,
  Ticket,
  Users,
  SlidersHorizontal,
  MailCheck,
  MessageSquare,
  Shield,
  KeyRound,
  Cpu,
  Bot,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeekLogo } from "@/components/shell/leek-logo";
import { PageHeader } from "@/components/shell/page-header";
import "./about.css";

const STACK = [
  "React 19",
  "Next.js 16",
  "Tailwind CSS v4",
  "TypeScript",
  "纯 CSS 动画",
  "lucide-react",
];

const MODULES = [
  { icon: KeyRound, name: "Auth 鉴权", desc: "密钥换取 cookie、账号密码登录、注册、改密" },
  { icon: Ticket, name: "Cards 卡密", desc: "月/季/年卡兑换、余量、明文、补生成" },
  { icon: Users, name: "Groups 群管理", desc: "认领群、激活群会员、群配置详情" },
  { icon: SlidersHorizontal, name: "Features 功能", desc: "Access hook 定义与 help 指令列表" },
  { icon: Bot, name: "Bot Control", desc: "整群 bot 开关、单指令屏蔽/放行" },
  { icon: Cpu, name: "AI Control", desc: "12 个 AI 字段群级覆盖开关" },
  { icon: MailCheck, name: "Invites 邀请", desc: "拉群申请提交与内部审批" },
  { icon: MessageSquare, name: "Feedback 反馈", desc: "提交、评论、状态流转、staff 协作" },
  { icon: Shield, name: "Admin 管理", desc: "内部成员与管理员名单维护" },
];

export default function AboutPage() {
  const { resolved } = useTheme();
  const hero = resolved === "dark" ? "/about-hero-dark.jpg" : "/about-hero.jpg";

  return (
    <>
      <PageHeader icon={<Info size={22} />} title="关于" subtitle="Leeklet · 大葱管理后台" />

      {/* Hero */}
      <Card className="about-hero-card overflow-hidden mb-5">
        <div className="about-hero">
          <Image
            src={hero}
            alt="Leeklet 项目介绍"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 800px"
            className="about-hero-img"
          />
          <div className="about-hero-overlay" />
          <div className="about-hero-content">
            <h2 className="about-hero-title">Leeklet</h2>
            <p className="about-hero-sub">初音未来主题 · 大葱管理后台</p>
            <p className="about-hero-desc">
              基于 mioku-plugin-crystelf 的网页实现端，覆盖鉴权、卡密、群管理、
              AI 控制、邀请审批与反馈等全部接口。
            </p>
          </div>
        </div>
      </Card>

      {/* 介绍 */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="about-section-title">
            <Heart size={15} /> 这是什么
          </h3>
          <p className="about-text">
            Leeklet 是 <code>mioku-plugin-crystelf</code> 的网页前端。它把机器人后台的
            卡密、群会员、指令开关、AI 控制、邀请审批与反馈等能力，包装成一个可爱、
            流畅、响应式的面板。配色取自初音未来的青绿与发尾粉，日夜自动切换。
          </p>
          <p className="about-text">
            登录通过 QQ 私聊机器人发送 <code>/auth</code> 获取 8 位密钥，再在此页面换取
            7 天会话；已注册用户也可用邮箱/QQ + 密码直接登录。
          </p>
        </CardBody>
      </Card>

      {/* 技术栈 */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="about-section-title">技术栈</h3>
          <div className="about-stack">
            {STACK.map((s) => (
              <Badge key={s} variant="member">{s}</Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 功能覆盖 */}
      <Card>
        <CardBody>
          <h3 className="about-section-title">功能覆盖</h3>
          <p className="about-text" style={{ marginTop: 0, marginBottom: 16 }}>
            对接 crystelf 插件的 9 大模块、30+ 端点。
          </p>
          <div className="about-modules">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.name} className="about-module">
                  <span className="about-module-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="about-module-name">{m.name}</p>
                    <p className="about-module-desc">{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <footer className="about-foot">
        <span className="about-foot-leek"><LeekLogo size={22} /></span>
        <span>Made with <Heart size={12} style={{ color: "var(--color-miku-pink-500)" }} /> for Miku · Leeklet</span>
      </footer>
    </>
  );
}
