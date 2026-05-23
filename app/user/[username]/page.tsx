"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flower, Lock, CheckCircle, Flame, Calendar, Sparkles } from "lucide-react";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePhotoUrl?: string | null;
  showPrayerPhotos: boolean;
  streak: number;
  hasLoggedToday: boolean;
  todayPhotoUrl?: string | null;
  isSelf: boolean;
  completedDates?: string[];
  firstRecordDate?: string | null;
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const router = useRouter();
  const { username } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());

  useEffect(() => {
    fetchProfileDetails();
  }, [username]);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/user/${username}?timezone=${encodeURIComponent(timezone)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível carregar o perfil deste guerreiro.");
        setLoading(false);
        return;
      }

      setProfile(data.profile);
    } catch (err) {
      console.error(err);
      setError("Erro ao se conectar ao servidor. Verifique sua rede.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F0E8] flex flex-col items-center justify-center p-6">
        <span className="w-10 h-10 border-4 border-[#FFF2EE] border-t-[#E96B46] rounded-full animate-spin"></span>
        <p className="text-[#2A1D19] font-bold mt-4 font-sans text-sm">Buscando perfil do guerreiro...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F6F0E8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 border-[2.5px] border-red-500 flex items-center justify-center text-red-500 text-3xl mb-4 font-bold select-none">
          ⚠️
        </div>
        <h2 className="font-fredoka text-[1.4rem] text-[#2A1D19] font-black uppercase m-0 mb-2">Guerreiro não Encontrado</h2>
        <p className="text-[#8C7D75] text-[0.9rem] font-semibold max-w-[360px] m-0 mb-6 leading-relaxed">
          {error || "O perfil solicitado não pôde ser encontrado em nosso jardim espiritual."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-white border-[2.5px] border-[#2A1D19] text-[#2A1D19] font-extrabold px-6 py-2.5 rounded-[30px] shadow-[0_3px_0_#2A1D19] hover:-translate-y-[1px] hover:shadow-[0_4px_0_#2A1D19] active:translate-y-[0.5px] active:shadow-[0_1.5px_0_#2A1D19] cursor-pointer text-sm transition-all duration-150 uppercase"
        >
          Voltar ao Início
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
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-20 w-[350px] h-[350px] bg-[#E96B46]/25 top-[10%] right-[5%]"></div>
        <div className="absolute rounded-full blur-[120px] pointer-events-none opacity-40 w-[300px] h-[300px] bg-white bottom-[15%] left-[5%]"></div>

        {/* Back Button */}
        <div className="w-full max-w-[440px] mb-4 text-left z-10 select-none">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 bg-white border-[2.5px] border-[#2A1D19] text-[#2A1D19] font-extrabold px-4 py-2.5 rounded-[30px] shadow-[0_3px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_4.5px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1.5px_0_#2A1D19] cursor-pointer text-[0.8rem] transition-all duration-150 uppercase"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Voltar
          </button>
        </div>

        {/* Profile Card Container */}
        <div className="w-full max-w-[440px] bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] p-6 sm:p-8 shadow-[0_6px_0_#2A1D19] z-10 text-center box-border animate-fade-in">
          {/* Avatar ampliado */}
          <div className="flex justify-center mb-4">
            <div className="w-[90px] h-[90px] rounded-full overflow-hidden border-[2.5px] border-[#2A1D19] bg-[#FFF2EE] flex items-center justify-center shadow-[0_3.5px_0_#2A1D19] select-none">
              {profile.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl}
                  alt={profile.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-extrabold text-[2rem] text-[#E96B46]">
                  {getInitials(profile.firstName, profile.lastName)}
                </span>
              )}
            </div>
          </div>

          {/* Name & Username */}
          <h2 className="font-fredoka text-[1.6rem] text-[#2A1D19] font-black uppercase m-0 mb-1 leading-snug">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-[#E96B46] font-extrabold text-[0.95rem] m-0 mb-5 select-text">
            @{profile.username}
          </p>

          {/* Rose Counter Badge (Streak) */}
          <div className="bg-[#FFF2EE] border-[2.5px] border-[#2A1D19] rounded-[24px] p-4 text-center shadow-[0_3.5px_0_#2A1D19] flex items-center justify-center gap-3.5 mb-6 select-none animate-pulse">
            <span className="text-[2.2rem] filter drop-shadow-[0_2px_0_rgba(42,29,25,0.15)]">🌹</span>
            <div className="text-left">
              <strong className="text-[#2A1D19] text-[1.4rem] font-black font-fredoka uppercase block leading-none">
                {profile.streak} {profile.streak === 1 ? "Rosa" : "Rosas"}
              </strong>
              <span className="text-[0.72rem] text-[#8C7D75] font-bold block mt-0.5">
                sequência ativa no jardim espiritual
              </span>
            </div>
          </div>

          {/* Today's prayer photo (Cathedral Dome structure) */}
          <div className="text-left border-t border-[#2A1D19]/10 pt-5">
            <h4 className="text-[1rem] font-extrabold text-[#2A1D19] m-0 mb-4 flex items-center gap-1.5 font-fredoka uppercase select-none">
              <span>⛪</span> Oração de Hoje
            </h4>

            {(() => {
              // Case 1: Has logged today and photo is public
              if (profile.hasLoggedToday && profile.todayPhotoUrl && profile.todayPhotoUrl !== "private") {
                return (
                  <div className="w-full max-w-[280px] mx-auto bg-white border-[2.5px] border-[#2A1D19] rounded-t-[9999px] rounded-b-[24px] p-3 shadow-[0_4.5px_0_#2A1D19] box-border animate-fadeIn">
                    <div className="w-full aspect-[4/5] rounded-t-[9999px] rounded-b-[16px] overflow-hidden border-[2.5px] border-[#2A1D19] bg-[#FFF2EE] relative flex items-center justify-center">
                      <img
                        src={profile.todayPhotoUrl}
                        alt={`Terço de hoje de ${profile.firstName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-fredoka text-[0.8rem] font-bold text-center mt-3 text-[#2A1D19] uppercase tracking-wide">
                      🌹 Rosa Ofertada Hoje!
                    </div>
                  </div>
                );
              }

              // Case 2: Has logged today but photo is PRIVATE
              if (profile.hasLoggedToday && profile.todayPhotoUrl === "private") {
                return (
                  <div className="bg-[#FFF2EE] border-[2px] border-[#2A1D19] rounded-[24px] p-6 text-center shadow-[0_3px_0_#2A1D19] animate-fadeIn">
                    <div className="w-12 h-12 rounded-full border-[2px] border-[#2A1D19] bg-white flex items-center justify-center text-[#E96B46] mx-auto mb-3 shadow-[0_2px_0_#2A1D19] select-none">
                      <Lock size={20} strokeWidth={2.5} />
                    </div>
                    <strong className="text-[#E96B46] text-[0.85rem] font-black uppercase">Registro de Hoje Privado</strong>
                    <p className="text-[#8C7D75] text-[0.75rem] font-semibold m-0 mt-1 max-w-[260px] mx-auto leading-relaxed">
                      Este guerreiro prefere manter as fotos de suas ofertas diárias de terço privadas.
                    </p>
                  </div>
                );
              }

              // Case 3: Has NOT logged today
              return (
                <div className="bg-white border-[2px] border-[#2A1D19]/10 rounded-[24px] p-6 text-center select-none">
                  <span className="text-3xl block mb-1 filter opacity-65">🤍</span>
                  <strong className="text-[#8C7D75] text-[0.82rem] font-extrabold uppercase">Nenhuma rosa hoje ainda</strong>
                  <p className="text-[0.72rem] text-[#8C7D75] font-semibold m-0 mt-0.5 max-w-[240px] mx-auto leading-normal">
                    Este guerreiro ainda não registrou o terço diário hoje. Que Maria o fortaleça!
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Calendário de Rosas */}
          <div className="text-left border-t border-[#2A1D19]/10 pt-6 mt-6 select-none">
            <div className="flex justify-center items-center mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((prev) => prev - 1);
                    } else {
                      setCurrentMonth((prev) => prev - 1);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-[#FFF2EE] border-[2px] border-[#2A1D19] rounded-full shadow-[0_2px_0_#2A1D19] active:translate-y-[1px] active:shadow-none hover:-translate-y-[0.5px] cursor-pointer font-bold text-[#E96B46] text-xs transition-all duration-75 select-none"
                  title="Mês Anterior"
                >
                  ❮
                </button>
                <span className="text-[0.78rem] font-extrabold text-[#2A1D19] uppercase font-sans tracking-wide min-w-[90px] text-center">
                  {[
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Set",
                    "Out",
                    "Nov",
                    "Dez"
                  ][currentMonth]} {currentYear}
                </span>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((prev) => prev + 1);
                    } else {
                      setCurrentMonth((prev) => prev + 1);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-[#FFF2EE] border-[2px] border-[#2A1D19] rounded-full shadow-[0_2px_0_#2A1D19] active:translate-y-[1px] active:shadow-none hover:-translate-y-[0.5px] cursor-pointer font-bold text-[#E96B46] text-xs transition-all duration-75 select-none"
                  title="Próximo Mês"
                >
                  ❯
                </button>
              </div>
            </div>

            {(() => {
              const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const pad = (n: number) => String(n).padStart(2, "0");

              const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              const todayStr = new Intl.DateTimeFormat("en-CA", {
                timeZone: localTimezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(new Date());

              return (
                <div className="grid grid-cols-7 gap-0.5 bg-[#FFF2EE]/40 border-[2px] border-[#2A1D19]/10 rounded-[20px] p-1 sm:p-3.5">
                  {/* Weekdays */}
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dLabel, i) => (
                    <div key={i} className="text-center text-[0.62rem] font-black text-[#8C7D75] uppercase pb-1.5 select-none">
                      {dLabel}
                    </div>
                  ))}

                  {/* Empty cells offset */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const fullDateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
                    const isFuture = fullDateStr > todayStr;
                    const isBeforeTracking = profile.firstRecordDate ? fullDateStr < profile.firstRecordDate : true;
                    const hasPrayed = profile.completedDates?.includes(fullDateStr);

                    let cellStyle = "bg-[#F6F0E8] border-[#2A1D19]/10 text-[#8C7D75]/40";
                    let emoji = "";

                    if (isFuture) {
                      cellStyle = "bg-[#F6F0E8]/50 border-[#2A1D19]/5 text-[#8C7D75]/25";
                    } else if (isBeforeTracking) {
                      cellStyle = "bg-[#F6F0E8] border-[#2A1D19]/15 text-[#8C7D75]/50";
                    } else {
                      // Within active tracking
                      if (hasPrayed) {
                        cellStyle = "bg-[#EBF7EE] border-[#2A1D19] text-[#2A1D19] shadow-[0_1.5px_0_#2A1D19] sm:shadow-[0_2px_0_#2A1D19]";
                        emoji = "🌹";
                      } else {
                        if (fullDateStr === todayStr) {
                          cellStyle = "bg-white border-[#E96B46] border-dashed text-[#E96B46] animate-pulse";
                          emoji = "🤍";
                        } else {
                          cellStyle = "bg-[#FFF2EE] border-[#2A1D19] text-[#2A1D19] shadow-[0_1.5px_0_#2A1D19] sm:shadow-[0_2px_0_#2A1D19]";
                          emoji = "🥀";
                        }
                      }
                    }

                    return (
                      <div
                        key={`day-${dayNum}`}
                        className={`aspect-square rounded-[10px] sm:rounded-[14px] border-[1.5px] sm:border-[2px] flex flex-col items-center justify-center relative p-0 sm:p-0.5 transition-all duration-100 ${cellStyle}`}
                      >
                        <span className="text-[0.6rem] font-bold block leading-none select-none">
                          {dayNum}
                        </span>
                        {emoji && (
                          <span className="text-[0.88rem] sm:text-[1.05rem] mt-0.5 leading-none block select-none">
                            {emoji}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Legenda do Calendário */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center text-[0.68rem] text-[#8C7D75] font-semibold border-t border-[#2A1D19]/5 pt-3">
              <div className="flex items-center gap-1">
                <span>🌹</span> Rosa Ofertada
              </div>
              <div className="flex items-center gap-1">
                <span>🥀</span> Rosa Murcha
              </div>
              <div className="flex items-center gap-1">
                <span>🤍</span> Hoje (Pendente)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
