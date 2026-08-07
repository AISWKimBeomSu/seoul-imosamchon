"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw,
    });
    if (error) {
      setErr("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.");
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="admin-wrap" style={{ maxWidth: 440 }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.3rem" }}>
        관리자 로그인
      </h1>
      <p className="sec-sub" style={{ marginBottom: "1.4rem" }}>
        서울이모삼촌 운영자 전용 페이지입니다.
      </p>
      <form className="card" onSubmit={onSubmit}>
        {err && <div className="alert err">{err}</div>}
        <div className="field">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="the.0ne021111@gmail.com"
          />
        </div>
        <div className="field">
          <label htmlFor="pw">비밀번호</label>
          <input
            id="pw"
            type="password"
            className="input"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </main>
  );
}
