"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMap: Record<string, string> = {
        google_cancelled: "O login com o Google foi cancelado.",
        no_code: "Código de autenticação do Google não fornecido.",
        token_exchange_failed: "Falha ao validar os tokens com o Google.",
        fetch_userinfo_failed: "Não foi possível obter os dados do perfil do Google.",
        email_not_provided: "O Google não forneceu um endereço de e-mail associado à sua conta.",
        internal_error: "Ocorreu um erro interno de servidor. Tente novamente.",
      };
      setError(errorMap[errorParam] || "Ocorreu um erro durante a autenticação externa.");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("Erro de rede. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Outfit:wght@100..900&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen relative bg-[#F6F0E8] flex items-center justify-center p-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-20 w-[350px] h-[350px] bg-[#E96B46]/20 top-[15%] left-[10%]"></div>
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-40 w-[300px] h-[300px] bg-white bottom-[10%] right-[10%]"></div>

        <div className="w-full max-w-[420px] bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] px-8 py-10 shadow-[0_6px_0_#2A1D19] z-10 text-center box-border">
          <div className="text-center">
            <span className="text-[2.5rem] inline-block mb-3 filter drop-shadow-[0_2px_0_rgba(42,29,25,0.15)]">🌹</span>
            <h1 className="bloom-logo text-[1.8rem] sm:text-[2.4rem] m-0 mb-1.5 tracking-tight leading-[1.1]">Holy Streaks</h1>
            <p className="text-[0.88rem] text-[#8C7D75] font-semibold m-0 mb-7 leading-relaxed">Entre para ofertar suas rosas diárias e rezar com amigos.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-[2.5px] border-red-500 text-red-700 p-3 rounded-[14px] text-[0.85rem] mb-5 text-left font-bold">
              {error}
            </div>
          )}

          <form method="POST" onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[0.82rem] font-extrabold uppercase text-[#2A1D19] ml-1">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="nome@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white border-[2.5px] border-[#2A1D19] rounded-[14px] px-3.5 py-2.5 font-sans text-[#2A1D19] text-[0.95rem] box-border transition-all duration-150 focus:outline-none focus:border-[#E96B46]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[0.82rem] font-extrabold uppercase text-[#2A1D19] ml-1">Senha</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Sua senha secreta"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white border-[2.5px] border-[#2A1D19] rounded-[14px] px-3.5 py-2.5 font-sans text-[#2A1D19] text-[0.95rem] box-border transition-all duration-150 focus:outline-none focus:border-[#E96B46]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#E96B46] text-white border-[2.5px] border-[#2A1D19] rounded-[30px] p-3 text-[0.95rem] font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center mt-2 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[2px] hover:shadow-[0_6px_0_#2A1D19] active:translate-y-[1.5px] active:shadow-[0_1.5px_0_#2A1D19] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="w-[18px] h-[18px] border-2 border-white/40 rounded-full border-t-white animate-spin"></span>
              ) : (
                "Entrar na Conta"
              )}
            </button>
          </form>

          <div className="flex items-center text-center my-6 text-[#8C7D75] text-[0.78rem] font-bold before:content-[''] before:flex-1 before:border-b before:border-[#2A1D19]/10 after:content-[''] after:flex-1 after:border-b after:border-[#2A1D19]/10">
            <span className="px-2 uppercase">ou continue com</span>
          </div>

          <div className="flex flex-col gap-3.5">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-2 bg-white border-[2.5px] border-[#2A1D19] text-[#2A1D19] no-underline p-3 rounded-[30px] font-extrabold text-[0.9rem] transition-all duration-150 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[2px] hover:shadow-[0_6px_0_#2A1D19] active:translate-y-[1.5px] active:shadow-[0_1.5px_0_#2A1D19]"
            >
              <span className="text-[1.1rem]">🔑</span>
              Entrar com conta Google
            </a>

            <a href="/signup" className="text-[0.85rem] text-[#8C7D75] no-underline mt-2 inline-block font-semibold">
              Não tem uma conta? <strong className="text-[#E96B46] hover:underline">Cadastre-se grátis</strong>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif", color: "#3f2d34" }}>Carregando portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
