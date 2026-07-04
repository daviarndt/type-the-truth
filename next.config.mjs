/** @type {import('next').NextConfig} */
const nextConfig = {
  // Site 100% estático — exporta HTML/JS puro em ./out (GitHub Pages, Netlify, etc.)
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  // Sem trailing slash → URLs limpas em hosts estáticos
  trailingSlash: false,
};

export default nextConfig;
