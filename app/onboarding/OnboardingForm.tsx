"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OnboardingFormProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function OnboardingForm({ user }: OnboardingFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Availability states: null, "checking", "available", "unavailable"
  const [availability, setAvailability] = useState<"checking" | "available" | "unavailable" | null>(null);
  const [validationError, setValidationError] = useState("");

  // Debounced check for nickname uniqueness
  useEffect(() => {
    if (!username) {
      setAvailability(null);
      setValidationError("");
      return;
    }

    // Client-side validation regex: 3-30 chars, alphanumeric, hyphens, underscores
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      setAvailability("unavailable");
      setValidationError(
        "O nickname deve conter entre 3 e 30 caracteres e usar apenas letras, números, '-' ou '_'."
      );
      return;
    }

    setValidationError("");
    setAvailability("checking");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        
        if (data.available) {
          setAvailability("available");
        } else {
          setAvailability("unavailable");
          setValidationError(data.error || "Este nickname não está disponível.");
        }
      } catch (err) {
        console.error("Erro ao verificar nickname:", err);
        setAvailability(null);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availability !== "available" || !birthDate) {
      setError("Preencha todos os campos corretamente.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, birthDate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao salvar perfil.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Erro de rede. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Dynamic font loading */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Outfit:wght@100..900&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen relative bg-[#F6F0E8] flex items-center justify-center p-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-20 w-[350px] h-[350px] bg-[#E96B46]/20 top-[15%] left-[10%]"></div>
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-40 w-[300px] h-[300px] bg-white bottom-[10%] right-[10%]"></div>
        
        <div className="w-full max-w-[520px] bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] px-8 py-10 shadow-[0_6px_0_#2A1D19] z-10 text-center box-border relative">
          <div className="text-center mb-[30px]">
            <span className="inline-block px-3.5 py-1.5 bg-[#FFF2EE] border-[2.5px] border-[#2A1D19] rounded-full text-[#E96B46] text-[0.82rem] font-extrabold uppercase mb-4 shadow-[0_2px_0_#2A1D19]">Primeiro Acesso 🌟</span>
            <h1 className="bloom-logo text-[1.8rem] sm:text-[2.4rem] m-0 mb-3 tracking-tight leading-[1.1]">Complete seu Perfil</h1>
            <p className="text-[0.95rem] text-[#8C7D75] font-semibold m-0 leading-relaxed">Seja bem-vindo, <strong>{user.firstName}</strong>! Escolha seu nickname exclusivo e informe sua data de nascimento para começarmos.</p>
          </div>

          {error && <div className="bg-red-50 border-[2.5px] border-red-500 text-red-700 p-3.5 rounded-[14px] text-[0.95rem] mb-6 text-left font-bold">{error}</div>}
          {success && (
            <div className="bg-green-50 border-[2.5px] border-green-500 text-green-700 p-3.5 rounded-[14px] text-[0.95rem] mb-6 text-left font-bold">
              🎉 Perfil criado com sucesso! Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="username" className="text-[0.82rem] font-extrabold uppercase text-[#2A1D19] ml-1">Nickname Único (Username)</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8C7D75] font-extrabold text-[1.1rem] pointer-events-none">@</span>
                <input
                  id="username"
                  type="text"
                  placeholder="seu_nickname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  disabled={loading || success}
                  required
                  className="w-full bg-white border-[2.5px] border-[#2A1D19] rounded-[14px] px-4 py-3.5 font-sans text-[#2A1D19] text-[1rem] box-border transition-all duration-150 focus:outline-none focus:border-[#E96B46] pl-9 pr-[110px]"
                />
                
                {/* Real-time Indicator Badge */}
                {availability === "checking" && (
                  <span className="absolute right-3 text-[0.7rem] font-extrabold px-2.5 py-1 rounded-[8px] select-none pointer-events-none bg-gray-100 text-gray-500 border border-gray-300">Verificando...</span>
                )}
                {availability === "available" && (
                  <span className="absolute right-3 text-[0.7rem] font-extrabold px-2.5 py-1 rounded-[8px] select-none pointer-events-none bg-green-50 text-green-700 border-2 border-green-500">Disponível ✓</span>
                )}
                {availability === "unavailable" && username && (
                  <span className="absolute right-3 text-[0.7rem] font-extrabold px-2.5 py-1 rounded-[8px] select-none pointer-events-none bg-red-50 text-red-700 border-2 border-red-500">Indisponível ✗</span>
                )}
              </div>
              {validationError && <p className="text-red-600 text-[0.8rem] mt-1 ml-1 leading-normal font-bold">{validationError}</p>}
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="birthDate" className="text-[0.82rem] font-extrabold uppercase text-[#2A1D19] ml-1">Data de Nascimento</label>
              <input
                id="birthDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={loading || success}
                required
                className="w-full bg-white border-[2.5px] border-[#2A1D19] rounded-[14px] px-4 py-3.5 font-sans text-[#2A1D19] text-[1rem] box-border transition-all duration-150 focus:outline-none focus:border-[#E96B46]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success || availability !== "available" || !birthDate}
              className="bg-[#E96B46] text-white border-[2.5px] border-[#2A1D19] rounded-[30px] p-4 text-[1.05rem] font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center mt-2.5 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[2px] hover:shadow-[0_6px_0_#2A1D19] active:translate-y-[1.5px] active:shadow-[0_1.5px_0_#2A1D19] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="w-[22px] h-[22px] border-3 border-white/40 rounded-full border-t-white animate-spin"></span>
              ) : (
                "Finalizar e Entrar 🚀"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
