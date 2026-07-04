/**
 * Site 100% estático (GitHub Pages, Netlify, etc.).
 *
 * Para GitHub Pages em "project site" (daviarndt.github.io/type-the-truth),
 * defina NEXT_PUBLIC_BASE_PATH="/type-the-truth" no build — o workflow de
 * deploy já faz isso. Vazio = hospedado na raiz (domínio próprio).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // Reexpõe para o código do cliente (usado em fetch da Bíblia, SW, manifest).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
