"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Flower, User, Calendar, Sparkles, ArrowRight, Lock, CheckCircle, Flame } from "lucide-react";

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePhotoUrl?: string | null;
}

interface GroupPublicInfo {
  id: string;
  name: string;
  description: string | null;
  endDate: string | null;
  creator: Creator;
  memberCount: number;
}

interface UserMembership {
  status: string;
  role: string;
}

const getSaintImage = (groupId: string) => {
  const saintImages = [
    {
      name: "Santa Teresinha",
      url: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "São Francisco",
      url: "https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Nossa Senhora",
      url: "https://images.unsplash.com/photo-1548625361-155defe219fa?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "São Miguel Arcanjo",
      url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "São José",
      url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "São Padre Pio",
      url: "https://images.unsplash.com/photo-1590075865003-e48277afd558?auto=format&fit=crop&w=600&q=80"
    }
  ];

  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = groupId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % saintImages.length;
  return saintImages[index];
};

export default function JoinGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const router = useRouter();
  const { groupId } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<GroupPublicInfo | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const saint = group ? getSaintImage(group.id) : { name: "", url: "" };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/groups/${groupId}/join`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível carregar as informações do convite.");
        setLoading(false);
        return;
      }

      setGroup(data.group);
      setMembership(data.userMembership);
      setIsLoggedIn(data.isLoggedIn);
    } catch (err) {
      console.error(err);
      setError("Erro de conexão. Verifique sua rede.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callback=/groups/${groupId}/join`);
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocorreu um erro ao enviar a solicitação.");
        setActionLoading(false);
        return;
      }

      setSuccessMessage(data.message);
      // Refresh details to update state
      await fetchGroupDetails();
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar solicitação de participação. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };

  const getDaysRemaining = (endDateStr: string | null) => {
    if (!endDateStr) return "Contínuo ♾️";
    const end = new Date(endDateStr);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Encerrado";
    if (diffDays === 0) return "Termina hoje ⚡";
    return `${diffDays} ${diffDays === 1 ? "dia restante" : "dias restantes"}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F0E8] flex flex-col items-center justify-center p-6">
        <span className="w-10 h-10 border-4 border-[#FFF2EE] border-t-[#E96B46] rounded-full animate-spin"></span>
        <p className="text-[#2A1D19] font-bold mt-4 font-sans text-sm">Carregando detalhes do convite...</p>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-[#F6F0E8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 border-[2.5px] border-red-500 flex items-center justify-center text-red-500 text-3xl mb-4 font-bold select-none">
          ⚠️
        </div>
        <h2 className="font-fredoka text-[1.4rem] text-[#2A1D19] font-black uppercase m-0 mb-2">Ops! Ocorreu um Problema</h2>
        <p className="text-[#8C7D75] text-[0.9rem] font-semibold max-w-[360px] m-0 mb-6 leading-relaxed">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-white border-[2.5px] border-[#2A1D19] text-[#2A1D19] font-extrabold px-6 py-2.5 rounded-[30px] shadow-[0_3px_0_#2A1D19] hover:-translate-y-[1px] hover:shadow-[0_4px_0_#2A1D19] active:translate-y-[0.5px] active:shadow-[0_1.5px_0_#2A1D19] cursor-pointer text-sm transition-all duration-150 uppercase"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Outfit:wght@100..900&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen relative bg-[#F6F0E8] flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-20 w-[350px] h-[350px] bg-[#E96B46]/25 top-[15%] left-[5%]"></div>
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-40 w-[300px] h-[300px] bg-white bottom-[10%] right-[5%]"></div>

        <div className="w-full max-w-[460px] bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] p-6 sm:p-8 shadow-[0_6px_0_#2A1D19] z-10 text-center box-border animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-center gap-1.5 mb-5 select-none">
            <span className="text-2xl">🌹</span>
            <span className="font-fredoka text-[1.4rem] font-extrabold text-[#2A1D19] uppercase tracking-tight">Holy Streaks</span>
          </div>

          {/* Group Card Cover (Chunky Polaroid Arch) */}
          <div className="w-full aspect-[4/3] relative rounded-t-[9999px] rounded-b-[16px] overflow-hidden border-[2.5px] border-[#2A1D19] bg-[#FFF2EE] mb-6 flex items-center justify-center">
            {saint.url && (
              <img
                src={saint.url}
                alt={saint.name}
                className="w-full h-full object-cover select-none"
              />
            )}
         
          </div>

          {/* Title & Creator */}
          <h2 className="font-fredoka text-[1.6rem] text-[#2A1D19] font-black uppercase m-0 mb-1 leading-snug">
            {group?.name}
          </h2>
          <p className="text-xs font-semibold text-[#8C7D75] m-0 mb-4 flex items-center justify-center gap-1">
            Liderado por <strong className="text-[#E96B46]">@{group?.creator.username}</strong> ({group?.creator.firstName})
          </p>

          {/* Description */}
          <div className="bg-[#F6F0E8] border-[2px] border-[#2A1D19]/10 rounded-[20px] p-4 text-left mb-6">
            <p className="text-[#2A1D19]/80 font-medium text-[0.88rem] m-0 leading-relaxed">
              {group?.description || "Este desafio de fé e oração diária do terço foi criado para unir amigos em oração. Junte-se para cultivar um jardim de rosas espirituais!"}
            </p>
          </div>

          {/* Group Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white border-[2px] border-[#2A1D19] rounded-[20px] p-3 text-center shadow-[2px_2px_0_#2A1D19]">
              <div className="text-[#E96B46] text-xs font-black uppercase mb-0.5">Participantes</div>
              <strong className="text-[#2A1D19] text-base font-extrabold">{group?.memberCount} Guerreiros</strong>
            </div>
            <div className="bg-white border-[2px] border-[#2A1D19] rounded-[20px] p-3 text-center shadow-[2px_2px_0_#2A1D19]">
              <div className="text-[#E96B46] text-xs font-black uppercase mb-0.5">Duração</div>
              <strong className="text-[#2A1D19] text-[0.92rem] font-extrabold">{getDaysRemaining(group?.endDate || null)}</strong>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-[2px] border-red-500 text-red-700 p-3 rounded-[16px] text-xs font-bold text-left mb-5 leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="bg-[#EBF7EE] border-[2px] border-[#4F857D] text-[#3D6A5D] p-3 rounded-[16px] text-xs font-bold text-left mb-5 leading-relaxed">
              🎉 {successMessage}
            </div>
          )}

          {/* Action Box */}
          <div className="flex flex-col gap-3">
            {!isLoggedIn ? (
              <>
                <p className="text-xs font-extrabold text-[#8C7D75] m-0 mb-1 leading-snug">
                  🛡️ Você precisa de uma conta no Holy Streaks para solicitar entrada no desafio.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push(`/signup?callback=/groups/${groupId}/join`)}
                    className="w-full bg-[#E96B46] text-white border-[2.5px] border-[#2A1D19] rounded-[30px] py-3 px-6 text-sm font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_5px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1.5px_0_#2A1D19]"
                  >
                    Criar Conta Grátis
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => router.push(`/login?callback=/groups/${groupId}/join`)}
                    className="w-full bg-white text-[#2A1D19] border-[2.5px] border-[#2A1D19] rounded-[30px] py-3 px-6 text-sm font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_5px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1.5px_0_#2A1D19]"
                  >
                    Já tenho conta: Entrar
                  </button>
                </div>
              </>
            ) : (
              // Logged in states
              (() => {
                if (!membership) {
                  return (
                    <button
                      onClick={handleRequestJoin}
                      disabled={actionLoading}
                      className="w-full bg-[#E96B46] text-white border-[2.5px] border-[#2A1D19] rounded-[30px] py-3.5 px-6 text-sm font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_5px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1.5px_0_#2A1D19] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {actionLoading ? (
                        <span className="w-[18px] h-[18px] border-2 border-white/40 rounded-full border-t-white animate-spin"></span>
                      ) : (
                        <>
                          Solicitar Entrada no Desafio
                          <Sparkles size={16} strokeWidth={2.5} />
                        </>
                      )}
                    </button>
                  );
                }

                if (membership.status === "REQUESTED") {
                  return (
                    <div className="bg-[#FFF2EE] border-[2px] border-[#E96B46] rounded-[24px] p-4 text-center">
                      <span className="text-3xl block mb-1">⏳</span>
                      <strong className="text-[#E96B46] text-[0.88rem] font-black uppercase">Solicitação Pendente</strong>
                      <p className="text-[#8C7D75] text-xs font-semibold m-0 mt-1 max-w-[300px] mx-auto leading-relaxed">
                        Sua solicitação de participação foi enviada. Ela precisa ser aprovada pelo líder do grupo antes de você ter acesso completo.
                      </p>
                    </div>
                  );
                }

                if (membership.status === "PENDING") {
                  return (
                    <button
                      onClick={handleRequestJoin}
                      disabled={actionLoading}
                      className="w-full bg-[#3D6A5D] text-white border-[2.5px] border-[#2A1D19] rounded-[30px] py-3.5 px-6 text-sm font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_5px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1.5px_0_#2A1D19] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <span className="w-[18px] h-[18px] border-2 border-white/40 rounded-full border-t-white animate-spin"></span>
                      ) : (
                        <>
                          Aceitar Convite Pendente e Entrar!
                          <CheckCircle size={16} strokeWidth={2.5} />
                        </>
                      )}
                    </button>
                  );
                }

                if (membership.status === "ACCEPTED") {
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="bg-[#EBF7EE] border-[2px] border-[#4F857D] rounded-[24px] p-4 text-center">
                        <span className="text-3xl block mb-1">🎉</span>
                        <strong className="text-[#3D6A5D] text-[0.88rem] font-black uppercase">Você já participa!</strong>
                        <p className="text-[#8C7D75] text-xs font-semibold m-0 mt-1 max-w-[300px] mx-auto leading-relaxed">
                          Sua participação está ativa e você já faz parte do jardim de Nossa Senhora neste desafio.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/")}
                        className="w-full bg-white text-[#2A1D19] border-[2.5px] border-[#2A1D19] rounded-[30px] py-3.5 px-6 text-sm font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_5px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1.5px_0_#2A1D19]"
                      >
                        Ir para o Dashboard Principal
                      </button>
                    </div>
                  );
                }

                return null;
              })()
            )}
          </div>
        </div>
      </div>
    </>
  );
}
