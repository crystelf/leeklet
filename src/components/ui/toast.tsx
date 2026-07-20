"use client";

import { toast } from "sonner";

export { toast };

/** 兼容旧代码：`const toast = useToast(); toast.success(...)` */
export const useToast = () => toast;
