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
  "CSS 动画",
  "lucide-react",
];

export default function AboutPage() {
  const { resolved } = useTheme();
  const hero = resolved === "dark" ? "/about-hero-dark.jpg" : "/about-hero.jpg";

  return (
    <>
      <PageHeader
        icon={<Info size={22} />}
        title="关于"
        subtitle="Leeklet · 大葱管理后台"
      />

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
            <p className="about-hero-sub">
              初音未来主题 · 一站式机器人管理后台
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
            Leeklet 是 <code>mioku</code>{" "}
            机器人的网页管理后台，方便群友们自主完成申请拉群，提交反馈，管理机器人在本群的功能等
          </p>
          <p className="about-text">
            机器人框架：https://github.com/mioku-lab/mioku 采用MIT协议开源
          </p>
          <p className="about-text">
            leeklet：https://github.com/crystelf/leeklet 采用GPL3.0协议开源
          </p>
          <p className="about-text">来点star吧球球了QAQ</p>
        </CardBody>
      </Card>

      {/* 技术栈 */}
      <Card className="mb-5">
        <CardBody>
          <h3 className="about-section-title">技术栈</h3>
          <div className="about-stack">
            {STACK.map((s) => (
              <Badge key={s} variant="member">
                {s}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      <footer className="about-foot">
        <span className="about-foot-leek">
          <LeekLogo size={22} />
        </span>
        <span className="about-foot-text">
          Made with love for Miku · GPL 3.0
        </span>
      </footer>
    </>
  );
}
