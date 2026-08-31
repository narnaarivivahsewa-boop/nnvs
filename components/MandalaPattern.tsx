export default function MandalaPattern({
  className = "w-64 h-64 text-[#D1A764]/20",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer concentric rings */}
      <circle cx="200" cy="200" r="195" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="200" cy="200" r="165" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      <circle cx="200" cy="200" r="25" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <circle cx="200" cy="200" r="8" fill="currentColor" opacity="0.9" />

      {/* 16 Radial Petals */}
      {[...Array(16)].map((_, i) => {
        const angle = (i * 360) / 16;
        return (
          <g key={`petal-${i}`} transform={`rotate(${angle} 200 200)`}>
            {/* Outer Petal Arch */}
            <path
              d="M200 20 C220 70 230 110 200 140 C170 110 180 70 200 20 Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.05"
            />
            {/* Mid Petal */}
            <path
              d="M200 60 C215 95 215 115 200 140 C185 115 185 95 200 60 Z"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Inner Flower Petal */}
            <path
              d="M200 100 C210 120 210 135 200 155 C190 135 190 120 200 100 Z"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.8"
            />
            {/* Outer Ray Tip */}
            <circle cx="200" cy="15" r="3" fill="currentColor" opacity="0.7" />
            <line x1="200" y1="140" x2="200" y2="180" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          </g>
        );
      })}

      {/* 24 Outer scalloped curves */}
      {[...Array(24)].map((_, i) => {
        const angle = (i * 360) / 24;
        return (
          <g key={`scallop-${i}`} transform={`rotate(${angle} 200 200)`}>
            <circle cx="200" cy="30" r="4" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </g>
        );
      })}
    </svg>
  );
}
