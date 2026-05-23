"use client";

export default function LandingPage() {
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

        <div className="w-full max-w-[500px] bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] px-10 py-12 shadow-[0_6px_0_#2A1D19] z-10 text-center box-border relative">
          <div className="text-center">
            
            <img src="/app_logo.png" alt="Holy Streaks" className="h-16 object-contain mx-auto mb-6" />
            <p className="text-[1.05rem] text-[#8C7D75] font-semibold m-0 mb-10 leading-relaxed">
              Sua jornada espiritual e hábitos diários, compartilhados com quem você ama.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <a 
              href="/login" 
              className="bg-[#E96B46] text-white border-[2.5px] border-[#2A1D19] rounded-[30px] p-4 text-[1.05rem] font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center shadow-[0_4px_0_#2A1D19] hover:-translate-y-[2px] hover:shadow-[0_6px_0_#2A1D19] active:translate-y-[1.5px] active:shadow-[0_1.5px_0_#2A1D19] no-underline"
            >
              Fazer Login ➔
            </a>
            <a 
              href="/signup" 
              className="bg-white border-[2.5px] border-[#2A1D19] text-[#2A1D19] no-underline p-4 rounded-[30px] font-extrabold text-[1.05rem] transition-all duration-150 shadow-[0_4px_0_#2A1D19] hover:-translate-y-[2px] hover:shadow-[0_6px_0_#2A1D19] active:translate-y-[1.5px] active:shadow-[0_1.5px_0_#2A1D19] text-center"
            >
              Criar Nova Conta
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

