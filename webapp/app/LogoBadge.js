import styles from "./LogoBadge.module.css";

export default function LogoBadge({ size = 96 }) {
  return (
    <div className={styles.badge} style={{ width: size, height: size, fontSize: size / 8 }}>
      <span className={styles.studio}>STUDIO</span>
      <span className={styles.rule} />
      <span className={styles.ano}>XXVII</span>
    </div>
  );
}
