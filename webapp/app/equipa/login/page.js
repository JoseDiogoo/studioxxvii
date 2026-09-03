"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../equipa.module.css";
import LogoBadge from "../../LogoBadge";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) {
      setErro("Email ou password incorretos, ou demasiadas tentativas. Tenta novamente.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/equipa");
  }

  return (
    <div className={styles.loginPagina}>
      <form className={styles.loginCartao} onSubmit={onSubmit}>
        <div className={styles.loginBadge}>
          <LogoBadge size={64} />
        </div>
        <div className={styles.loginTitulo}>Studio XXVII — Admin</div>
        {erro && <div className={styles.erro}>{erro}</div>}
        <div className={styles.campo}>
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={styles.campo}>
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className={styles.botao} disabled={loading}>
          {loading ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
