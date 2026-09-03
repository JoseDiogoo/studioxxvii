import Link from "next/link";
import LogoBadge from "../LogoBadge";
import styles from "./legal.module.css";

export default function LegalHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.marca}>
        <LogoBadge size={36} />
        <span>STUDIO XXVII</span>
      </Link>
      <Link href="/" className={styles.voltar}>← Voltar ao site</Link>
    </header>
  );
}
