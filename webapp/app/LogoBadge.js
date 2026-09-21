import styles from "./LogoBadge.module.css";

export default function LogoBadge({ size = 96 }) {
  const compacto = size < 60;
  const base = size / 8;

  return (
    <div className={styles.badge} style={{ width: size, height: size }}>
      {compacto ? (
        <span className={styles.anoCompacto} style={{ fontSize: Math.max(size * 0.34, 12) }}>
          XXVII
        </span>
      ) : (
        <>
          <span className={styles.studio} style={{ fontSize: Math.max(base * 0.82, 11) }}>
            STUDIO
          </span>
          <span className={styles.rule} />
          <span className={styles.ano} style={{ fontSize: Math.max(base, 13) }}>
            XXVII
          </span>
        </>
      )}
    </div>
  );
}
