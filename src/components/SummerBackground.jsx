export default function SummerBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sun */}
      <svg
        className="absolute -top-16 -right-16 w-72 h-72 opacity-50"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="60" fill="#F4C95D" />
        <g stroke="#F4C95D" strokeWidth="3" strokeLinecap="round">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            const x1 = 100 + Math.cos(a) * 75
            const y1 = 100 + Math.sin(a) * 75
            const x2 = 100 + Math.cos(a) * 95
            const y2 = 100 + Math.sin(a) * 95
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
        </g>
      </svg>

      {/* Birch leaves bottom-left */}
      <svg
        className="absolute -bottom-12 -left-10 w-80 h-80 opacity-30"
        viewBox="0 0 200 200"
        fill="none"
      >
        <g fill="#8FAA7A">
          <ellipse cx="50" cy="80" rx="22" ry="14" transform="rotate(-25 50 80)" />
          <ellipse cx="95" cy="60" rx="20" ry="13" transform="rotate(10 95 60)" />
          <ellipse cx="70" cy="120" rx="24" ry="15" transform="rotate(45 70 120)" />
          <ellipse cx="120" cy="105" rx="22" ry="14" transform="rotate(-15 120 105)" />
        </g>
        <g stroke="#5F7A4D" strokeWidth="1.5" fill="none">
          <path d="M50 80 L20 110" />
          <path d="M95 60 L80 30" />
          <path d="M70 120 L100 145" />
          <path d="M120 105 L155 95" />
        </g>
      </svg>

      {/* Soft strawberry top-left */}
      <svg
        className="absolute top-1/3 -left-8 w-24 h-24 opacity-25"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 25 Q70 25 75 45 Q75 75 50 90 Q25 75 25 45 Q30 25 50 25 Z"
          fill="#D45D5D"
        />
        <path d="M40 20 L50 30 L60 20 Q55 12 50 14 Q45 12 40 20 Z" fill="#5F7A4D" />
      </svg>
    </div>
  )
}
