"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeekLogo } from "@/components/shell/leek-logo";
import LiquidGlass from "@/components/liquid-glass";
import { cn } from "@/lib/cn";
import "./login.css";

type Tab = "key" | "account" | "register";

export default function LoginPage() {
  const { user, loading, exchangeKey, login, register, error, clearError } =
    useAuth();
  const toast = useToast();
  const router = useRouter();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("key");
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : mq.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const glassStyle: React.CSSProperties = isMobile
    ? {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "min(320px, 86vw)",
      }
    : {
        position: "absolute",
        top: "50%",
        left: "calc(100vw - 7vw - min(360px, 92vw) / 2)",
        width: "min(360px, 92vw)",
      };

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    clearError();
    setTab(t);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    setBusy(true);
    try {
      if (tab === "key") {
        await exchangeKey({
          key: String(data.get("key") || "")
            .trim()
            .toUpperCase(),
        });
        toast.success("登录成功，欢迎回到 Leeklet");
        router.replace("/");
      } else if (tab === "account") {
        await login({
          account: String(data.get("account") || "").trim(),
          password: String(data.get("password") || ""),
        });
        toast.success("登录成功");
        router.replace("/");
      } else {
        const qq = Number(data.get("qq"));
        await register({
          qq,
          key: String(data.get("key") || "")
            .trim()
            .toUpperCase(),
          password: String(data.get("password") || ""),
          email: (String(data.get("email") || "").trim() || undefined) as
            | string
            | undefined,
        });
        toast.success("注册成功，已自动登录");
        router.replace("/");
      }
    } catch {
      toast.error(error ?? "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell" ref={sceneRef}>
      <Image
        src="/background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="login-bg"
      />

      {/* 左上角 Leeklet 标题（无图标、无星星、不浮动、背后无遮挡） */}
      <div className="login-brand">
        <h1 className="login-brand-title">Leeklet</h1>
        <p className="login-brand-sub">大葱管理后台 · 初音未来主题</p>
      </div>

      {/* 右侧液态玻璃面板 */}
      <LiquidGlass
        mouseContainer={sceneRef}
        displacementScale={50}
        blurAmount={0.0}
        saturation={160}
        aberrationIntensity={1.5}
        elasticity={0.2}
        cornerRadius={32}
        padding="1"
        className="login-glass-instance"
        style={glassStyle}
      >
        <div className="login-card">
          <header className="login-card-head">
            <h2 className="login-card-title">欢迎回来</h2>
            <p className="login-card-sub">选择方式进入你的大葱世界</p>
          </header>

          <div className="tab-bar login-tabs" role="tablist">
            <TabButton
              active={tab === "key"}
              onClick={() => switchTab("key")}
              icon={KeyRound}
            >
              密钥
            </TabButton>
            <TabButton
              active={tab === "account"}
              onClick={() => switchTab("account")}
              icon={LogIn}
            >
              账号
            </TabButton>
            <TabButton
              active={tab === "register"}
              onClick={() => switchTab("register")}
              icon={UserPlus}
            >
              注册
            </TabButton>
          </div>

          <form className="login-form stagger" onSubmit={submit} key={tab}>
            {tab === "key" && (
              <>
                <Input
                  id="key"
                  name="key"
                  label="登录密钥"
                  placeholder="ABCD1234"
                  hint="8 位密钥，15 分钟内有效"
                  autoComplete="one-time-code"
                  required
                  maxLength={8}
                  style={{ textTransform: "uppercase", letterSpacing: "0.2em" }}
                />
                <Button
                  type="submit"
                  size="lg"
                  loading={busy}
                  className="w-full"
                >
                  用密钥登录
                </Button>
              </>
            )}

            {tab === "account" && (
              <>
                <Input
                  id="account"
                  name="account"
                  label="QQ 号或邮箱"
                  placeholder="12345678 或 you@example.com"
                  required
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="密码"
                  placeholder="至少 6 位"
                  required
                  minLength={6}
                />
                <Button
                  type="submit"
                  size="lg"
                  loading={busy}
                  className="w-full"
                >
                  登录
                </Button>
              </>
            )}

            {tab === "register" && (
              <>
                <Input
                  id="qq"
                  name="qq"
                  label="QQ 号"
                  placeholder="12345678"
                  type="number"
                  required
                />
                <Input
                  id="reg-key"
                  name="key"
                  label="鉴权密钥"
                  placeholder="ABCD1234"
                  hint="先在 QQ 发 /auth 获取密钥验证归属"
                  required
                  maxLength={8}
                  style={{ textTransform: "uppercase", letterSpacing: "0.2em" }}
                />
                <Input
                  id="reg-password"
                  name="password"
                  type="password"
                  label="设置密码"
                  placeholder="至少 6 位"
                  required
                  minLength={6}
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="邮箱（可选）"
                  placeholder="you@example.com"
                />
                <Button
                  type="submit"
                  size="lg"
                  loading={busy}
                  className="w-full"
                >
                  注册并登录
                </Button>
              </>
            )}

            {error && <p className="login-error">{error}</p>}
          </form>

          <footer className="login-foot">
            <span className="login-foot-leek">
              <LeekLogo size={20} />
            </span>
            <span>Leeklet · 基于 mioku-plugin-crystelf</span>
          </footer>
        </div>
      </LiquidGlass>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof KeyRound;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-active={active}
      className={cn("tab login-tab")}
      onClick={onClick}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}
