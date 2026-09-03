function base(props) {
  return { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round", ...props };
}

export function IconTesoura(props) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="6" cy="6" r="2.4" />
      <line x1="8.3" y1="8" x2="19" y2="19" />
      <line x1="8.3" y1="16" x2="19" y2="5" />
    </svg>
  );
}

export function IconPente(props) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="4" rx="1" />
      <line x1="6.5" y1="8" x2="6.5" y2="20" />
      <line x1="9.5" y1="8" x2="9.5" y2="20" />
      <line x1="12.5" y1="8" x2="12.5" y2="20" />
      <line x1="15.5" y1="8" x2="15.5" y2="20" />
      <line x1="18.5" y1="8" x2="18.5" y2="20" />
    </svg>
  );
}

export function IconNavalha(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 13 L15 6 L21 8.5 L15 12 Z" />
      <line x1="15" y1="12" x2="20" y2="19" />
    </svg>
  );
}

export function IconMaquina(props) {
  return (
    <svg {...base(props)}>
      <rect x="8" y="3" width="8" height="14" rx="2" />
      <line x1="9.5" y1="17" x2="9.5" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="14.5" y1="17" x2="14.5" y2="21" />
    </svg>
  );
}

export function IconPincel(props) {
  return (
    <svg {...base(props)}>
      <path d="M9 10 L15 10 L13.2 3 L10.8 3 Z" />
      <line x1="12" y1="10" x2="12" y2="21" />
    </svg>
  );
}

export function IconFrasco(props) {
  return (
    <svg {...base(props)}>
      <rect x="7" y="9" width="10" height="12" rx="1.5" />
      <rect x="10" y="5" width="4" height="4" />
      <line x1="9" y1="3" x2="15" y2="3" />
    </svg>
  );
}
