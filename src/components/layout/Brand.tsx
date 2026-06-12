export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <div
      className="brand-mark"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M6 5h12" />
        <path d="M12 5v14" />
        <path d="M8.5 12.5h7" />
      </svg>
    </div>
  );
}
