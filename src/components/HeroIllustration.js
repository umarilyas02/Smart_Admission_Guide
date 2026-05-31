export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 520 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blobs */}
      <ellipse cx="380" cy="200" rx="160" ry="160" fill="#EDE9FE" />
      <ellipse cx="420" cy="260" rx="100" ry="100" fill="#DDD6FE" opacity="0.6" />
      <circle cx="100" cy="80" r="40" fill="#F5F3FF" />

      {/* University building */}
      <rect x="170" y="170" width="180" height="160" rx="4" fill="#7C3AED" />
      <rect x="180" y="180" width="160" height="140" rx="2" fill="#6D28D9" />

      {/* Building windows */}
      <rect x="195" y="195" width="30" height="25" rx="3" fill="#C4B5FD" opacity="0.8" />
      <rect x="237" y="195" width="30" height="25" rx="3" fill="#C4B5FD" opacity="0.8" />
      <rect x="279" y="195" width="30" height="25" rx="3" fill="#C4B5FD" opacity="0.8" />
      <rect x="195" y="232" width="30" height="25" rx="3" fill="#A78BFA" opacity="0.7" />
      <rect x="237" y="232" width="30" height="25" rx="3" fill="#C4B5FD" opacity="0.9" />
      <rect x="279" y="232" width="30" height="25" rx="3" fill="#A78BFA" opacity="0.7" />

      {/* Building door */}
      <rect x="237" y="280" width="46" height="50" rx="3" fill="#4C1D95" />
      <circle cx="276" cy="306" r="3" fill="#DDD6FE" />

      {/* Pillars */}
      <rect x="182" y="170" width="10" height="160" rx="2" fill="#5B21B6" />
      <rect x="328" y="170" width="10" height="160" rx="2" fill="#5B21B6" />

      {/* Roof / pediment */}
      <polygon points="155,172 260,120 365,172" fill="#7C3AED" />
      <polygon points="165,172 260,128 355,172" fill="#6D28D9" />

      {/* Flag on top */}
      <rect x="257" y="90" width="3" height="34" fill="#4C1D95" />
      <rect x="260" y="90" width="20" height="14" rx="1" fill="#10B981" />

      {/* Ground */}
      <rect x="100" y="328" width="320" height="8" rx="4" fill="#DDD6FE" />
      <rect x="130" y="334" width="260" height="4" rx="2" fill="#C4B5FD" opacity="0.5" />

      {/* Trees */}
      <rect x="148" y="280" width="8" height="50" rx="2" fill="#5B21B6" opacity="0.4" />
      <ellipse cx="152" cy="270" rx="22" ry="26" fill="#059669" opacity="0.8" />
      <ellipse cx="152" cy="260" rx="16" ry="18" fill="#10B981" opacity="0.9" />

      <rect x="362" y="280" width="8" height="50" rx="2" fill="#5B21B6" opacity="0.4" />
      <ellipse cx="366" cy="270" rx="22" ry="26" fill="#059669" opacity="0.8" />
      <ellipse cx="366" cy="260" rx="16" ry="18" fill="#10B981" opacity="0.9" />

      {/* Student figure */}
      <circle cx="96" cy="218" r="22" fill="#FDE68A" />
      {/* Hair */}
      <ellipse cx="96" cy="202" rx="22" ry="12" fill="#1E1B4B" />
      <rect x="74" y="202" width="44" height="10" rx="2" fill="#1E1B4B" />
      {/* Body */}
      <rect x="72" y="238" width="48" height="55" rx="8" fill="#4F46E5" />
      {/* Collar */}
      <polygon points="96,240 88,252 96,250 104,252" fill="white" opacity="0.9" />
      {/* Arms */}
      <rect x="50" y="238" width="24" height="12" rx="6" fill="#4F46E5" />
      <rect x="118" y="238" width="24" height="12" rx="6" fill="#4F46E5" />
      {/* Hands */}
      <circle cx="47" cy="244" r="8" fill="#FDE68A" />
      <circle cx="145" cy="244" r="8" fill="#FDE68A" />
      {/* Legs */}
      <rect x="76" y="290" width="18" height="44" rx="6" fill="#1E1B4B" />
      <rect x="98" y="290" width="18" height="44" rx="6" fill="#1E1B4B" />
      {/* Shoes */}
      <ellipse cx="85" cy="334" rx="12" ry="6" fill="#111827" />
      <ellipse cx="107" cy="334" rx="12" ry="6" fill="#111827" />

      {/* Graduation cap on student */}
      <rect x="78" y="196" width="36" height="6" rx="1" fill="#1E1B4B" />
      <polygon points="96,188 76,198 116,198" fill="#312E81" />
      <rect x="113" y="196" width="2" height="12" fill="#312E81" />
      <circle cx="114" cy="210" r="4" fill="#FBBF24" />

      {/* Floating book left */}
      <g transform="rotate(-12, 42, 160)">
        <rect x="20" y="148" width="44" height="56" rx="3" fill="#7C3AED" />
        <rect x="24" y="152" width="36" height="48" rx="2" fill="#EDE9FE" />
        <rect x="20" y="148" width="6" height="56" rx="2" fill="#5B21B6" />
        <rect x="28" y="162" width="24" height="3" rx="1" fill="#7C3AED" opacity="0.5" />
        <rect x="28" y="170" width="20" height="3" rx="1" fill="#7C3AED" opacity="0.4" />
        <rect x="28" y="178" width="22" height="3" rx="1" fill="#7C3AED" opacity="0.4" />
      </g>

      {/* Floating book right */}
      <g transform="rotate(10, 430, 140)">
        <rect x="408" y="120" width="44" height="56" rx="3" fill="#10B981" />
        <rect x="412" y="124" width="36" height="48" rx="2" fill="#ECFDF5" />
        <rect x="408" y="120" width="6" height="56" rx="2" fill="#059669" />
        <rect x="416" y="134" width="24" height="3" rx="1" fill="#10B981" opacity="0.5" />
        <rect x="416" y="142" width="20" height="3" rx="1" fill="#10B981" opacity="0.4" />
        <rect x="416" y="150" width="22" height="3" rx="1" fill="#10B981" opacity="0.4" />
      </g>

      {/* Stars / sparkles */}
      <g fill="#FBBF24">
        <polygon points="440,80 443,72 446,80 454,80 448,85 450,93 443,88 436,93 438,85 432,80" opacity="0.9" />
        <polygon points="68,130 70,124 72,130 78,130 73,134 75,140 70,136 65,140 67,134 62,130" opacity="0.7" />
        <polygon points="460,310 462,305 464,310 469,310 465,313 467,318 462,315 457,318 459,313 455,310" opacity="0.8" />
      </g>

      {/* AI chip / badge floating */}
      <rect x="390" y="185" width="74" height="36" rx="10" fill="white" style={{filter:"drop-shadow(0 4px 12px rgba(109,40,217,0.2))"}} />
      <rect x="393" y="188" width="68" height="30" rx="8" fill="#F5F3FF" />
      <circle cx="407" cy="203" r="7" fill="#7C3AED" />
      <text x="403" y="207" fontSize="8" fill="white" fontWeight="bold">AI</text>
      <text x="418" y="200" fontSize="7" fill="#6D28D9" fontWeight="600">SAG AI</text>
      <text x="418" y="210" fontSize="6" fill="#A78BFA">Powered</text>

      {/* Merit badge floating */}
      <rect x="30" y="320" width="80" height="32" rx="10" fill="white" style={{filter:"drop-shadow(0 4px 12px rgba(16,185,129,0.2))"}} />
      <rect x="33" y="323" width="74" height="26" rx="8" fill="#ECFDF5" />
      <circle cx="46" cy="336" r="7" fill="#10B981" />
      <text x="43" y="339.5" fontSize="7" fill="white" fontWeight="bold">%</text>
      <text x="57" y="333" fontSize="6.5" fill="#059669" fontWeight="600">Merit Check</text>
      <text x="57" y="343" fontSize="6" fill="#6EE7B7">Instant Result</text>

      {/* Dotted path from student to building */}
      <path d="M 142 305 Q 190 295 220 290" stroke="#A78BFA" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
    </svg>
  );
}
