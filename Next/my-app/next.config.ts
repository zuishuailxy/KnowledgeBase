import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: false, // 启用组件缓存
  images: {
    remotePatterns: [
      {
        protocol: "https", // 协议
        hostname: "eo-img.521799.xyz", // 主机名
        pathname: "/i/pc/**", // 路径
        port: "", // 端口
      },
    ],
    deviceSizes:[640, 750, 828, 1080, 1200, 1920, 2048, 3840], // 设备尺寸
    imageSizes:[16, 32, 48, 64, 96, 128, 256, 384], // 图片尺寸
  },
};

export default nextConfig;
