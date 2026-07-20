"use client";

import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";

function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        duration: 3500,
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
