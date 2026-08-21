import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // الافتراضي 1MB أصغر من الحد الأقصى لصور إثبات التحويل (5MB) وشعارات طرق
  // الدفع (2MB) يلي منسمح فيهم بكود التطبيق — بدون هذا الرفع كان صار
  // 413 (Body exceeded 1 MB limit) قبل ما يوصل السيرفر أكشن أصلاً.
  experimental: {
    serverActions: {
      bodySizeLimit: "7mb",
    },
  },
};

export default nextConfig;
