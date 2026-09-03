import { IconTesoura, IconPente, IconNavalha, IconMaquina, IconPincel, IconFrasco } from "./BarberIcons";
import styles from "./ToolsWheel.module.css";

const FERRAMENTAS = [IconTesoura, IconPente, IconNavalha, IconMaquina, IconPincel, IconFrasco];

/** Anel de ícones de barbeiro a rodar em 3D à volta do conteúdo central (ex. o logótipo). */
export default function ToolsWheel({ children, size = 260 }) {
  const total = FERRAMENTAS.length;
  const itemSize = size * 0.2;
  return (
    <div className={styles.palco} style={{ width: size, height: size }}>
      <div className={styles.anel} aria-hidden="true">
        {FERRAMENTAS.map((Icone, i) => (
          <div
            key={i}
            className={styles.item}
            style={{
              width: itemSize,
              height: itemSize,
              marginLeft: -itemSize / 2,
              marginTop: -itemSize / 2,
              transform: `rotateY(${(360 / total) * i}deg) translateZ(${size * 0.46}px)`,
            }}
          >
            <Icone className={styles.icone} style={{ width: itemSize * 0.7, height: itemSize * 0.7 }} />
          </div>
        ))}
      </div>
      <div className={styles.centro}>{children}</div>
    </div>
  );
}
