"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera } from "lucide-react";

interface DailyRosaryWidgetProps {
  onStreakUpdate?: (newStreak: number) => void;
  autoTriggerUpload?: boolean;
  onUploadTriggered?: () => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function DailyRosaryWidget({
  onStreakUpdate,
  autoTriggerUpload,
  onUploadTriggered
}: DailyRosaryWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [todayPhotoUrl, setTodayPhotoUrl] = useState<string | null>(null);
  const [loggedDates, setLoggedDates] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [firstRecordDate, setFirstRecordDate] = useState<string | null>(null);

  // Custom Instruction Modal State
  const [showInstructionModal, setShowInstructionModal] = useState(false);

  // Calendar states
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-trigger upload instructions modal if requested
  useEffect(() => {
    if (autoTriggerUpload && !loading && !hasLoggedToday) {
      handleStartRegister();
      if (onUploadTriggered) {
        onUploadTriggered();
      }
    }
  }, [autoTriggerUpload, loading, hasLoggedToday]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/user/rosary-log?timezone=${encodeURIComponent(timezone)}`);
      const data = await res.json();

      if (res.ok) {
        setStreak(data.currentStreak);
        setHasLoggedToday(data.hasLoggedToday);
        setTodayPhotoUrl(data.todayPhotoUrl);
        setLoggedDates(data.loggedDates || []);
        setFirstRecordDate(data.firstRecordDate || null);
      } else {
        setErrorMsg(data.error || "Erro ao buscar status diário.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Por favor, envie apenas arquivos de imagem.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("A imagem não deve exceder 8MB.");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg(null);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timezone", timezone);

      const res = await fetch("/api/user/rosary-log", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStreak(data.currentStreak);
        setHasLoggedToday(true);
        setTodayPhotoUrl(data.photoUrl);

        // Append today's date to loggedDates list
        const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: timezone });
        setLoggedDates((prev) => [...prev, todayStr]);
        setFirstRecordDate((prev) => prev || todayStr);

        if (onStreakUpdate) {
          onStreakUpdate(data.currentStreak);
        }
      } else {
        setErrorMsg(data.error || "Erro ao enviar log.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleStartRegister = () => {
    setShowInstructionModal(true);
  };

  // Calendar rendering helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDay = firstDay.getDay(); // 0: Sunday, 1: Monday...
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    // Pad days before start day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Add real days
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  };

  const isDayLogged = (dayNum: number) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dayStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
    return loggedDates.includes(dayStr);
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  if (loading) {
    return (
      <div className="bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] p-[30px] mb-[30px] flex flex-col gap-[15px] h-[140px] justify-center animate-pulse shadow-[0_4.5px_0_#2A1D19]">
        <div className="w-[40%] h-[24px] rounded-[6px] bg-[#2A1D19]/10"></div>
        <div className="w-[75%] h-[16px] rounded-[4px] bg-[#2A1D19]/5"></div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();

  return (
    <div className="daily-rosary-view-card !p-3 sm:!p-8">
      {/* Floating Action Button (FAB) for Mobile screens - hidden when logged */}
      {!hasLoggedToday && (
        <button
          className="mobile-fab-rosary"
          onClick={handleStartRegister}
          disabled={uploading}
          title="Registrar Terço de Hoje"
          aria-label="Registrar Terço"
        >
          {uploading ? <span className="spinner-fab"></span> : "🌹 +"}
        </button>
      )}

      {/* Instruction Modal Popup */}
      {showInstructionModal && (
        <div className="modal-overlay-instruction" onClick={() => setShowInstructionModal(false)}>
          <div className="modal-content instruction-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close-header">
              <h3>Registrar Terço</h3>
              <button className="close-x-btn" onClick={() => setShowInstructionModal(false)}>×</button>
            </div>

            <div className="instruction-modal-body text-left">
              <div className="flex justify-center w-full">
                <div className="instruction-icon-glow">📿</div>
              </div>
              <h4 className="text-center font-bold text-[#2A1D19] m-0 mb-1">Foto com seu Terço</h4>
              <p className="text-[0.88rem] text-[#8C7D75] leading-relaxed m-0 mb-4 text-center">
                Para confirmar a sua oração diária, tire ou envie uma foto segurando o seu terço na mão.
              </p>

              <div className="instruction-tip mb-4">
                <span className="tip-badge">Regra</span>
                <span className="font-semibold text-[#2A1D19] text-[0.8rem]">A foto deve mostrar o terço na sua mão.</span>
              </div>

              <button
                className="btn-open-camera"
                onClick={() => {
                  setShowInstructionModal(false);
                  triggerFileInput();
                }}
              >
                <Camera size={18} strokeWidth={2.5} className="inline-block mr-2 align-middle" />
                Abrir Câmera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outer Grid for Layout */}
      <div className="daily-view-layout-grid">

        {/* Left column: Actions & status */}
        <div className="flex flex-col text-left justify-between h-full">
          <div>
            <div className="rosary-action-title-row">
              <h2>Diário do Terço</h2>
              {streak > 0 && (
                <div className="rosary-streak-chunky-badge">
                  <span>🌹 {streak} {streak === 1 ? "rosa" : "rosas"}</span>
                </div>
              )}
            </div>

            {hasLoggedToday ? (
              <div className="mb-6">
                <h3 className="rosary-prompt-title">Oferta Concluída! 🌹✨</h3>
                <p className="rosary-prompt-desc">
                  Você ofertou sua rosa espiritual para Maria hoje! Seu terço está registrado e seu hábito está ativo.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="rosary-prompt-title">Marque sua Oração Diária</h3>
                <p className="rosary-prompt-desc">
                  Registre a sua oração enviando uma foto do terço concluído. Sua foto se tornará uma rosa no jardim de Nossa Senhora!
                </p>

                {errorMsg && <div className="alert-inline alert-inline-error mb-4">{errorMsg}</div>}

                <button
                  className="btn-terracotta-giant"
                  onClick={handleStartRegister}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-inline"></span>
                      Enviando rosa...
                    </>
                  ) : (
                    <>
                      <span>
                        <Camera size={18} strokeWidth={2.5} className="inline-block mr-2 align-middle" />
                        Registrar Terço de Hoje
                      </span>
                    </>
                  )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {/* Polaroid Preview of Today's Rosary */}
          {hasLoggedToday && todayPhotoUrl && (
            <div className="w-full flex justify-start mt-2">
              <div className="polaroid-frame-premium">
                <img
                  src={todayPhotoUrl}
                  alt="Seu Terço de Hoje"
                />
                <div className="polaroid-caption-premium">
                  <span>Hoje ✓</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Mary's Calendar */}
        <div>
          <div className="bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] p-3 sm:p-6 shadow-[0_5px_0_#2A1D19] select-none">
            <div className="flex justify-center items-center mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
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
                  onClick={handleNextMonth}
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
                    const isBeforeTracking = firstRecordDate ? fullDateStr < firstRecordDate : true;
                    const hasPrayed = loggedDates.includes(fullDateStr);

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
    </div>
  );
}
