"use client";

import { useState, useEffect, useRef } from "react";
import { Home, Flower, Bell, User, LogOut, ArrowLeft, Camera, Pencil, Sparkles, Flame, Sun, Crown, Check, ChevronDown, ChevronUp } from "lucide-react";
import DailyRosaryWidget from "./DailyRosaryWidget";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  profilePhotoUrl?: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  endDate: string | null;
  createdAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePhotoUrl?: string | null;
  };
  role: string;
  joinedAt: string;
  memberCount: number;
}

interface Member {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePhotoUrl?: string | null;
  };
  streak: number;
  hasLoggedToday: boolean;
  todayPhotoUrl: string | null;
  todayLoggedAt?: string | null;
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

const sortMembers = (members: Member[]) => {
  return [...members].sort((a, b) => {
    // 1. Sort by streak (more roses first)
    if (b.streak !== a.streak) {
      return b.streak - a.streak;
    }

    // 2. If streaks are equal, compare logged today status (logged today first)
    if (a.hasLoggedToday && !b.hasLoggedToday) return -1;
    if (!a.hasLoggedToday && b.hasLoggedToday) return 1;

    // 3. If both logged today, compare log times (earlier first)
    if (a.hasLoggedToday && b.hasLoggedToday && a.todayLoggedAt && b.todayLoggedAt) {
      const timeA = new Date(a.todayLoggedAt).getTime();
      const timeB = new Date(b.todayLoggedAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
    }

    // 4. Default fallback: joined date
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
};

const getTodayMysteries = () => {
  const daysOfWeek = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  const todayIndex = new Date().getDay();
  const dayName = daysOfWeek[todayIndex];

  const mysteries = {
    gozosos: {
      title: "Mistérios Gozosos",
      description: "Contemplamos a alegria da Encarnação e da infância de Jesus.",
      icon: "✨",
      items: [
        "A Anunciação do Anjo e a Encarnação do Verbo",
        "A Visitação de Maria a sua prima Santa Isabel",
        "O Nascimento de Jesus na Gruta de Belém",
        "A Apresentação do Menino Jesus no Templo",
        "O Encontro do Menino Jesus no Templo entre os Doutores"
      ]
    },
    dolorosos: {
      title: "Mistérios Dolorosos",
      description: "Contemplamos a Paixão e a Morte Redentora de Cristo.",
      icon: "✝️",
      items: [
        "A Agonia de Jesus no Horto das Oliveiras",
        "A Flagelação de Nosso Senhor Jesus Cristo",
        "A Coroação de Espinhos de Nosso Senhor",
        "Jesus carregando a Cruz a caminho do Calvário",
        "A Crucificação e Morte de Nosso Senhor"
      ]
    },
    gloriosos: {
      title: "Mistérios Gloriosos",
      description: "Contemplamos a glória da Ressurreição e do Céu.",
      icon: "👑",
      items: [
        "A Ressurreição de Nosso Senhor Jesus Cristo",
        "A Ascensão de Jesus ao Céu",
        "A Vinda do Espírito Santo sobre os Apóstolos",
        "A Assunção de Nossa Senhora ao Céu",
        "A Coroação de Maria Santíssima no Céu"
      ]
    },
    luminosos: {
      title: "Mistérios Luminosos",
      description: "Contemplamos a vida pública e os milagres de Jesus.",
      icon: "💡",
      items: [
        "O Batismo de Jesus no Rio Jordão",
        "A Revelação de Jesus nas Bodas de Caná",
        "O Anúncio do Reino de Deus e o chamado à conversão",
        "A Transfiguração de Jesus no Monte Tabor",
        "A Instituição da Santíssima Eucaristia"
      ]
    }
  };

  let selected;
  if (todayIndex === 1 || todayIndex === 6) {
    selected = mysteries.gozosos;
  } else if (todayIndex === 2 || todayIndex === 5) {
    selected = mysteries.dolorosos;
  } else if (todayIndex === 3 || todayIndex === 0) {
    selected = mysteries.gloriosos;
  } else {
    selected = mysteries.luminosos;
  }

  return {
    dayName,
    ...selected
  };
};

interface GroupsDashboardProps {
  user: User;
  baseUrl?: string;
}

export default function GroupsDashboard({ user, baseUrl }: GroupsDashboardProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user.profilePhotoUrl || null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<{ members: Member[] } | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "diario" | "notificacoes" | "perfil">("home");
  const [autoTriggerUpload, setAutoTriggerUpload] = useState(false);

  const [currentUsername, setCurrentUsername] = useState<string>(user.username);
  const [showEditNicknameModal, setShowEditNicknameModal] = useState(false);
  const [newNickname, setNewNickname] = useState(user.username || "");
  const [editNicknameLoading, setEditNicknameLoading] = useState(false);
  const [editNicknameError, setEditNicknameError] = useState("");
  const [editNicknameSuccess, setEditNicknameSuccess] = useState(false);
  const [completedDecades, setCompletedDecades] = useState<number[]>([]);
  const [mysteriesCollapsed, setMysteriesCollapsed] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  const todayMysteries = getTodayMysteries();

  // Pending Challenge Invitations States
  interface Invitation {
    id: string;
    groupId: string;
    joinedAt: string;
    group: {
      id: string;
      name: string;
      description: string | null;
      endDate: string | null;
      creator: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
      };
    };
  }
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  // Create Challenge Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupEndDate, setNewGroupEndDate] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Invite Friend Form States
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Minimum date for datepicker is tomorrow
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };
  const minDate = getTomorrowString();

  const [userStreak, setUserStreak] = useState<number>(0);

  // Pending Invite Link & Join Requests States
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [moderationLoading, setModerationLoading] = useState<string | null>(null);

  // Fetch challenges, pending invites and rose streak on mount
  useEffect(() => {
    fetchGroups();
    fetchInvitations();
    fetchUserStreak();
  }, []);

  const fetchUserStreak = async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/user/rosary-log?timezone=${encodeURIComponent(timezone)}`);
      if (res.ok) {
        const data = await res.json();
        setUserStreak(data.currentStreak || 0);
        setHasLoggedToday(data.hasLoggedToday || false);
        if (data.hasLoggedToday) {
          setCompletedDecades([0, 1, 2, 3, 4]);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar streak de rosas:", err);
    }
  };

  const fetchInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const res = await fetch("/api/groups/invitations");
      const data = await res.json();
      if (res.ok) {
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Erro ao carregar convites:", err);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleAcceptInvite = async (membershipId: string) => {
    try {
      const res = await fetch(`/api/groups/invitations/${membershipId}`, {
        method: "POST",
      });
      if (res.ok) {
        setInvitations((prev) => prev.filter((item) => item.id !== membershipId));
        fetchGroups();
      }
    } catch (err) {
      console.error("Erro ao aceitar convite:", err);
    }
  };

  const handleDeclineInvite = async (membershipId: string) => {
    try {
      const res = await fetch(`/api/groups/invitations/${membershipId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvitations((prev) => prev.filter((item) => item.id !== membershipId));
      }
    } catch (err) {
      console.error("Erro ao recusar convite:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Erro ao carregar desafios:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/groups/${groupId}?timezone=${encodeURIComponent(timezone)}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedGroupDetails(data.group);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes do desafio:", err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          endDate: newGroupEndDate || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Erro ao criar desafio.");
        setCreateLoading(false);
        return;
      }

      setNewGroupName("");
      setNewGroupDesc("");
      setNewGroupEndDate("");
      setShowCreateModal(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
      setCreateError("Erro de rede. Tente novamente.");
      setCreateLoading(false);
    }
  };

  const handleInviteFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !inviteUsername.trim()) return;

    setInviteLoading(true);
    setInviteFeedback(null);

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inviteUsername }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInviteFeedback({
          type: "error",
          message: data.error || "Erro ao convidar usuário.",
        });
        setInviteLoading(false);
        return;
      }

      setInviteFeedback({
        type: "success",
        message: `🎉 Convite enviado para @${inviteUsername} com sucesso!`,
      });
      setInviteUsername("");

      // Refresh details & list
      fetchGroupDetails(selectedGroup.id);
      fetchGroups();
    } catch (err) {
      console.error(err);
      setInviteFeedback({
        type: "error",
        message: "Erro de rede ao convidar.",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!selectedGroup) return;
    const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const inviteUrl = `${base.replace(/\/$/, "")}/groups/${selectedGroup.id}/join`;
    navigator.clipboard.writeText(inviteUrl);
    setCopyLinkSuccess(true);
    setTimeout(() => setCopyLinkSuccess(false), 2000);
  };

  const handleAcceptRequest = async (membershipId: string) => {
    if (!selectedGroup) return;
    setModerationLoading(membershipId);
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/requests/${membershipId}`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchGroupDetails(selectedGroup.id);
        fetchGroups();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao aprovar solicitação.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao aprovar solicitação.");
    } finally {
      setModerationLoading(null);
    }
  };

  const handleRejectRequest = async (membershipId: string) => {
    if (!selectedGroup) return;
    const confirmed = window.confirm("Deseja recusar a entrada deste guerreiro no desafio?");
    if (!confirmed) return;

    setModerationLoading(membershipId);
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/requests/${membershipId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchGroupDetails(selectedGroup.id);
        fetchGroups();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao recusar solicitação.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao recusar solicitação.");
    } finally {
      setModerationLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja abandonar o desafio "${selectedGroup.name}"?\nSua participação e progresso neste desafio serão excluídos.`
    );
    if (!confirmed) return;

    setLeaveLoading(true);

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao abandonar o desafio.");
        setLeaveLoading(false);
        return;
      }

      // Success! Clear selection, go back, and refresh the groups list
      setSelectedGroup(null);
      setSelectedGroupDetails(null);
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert("Erro de rede. Tente novamente.");
    } finally {
      setLeaveLoading(false);
    }
  };

  const openGroupDetails = (group: Group) => {
    setSelectedGroup(group);
    setSelectedGroupDetails(null);
    setInviteFeedback(null);
    setInviteUsername("");
    fetchGroupDetails(group.id);
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const getDaysRemaining = (endDateStr: string | null) => {
    if (!endDateStr) return "Contínuo ♾️";
    const end = new Date(endDateStr);
    const today = new Date();
    // Compare dates ignoring hours
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Encerrado";
    if (diffDays === 0) return "Termina hoje ⚡";
    return `${diffDays} ${diffDays === 1 ? "dia restante" : "dias restantes"}`;
  };

  // Re-fetch challenges list and details when daily log is submitted
  const handleDailyStreakUpdate = (newStreak: number) => {
    setUserStreak(newStreak);
    setHasLoggedToday(true);
    setCompletedDecades([0, 1, 2, 3, 4]);
    fetchGroups();
    if (selectedGroup) {
      fetchGroupDetails(selectedGroup.id);
    }
  };

  // Determine if the currently selected challenge is over and calculate winners
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const endStr = selectedGroup?.endDate
    ? new Date(selectedGroup.endDate).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
    : null;
  const isChallengeOver = endStr ? todayStr > endStr : false;

  const acceptedMembers = selectedGroupDetails
    ? selectedGroupDetails.members.filter((m: any) => m.status === "ACCEPTED")
    : [];
  const maxStreak = acceptedMembers.length > 0
    ? Math.max(...acceptedMembers.map((m: any) => m.streak))
    : 0;
  const winners = (isChallengeOver && maxStreak > 0)
    ? acceptedMembers.filter((m: any) => m.streak === maxStreak)
    : [];

  const triggerProfilePhotoUpload = () => {
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.click();
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfilePhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/profile-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao fazer upload da foto de perfil.");
        return;
      }

      setProfilePhoto(data.profilePhotoUrl);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar a foto de perfil. Tente novamente.");
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;

    const trimmed = newNickname.trim().toLowerCase();

    // Client-side quick check
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(trimmed)) {
      setEditNicknameError("O nickname deve conter entre 3 e 30 caracteres e usar apenas letras, números, hífen (-) ou underline (_).");
      return;
    }

    setEditNicknameLoading(true);
    setEditNicknameError("");
    setEditNicknameSuccess(false);

    try {
      const res = await fetch("/api/user/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditNicknameError(data.error || "Erro ao atualizar o nickname.");
        setEditNicknameLoading(false);
        return;
      }

      setCurrentUsername(trimmed);
      setEditNicknameSuccess(true);

      // Delay closing modal slightly to show success checkmark
      setTimeout(() => {
        setShowEditNicknameModal(false);
        setEditNicknameSuccess(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setEditNicknameError("Erro de rede. Tente novamente.");
    } finally {
      setEditNicknameLoading(false);
    }
  };

  return (
    <>
      {/* Dynamic font loading */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Outfit:wght@100..900&display=swap"
        rel="stylesheet"
      />

      <div className="dashboard-container">
        <input
          type="file"
          ref={profilePhotoInputRef}
          onChange={handleProfilePhotoChange}
          accept="image/*"
          className="hidden"
        />

        {/* Top Navbar */}
        <header className="dashboard-header">
          <div className="logo-group">
            <span className="logo-icon">🌹</span>
            <h2 className="bloom-logo text-[1.4rem]">Holy Streaks</h2>
          </div>

          <div className="user-profile-widget max-[480px]:hidden">
            <div
              className="avatar-circle relative group cursor-pointer overflow-hidden border-[2.5px] border-[#2A1D19] flex items-center justify-center bg-peach"
              onClick={triggerProfilePhotoUpload}
              title="Clique para trocar sua foto de perfil"
            >
              {uploadingProfilePhoto ? (
                <span className="spinner-inline border-[2px] border-t-transparent border-[#2A1D19]"></span>
              ) : profilePhoto ? (
                <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover rounded-full" />
              ) : (
                getInitials(user.firstName, user.lastName)
              )}
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full">
                <Camera size={14} className="text-white" />
              </div>
            </div>
            <div className="user-info-text">
              <span className="user-name-label">{user.firstName} {user.lastName}</span>
              <span className="user-username-label">@{currentUsername}</span>
            </div>
            <a href="/api/auth/logout" className="logout-btn-nav" title="Sair da Conta">
              Sair
            </a>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="dashboard-body">

          {/* TAB 1: HOME (CHALLENGES LIST) */}
          {activeTab === "home" && (
            selectedGroup ? (
              <div className="inline-group-details-container animate-fade-in text-left">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                  {/* Back button */}
                  <button
                    className="flex items-center gap-1.5 bg-white border-[2.5px] border-[#2A1D19] text-[#2A1D19] font-extrabold px-2 pl-3 py-2.5 rounded-[30px] shadow-[0_3px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_4.5px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1.5px_0_#2A1D19] cursor-pointer text-[0.8rem] transition-all duration-150 uppercase"
                    onClick={() => { setSelectedGroup(null); setSelectedGroupDetails(null); }}
                  >
                    <ArrowLeft size={16} strokeWidth={2.5} className="inline-block mr-1.5 align-middle" />
                  </button>

                  {/* Leave challenge button with premium flat aesthetic */}
                  <button
                    className="flex items-center gap-1.5 bg-[#FFF2EE] border-[2.5px] border-[#E96B46] text-[#E96B46] font-extrabold px-5 py-2.5 rounded-[30px] shadow-[0_3px_0_#E96B46] hover:-translate-y-[1.5px] hover:shadow-[0_4.5px_0_#E96B46] active:translate-y-[1px] active:shadow-[0_1.5px_0_#E96B46] cursor-pointer text-[0.8rem] transition-all duration-150 uppercase"
                    onClick={handleLeaveGroup}
                    disabled={leaveLoading}
                  >
                    {leaveLoading ? (
                      <span className="spinner-inline border-[2px] border-t-transparent border-[#E96B46]"></span>
                    ) : (
                      <>
                        <LogOut size={16} strokeWidth={2.5} className="inline-block mr-1.5 align-middle" />
                        Abandonar Desafio
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                  {/* Left Column: Challenge Metadata and Today's Logged Rosaries */}
                  <div className="lg:col-span-2 flex flex-col gap-6">

                    {isChallengeOver && (
                      <div className="bg-[#F8E7CD] border-[3px] border-[#2A1D19] rounded-[28px] p-6 shadow-[0_5px_0_#2A1D19] text-center relative overflow-hidden animate-fade-in mb-2">
                        {/* Elegant floating laurels/stars in background */}
                        <div className="absolute -right-6 -bottom-6 text-[6rem] opacity-15 select-none pointer-events-none">🏆</div>
                        <div className="absolute -left-6 -top-6 text-[6rem] opacity-15 select-none pointer-events-none">🌹</div>

                        <span className="inline-block bg-[#E96B46] text-white text-[0.8rem] font-black px-4.5 py-1.5 rounded-[20px] border-[2.5px] border-[#2A1D19] shadow-[1.5px_1.5px_0_#2A1D19] uppercase tracking-wider mb-3">
                          🏆 Desafio Concluído!
                        </span>

                        <h3 className="text-[1.55rem] font-black text-[#2A1D19] m-0 mb-2 font-fredoka uppercase">
                          Grande Vencedor da Fé
                        </h3>

                        {winners.length > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-3 mt-4">
                            <div className="flex flex-wrap justify-center gap-3">
                              {winners.map(w => (
                                <div key={w.id} className="bg-white border-[2.5px] border-[#2A1D19] rounded-[20px] px-4.5 py-2.5 shadow-[2px_2px_0_#2A1D19] flex items-center gap-2">
                                  <span className="text-xl">👑</span>
                                  <div className="text-left">
                                    <div className="text-xs font-black text-[#2A1D19]">{w.user.firstName} {w.user.lastName}</div>
                                    <div className="text-[0.68rem] text-[#E96B46] font-bold">@{w.user.username}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-sm font-extrabold text-[#2A1D19]/80 m-0 mt-2 max-w-[400px] leading-relaxed">
                              Parabéns! Concluiu o desafio como o guerreiro com a maior oferta de rosas a Nossa Senhora com uma sequência de <strong>{maxStreak} {maxStreak === 1 ? "rosa" : "rosas"}</strong>! 🎉
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-[#8C7D75] m-0 mt-2">
                            Nenhum participante obteve rosas ativas durante o período do desafio. Que a Virgem Maria abençoe a todos! 🌹
                          </p>
                        )}
                      </div>
                    )}

                    <div className="group-meta-card">
                      <h2 className="text-[1.8rem] font-bold text-[#2A1D19] m-0 mb-3 font-fredoka">{selectedGroup.name}</h2>
                      <p className="group-desc-full text-base mb-6">{selectedGroup.description || "Este desafio não possui descrição."}</p>

                      <div className="challenge-dates-grid">
                        <div className="date-item">
                          <span className="date-item-label">Líder:</span>
                          <strong>{selectedGroup.creator.firstName} {selectedGroup.creator.lastName}</strong> (@{selectedGroup.creator.username})
                        </div>
                        <div className="date-item">
                          <span className="date-item-label">Meta Final:</span>
                          <strong>
                            {selectedGroup.endDate
                              ? new Date(selectedGroup.endDate).toLocaleDateString("pt-BR")
                              : "Tempo Indeterminado"}
                          </strong> ({getDaysRemaining(selectedGroup.endDate)})
                        </div>
                      </div>
                    </div>

                    {/* Today's Rosaries Photo Registry of Friends */}
                    <div className="bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] p-6 shadow-[0_4.5px_0_#2A1D19]">
                      <div className="flex justify-between items-center mb-5 gap-2">
                        <h4 className="text-[1.1rem] font-extrabold text-[#2A1D19] m-0 flex items-center gap-1.5 font-fredoka uppercase">
                          <span>🌹</span> Terços de Hoje
                        </h4>
                        {selectedGroupDetails && (
                          <span className="bg-[#E96B46] text-white text-[0.85rem] font-black px-3.5 py-1 rounded-[16px] border-[2.5px] border-[#2A1D19] shadow-[2px_2px_0_#2A1D19] flex-shrink-0">
                            {selectedGroupDetails.members.filter(m => m.status === "ACCEPTED" && m.hasLoggedToday).length}/
                            {selectedGroupDetails.members.filter(m => m.status === "ACCEPTED").length}
                          </span>
                        )}
                      </div>
                      {!selectedGroupDetails ? (
                        <div className="bg-white border-[2px] border-[#2A1D19]/10 rounded-[20px] p-4 text-center text-sm text-[#8C7D75]">
                          Buscando registros de hoje...
                        </div>
                      ) : selectedGroupDetails.members.filter(m => m.status === "ACCEPTED" && m.hasLoggedToday).length === 0 ? (
                        <div className="bg-white border-[2px] border-[#2A1D19]/10 rounded-[20px] p-6 text-center text-sm text-[#8C7D75]">
                          <span className="text-2xl block mb-1">🤍</span>
                          Nenhum registro ainda hoje.
                          <p className="text-[0.75rem] text-[#8C7D75] m-0 mt-1">Seja o primeiro a ofertar uma rosa a Nossa Senhora!</p>
                        </div>
                      ) : (
                        <div className="flex overflow-x-auto gap-4 pb-2.5 scrollbar-premium snap-x snap-mandatory text-left">
                          {selectedGroupDetails.members
                            .filter(m => m.status === "ACCEPTED" && m.hasLoggedToday)
                            .map((member) => (
                              <div key={member.id} className="min-w-[130px] w-[130px] sm:min-w-[150px] sm:w-[150px] flex-shrink-0 bg-[#FFF2EE] border-[2.5px] border-[#2A1D19] rounded-[24px] p-3.5 flex flex-col items-center shadow-[0_3px_0_#2A1D19] snap-start">
                                {/* Cathedral Arch/Dome shaped image preview, styled like BLOOM */}
                                <div className="w-full aspect-[4/5] rounded-t-[9999px] rounded-b-[16px] overflow-hidden bg-[#FFF2EE] border-[2.5px] border-[#2A1D19] mb-2.5 relative flex items-center justify-center">
                                  {member.todayPhotoUrl ? (
                                    <img
                                      src={member.todayPhotoUrl}
                                      alt={`Terço de ${member.user.firstName}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-[#E96B46] text-xs font-bold gap-1">
                                      <span className="text-xl">🌹</span>
                                      <span>Sem Foto</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-[0.82rem] font-extrabold text-[#2A1D19] truncate max-w-full">
                                  {member.user.firstName}
                                </span>
                                <span className="text-[0.72rem] text-[#E96B46] font-bold">
                                  @{member.user.username}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Invite Friend & Garden Members List */}
                  <div className="flex flex-col gap-6">
                    {/* Invite Friend Section - Only visible to Creator (Leader) and when challenge is active */}
                    {selectedGroup.role === "CREATOR" && !isChallengeOver && (
                      <div className="invite-friend-box">
                        <h4>Convidar Guerreiro por Nickname</h4>
                        <p className="invite-box-subtitle">O usuário convidado receberá um convite para aceitar ou recusar participar.</p>

                        {inviteFeedback && (
                          <div className={`alert-inline alert-inline-${inviteFeedback.type}`}>
                            {inviteFeedback.message}
                          </div>
                        )}

                        <form onSubmit={handleInviteFriend} className="invite-form-row">
                          <div className="invite-input-wrapper">
                            <span className="invite-at">@</span>
                            <input
                              type="text"
                              placeholder="username_do_amigo"
                              value={inviteUsername}
                              onChange={(e) => setInviteUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                              required
                              disabled={inviteLoading}
                            />
                          </div>
                          <button type="submit" className="invite-submit-btn" disabled={inviteLoading || !inviteUsername}>
                            {inviteLoading ? <span className="spinner-inline"></span> : "Adicionar"}
                          </button>
                        </form>

                        {/* Public Invite Link Option */}
                        <div className="border-t border-[#2A1D19]/10 mt-5 pt-4">
                          <h5 className="text-[0.82rem] font-extrabold text-[#2A1D19] m-0 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                            <span>🔗</span> Link de Convite do Grupo
                          </h5>
                          <p className="text-[0.72rem] text-[#8C7D75] font-semibold m-0 mb-3 leading-relaxed">
                            Qualquer pessoa com o link pode solicitar entrada. A entrada dependerá da sua aprovação.
                          </p>
                          <button
                            type="button"
                            onClick={handleCopyInviteLink}
                            className="w-full bg-[#FFF2EE] text-[#E96B46] border-[2.5px] border-[#E96B46] rounded-[24px] py-2.5 px-4 text-xs font-black cursor-pointer shadow-[0_2.5px_0_#E96B46] hover:-translate-y-[1px] hover:shadow-[0_3.5px_0_#E96B46] active:translate-y-[0.5px] active:shadow-[0_1px_0_#E96B46] transition-all duration-150 uppercase"
                          >
                            {copyLinkSuccess ? "✓ Copiado com Sucesso!" : "Copiar Link de Convite"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Join Requests Queue (Only visible to Creator) */}
                    {selectedGroup.role === "CREATOR" && selectedGroupDetails && selectedGroupDetails.members.filter(m => m.status === "REQUESTED").length > 0 && (
                      <div className="bg-[#FFF2EE] border-[2.5px] border-[#2A1D19] rounded-[28px] p-6 shadow-[0_4.5px_0_#2A1D19] text-left animate-fade-in">
                        <h4 className="text-[1.15rem] font-extrabold text-[#2A1D19] m-0 mb-1 flex items-center gap-1.5 font-fredoka uppercase">
                          <span>⏳</span> Solicitações de Entrada ({selectedGroupDetails.members.filter(m => m.status === "REQUESTED").length})
                        </h4>
                        <p className="text-[0.72rem] text-[#8C7D75] font-semibold m-0 mb-4 leading-relaxed">
                          Aprove ou recuse os guerreiros que solicitaram entrar neste desafio:
                        </p>

                        <div className="flex flex-col gap-3">
                          {selectedGroupDetails.members.filter(m => m.status === "REQUESTED").map((member) => (
                            <div
                              key={member.id}
                              className="bg-white border-[2px] border-[#2A1D19] rounded-[20px] p-3.5 shadow-[0_3.5px_0_#2A1D19] flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="w-9 h-9 rounded-full overflow-hidden border-[1.5px] border-[#2A1D19] bg-[#FFF2EE] flex items-center justify-center flex-shrink-0">
                                  {member.user.profilePhotoUrl ? (
                                    <img src={member.user.profilePhotoUrl} alt={member.user.firstName} className="w-full h-full object-cover" />
                                  ) : (
                                    getInitials(member.user.firstName, member.user.lastName)
                                  )}
                                </div>
                                <div className="truncate text-left">
                                  <div className="text-[0.8rem] font-black text-[#2A1D19] truncate">{member.user.firstName} {member.user.lastName}</div>
                                  <div className="text-[0.68rem] text-[#E96B46] font-bold">@{member.user.username}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => handleAcceptRequest(member.id)}
                                  disabled={moderationLoading === member.id}
                                  className="w-8 h-8 rounded-full bg-[#EBF7EE] border-[2px] border-[#2A1D19] text-[#3D6A5D] font-extrabold flex items-center justify-center shadow-[0_2px_0_#2A1D19] hover:-translate-y-[0.5px] hover:shadow-[0_2.5px_0_#2A1D19] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all duration-100 text-xs"
                                  title="Aprovar Entrada"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(member.id)}
                                  disabled={moderationLoading === member.id}
                                  className="w-8 h-8 rounded-full bg-red-50 border-[2px] border-[#2A1D19] text-red-600 font-extrabold flex items-center justify-center shadow-[0_2px_0_#2A1D19] hover:-translate-y-[0.5px] hover:shadow-[0_2.5px_0_#2A1D19] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all duration-100 text-xs"
                                  title="Recusar Entrada"
                                >
                                  ✗
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Members List Section */}
                    <div className="members-list-box">
                      <h4>Jardim de Rosas (Streaks)</h4>
                      {!selectedGroupDetails ? (
                        <div className="loading-state">
                          <span className="spinner"></span>
                          <p>Carregando guerreiros...</p>
                        </div>
                      ) : (
                        <div className="members-scrollable">
                          {/* Active Members */}
                          {sortMembers(selectedGroupDetails.members.filter(m => m.status === "ACCEPTED")).map((member, index) => {
                            const isFirst = index === 0;
                            return (
                              <div
                                key={member.id}
                                className={`member-list-item ${isFirst ? "first-place-highlight" : ""}`}
                              >
                                {isFirst && (
                                  <span className="absolute -top-3.5 -left-2 text-[1.6rem] rotate-[-15deg] drop-shadow-[0_1.5px_0_#2A1D19] z-10 select-none">
                                    👑
                                  </span>
                                )}
                                <div className="member-avatar overflow-hidden relative flex items-center justify-center">
                                  {member.user.profilePhotoUrl ? (
                                    <img src={member.user.profilePhotoUrl} alt={member.user.firstName} className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                    getInitials(member.user.firstName, member.user.lastName)
                                  )}
                                </div>

                                <div className="member-info">
                                  <span className="member-name">{member.user.firstName} {member.user.lastName}</span>
                                  <span className="member-handle">@{member.user.username}</span>
                                </div>

                                <div className="member-streak-column">
                                  <span className={`flame-badge-member ${member.streak > 0 ? "active-flame" : "inactive-flame"}`}>
                                    🌹 {member.streak} {member.streak === 1 ? "rosa" : "rosas"}
                                  </span>
                                </div>

                                <div className="member-role-col">
                                  {member.role === "CREATOR" ? (
                                    <span className="badge-role-gold">Líder</span>
                                  ) : (
                                    <span className="badge-role-grey">Membro</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Pending Invited Members */}
                          {selectedGroupDetails.members.filter(m => m.status === "PENDING").length > 0 && (
                            <>
                              <div className="border-t border-[#2A1D19]/10 my-4 pt-4 text-left">
                                <h5 className="text-[0.82rem] font-extrabold text-[#8C7D75] m-0 mb-3 flex items-center gap-1.5 uppercase">
                                  <span>⏳</span> Convites Pendentes ({selectedGroupDetails.members.filter(m => m.status === "PENDING").length})
                                </h5>
                              </div>
                              {selectedGroupDetails.members.filter(m => m.status === "PENDING").map((member) => (
                                <div key={member.id} className="member-list-item opacity-60">
                                  <div className="member-avatar bg-gray-150 text-gray-500 overflow-hidden relative flex items-center justify-center">
                                    {member.user.profilePhotoUrl ? (
                                      <img src={member.user.profilePhotoUrl} alt={member.user.firstName} className="w-full h-full object-cover rounded-full opacity-70" />
                                    ) : (
                                      getInitials(member.user.firstName, member.user.lastName)
                                    )}
                                  </div>

                                  <div className="member-info">
                                    <span className="member-name text-gray-500">{member.user.firstName} {member.user.lastName}</span>
                                    <span className="member-handle">@{member.user.username}</span>
                                  </div>

                                  <div className="member-streak-column">
                                    <span className="text-[0.8rem] bg-gray-100 text-gray-400 border border-gray-200/50 rounded-full px-2.5 py-1">
                                      Pendente
                                    </span>
                                  </div>

                                  <div className="member-role-col">
                                    <span className="badge-role-grey">Convidado</span>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <>
                <section className="welcome-banner">
                  <div className="welcome-banner-text">
                    <h1>Desafios de Fé 🌹</h1>
                    <p>Participe de desafios diários do terço com seus amigos. Cada terço concluído adiciona uma rosa ao jardim de Nossa Senhora!</p>
                  </div>

                  {/* Rose Counter Badge on page / */}
                  <div className="welcome-streak-badge flex">
                    <span className="welcome-streak-icon">🌹</span>
                    <div className="welcome-streak-info">
                      <span className="welcome-streak-count">{userStreak}</span>
                      <span className="welcome-streak-label">{userStreak === 1 ? "Rosa" : "Rosas"}</span>
                    </div>
                  </div>

                  <button className="create-group-btn-banner" onClick={() => setShowCreateModal(true)}>
                    + Criar Novo Desafio
                  </button>
                </section>

                {/* Mysteries of the Day Widget */}
                <section className={`mysteries-day-section bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] shadow-[0_4.5px_0_#2A1D19] mb-8 text-left relative overflow-hidden transition-all duration-300 ${mysteriesCollapsed ? "p-4" : "p-6"
                  }`}>
                  {/* Subtle background decoration - clean Lucide Flower vector */}
                  <div className="absolute right-[-20px] top-[-20px] text-[#E96B46] opacity-[0.04] pointer-events-none select-none">
                    <Flower size={mysteriesCollapsed ? 95 : 135} strokeWidth={1.5} className="transition-all duration-300" />
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#2A1D19]/10 pb-3">
                    <div>
                      <span className="text-[0.72rem] font-extrabold text-[#E96B46] uppercase tracking-wider block">
                        Mistérios de Hoje ({todayMysteries.dayName})
                      </span>
                      <h3 className="text-[1.4rem] font-black text-[#2A1D19] m-0 font-fredoka uppercase flex items-center gap-2 mt-0.5">
                        <span className="text-[1.45rem]">{todayMysteries.icon}</span>
                        {todayMysteries.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <span className="bg-[#FFF2EE] border-[2px] border-[#2A1D19] text-[#E96B46] text-[0.8rem] font-bold px-3.5 py-1 rounded-[16px] shadow-[1.5px_1.5px_0_#2A1D19]">
                        {completedDecades.length}/5 Mistérios
                      </span>
                      <button
                        onClick={() => setMysteriesCollapsed(!mysteriesCollapsed)}
                        className="flex items-center justify-center border-[2px] border-[#2A1D19] rounded-[10px] w-9 h-9 bg-[#F3EEEC] hover:bg-[#EAE2E0] transition-colors shadow-[1.5px_1.5px_0_#2A1D19] active:translate-y-[0.5px] active:shadow-[1px_1px_0_#2A1D19]"
                        title={!mysteriesCollapsed ? "Mostrar mistérios" : "Recolher mistérios"}
                      >
                        {!mysteriesCollapsed ? <ChevronDown size={18} strokeWidth={2.5} /> : <ChevronUp size={18} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>

                  {!mysteriesCollapsed && (
                    <div className="mt-4 flex flex-col gap-2.5 animate-fadeIn">
                      <span className="text-[0.72rem] font-black text-[#8C7D75] uppercase tracking-wider">
                        {hasLoggedToday ? "Terço do dia concluído 🌹" : "Toque nos números para marcar:"}
                      </span>
                      <div className="flex justify-around items-center">
                        {todayMysteries.items.map((item, idx) => {
                          const isCompleted = completedDecades.includes(idx);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (hasLoggedToday) return;
                                setCompletedDecades(prev => {
                                  const next = prev.includes(idx)
                                    ? prev.filter(i => i !== idx)
                                    : [...prev, idx];

                                  // When all 5 mysteries are checked off, redirect to Daily Rosary log and trigger the photo rules flow!
                                  if (next.length === 5) {
                                    setActiveTab("diario");
                                    setAutoTriggerUpload(true);
                                  }
                                  return next;
                                });
                              }}
                              className={`w-10 h-10 rounded-full border-[2.5px] border-[#2A1D19] font-black text-sm flex items-center justify-center transition-all duration-150 shadow-[2px_2px_0_#2A1D19] ${hasLoggedToday
                                ? "cursor-default opacity-90"
                                : "hover:-translate-y-[1px] hover:shadow-[2.5px_2.5px_0_#2A1D19] active:translate-y-[0.5px] active:shadow-[1px_1px_0_#2A1D19]"
                                } ${isCompleted
                                  ? "bg-[#3D6A5D] border-[#3D6A5D] text-white"
                                  : "bg-white text-[#2A1D19] hover:bg-[#F3EEEC]"
                                }`}
                              title={item}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {mysteriesCollapsed && (
                    <div className="transition-all duration-300 ease-in-out mt-4 animate-fadeIn">
                      <p className="text-sm text-[#8C7D75] font-semibold m-0 mb-5 leading-relaxed">
                        {todayMysteries.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {todayMysteries.items.map((item, idx) => {
                          const isCompleted = completedDecades.includes(idx);
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (hasLoggedToday) return;
                                setCompletedDecades(prev => {
                                  const next = prev.includes(idx)
                                    ? prev.filter(i => i !== idx)
                                    : [...prev, idx];

                                  // When all 5 mysteries are checked off, redirect to Daily Rosary log and trigger the photo rules flow!
                                  if (next.length === 5) {
                                    setActiveTab("diario");
                                    setAutoTriggerUpload(true);
                                  }
                                  return next;
                                });
                              }}
                              className={`select-none border-[2px] border-[#2A1D19] rounded-[20px] p-3.5 transition-all duration-150 relative flex flex-col justify-between min-h-[105px] shadow-[0_3px_0_#2A1D19] ${hasLoggedToday
                                ? "cursor-default opacity-90"
                                : "cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_4px_0_#2A1D19] active:translate-y-[0.5px] active:shadow-[0_2px_0_#2A1D19]"
                                } ${isCompleted ? "bg-[#EBF7EE] border-[#4F857D]" : "bg-white"
                                }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[0.7rem] font-black w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] border-[#2A1D19] transition-all duration-150 ${isCompleted ? "bg-[#3D6A5D] border-[#3D6A5D] text-white" : "bg-[#F3EEEC] text-[#8C7D75]"
                                  }`}>
                                  {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                                </span>
                              </div>
                              <p className={`text-[0.75rem] font-extrabold m-0 mt-3.5 leading-snug transition-all duration-150 ${isCompleted ? "text-[#3D6A5D] line-through opacity-75" : "text-[#2A1D19]"
                                }`}>
                                {item}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="groups-section-container">
                  <div className="section-header">
                    <h3>Meus Desafios Ativos ({groups.length})</h3>
                  </div>

                  {loading ? (
                    <div className="loading-state">
                      <span className="spinner-large"></span>
                      <p>Buscando seus desafios...</p>
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="empty-state-card">
                      <span className="empty-icon">🌹</span>
                      <h4>Nenhum desafio ativo</h4>
                      <p>Você não participa de nenhum desafio ainda. Crie um desafio ou peça para um amigo convidar você!</p>
                      <button className="create-group-btn-empty" onClick={() => setShowCreateModal(true)}>
                        Criar Primeiro Desafio
                      </button>
                    </div>
                  ) : (
                    <div className="groups-grid">
                      {groups.map((group) => {
                        const saint = getSaintImage(group.id);
                        return (
                          <div key={group.id} className="group-card" onClick={() => openGroupDetails(group)}>
                            <div className="group-card-cover-container">
                              <div className="group-card-cover-arch">
                                <img
                                  src={saint.url}
                                  alt={saint.name}
                                  className="group-card-cover-img"
                                />
                              </div>

                              {group.role === "CREATOR" ? (
                                <span className="group-card-badge-role">👑 Líder</span>
                              ) : (
                                <span className="group-card-badge-role">👑 {saint.name}</span>
                              )}

                              <div className="group-card-action-btn-overlay">
                                Ver Desafio ➔
                              </div>
                            </div>

                            <div className="group-card-content-area">
                              <h4 className="group-card-title">{group.name}</h4>
                              <p className="group-card-desc">
                                {group.description || "Sem descrição fornecida para este desafio."}
                              </p>

                              <div className="group-card-footer-metrics">
                                <div className="group-card-metric-badge">
                                  <span>{group.memberCount} {group.memberCount === 1 ? "guerreiro" : "guerreiros"}</span>
                                </div>
                                <div className="group-card-days-tag">
                                  <span>⏳</span>
                                  <span>{getDaysRemaining(group.endDate)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )
          )}

          {/* TAB 2: DIARIO (DAILY ROSARY LOG) */}
          {activeTab === "diario" && (
            <DailyRosaryWidget
              onStreakUpdate={handleDailyStreakUpdate}
              autoTriggerUpload={autoTriggerUpload}
              onUploadTriggered={() => setAutoTriggerUpload(false)}
            />
          )}

          {/* TAB 3: NOTIFICATION INVITATIONS */}
          {activeTab === "notificacoes" && (
            <section className="groups-section-container">
              <div className="section-header">
                <h3>Convites de Desafios ({invitations.length})</h3>
              </div>

              {invitationsLoading ? (
                <div className="loading-state">
                  <span className="spinner-large"></span>
                  <p>Buscando convites...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="empty-state-card">
                  <span className="empty-icon">🔔</span>
                  <h4>Nenhum convite pendente</h4>
                  <p>Você não possui convites pendentes no momento. Convide seus amigos para participarem dos seus desafios!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="bg-white border-[2.5px] border-[#2A1D19] rounded-[24px] p-6 flex flex-col justify-between shadow-[0_4.5px_0_#2A1D19]">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-[1.15rem] font-bold text-[#2A1D19] m-0">{invite.group.name}</h4>
                          <span className="text-[0.72rem] bg-[#FFF2EE] text-[#E96B46] border-[1.5px] border-[#2A1D19] rounded-full px-2.5 py-1 font-extrabold uppercase shadow-[0_1.5px_0_#2A1D19]">
                            Convite
                          </span>
                        </div>
                        <p className="text-[0.88rem] text-[#8C7D75] m-0 mb-4 leading-relaxed font-semibold">
                          {invite.group.description || "Este desafio não possui descrição."}
                        </p>
                        <div className="text-[0.82rem] text-[#2A1D19] mb-4 font-bold">
                          Convidado por: <span className="text-[#E96B46]">@{invite.group.creator.username}</span> ({invite.group.creator.firstName})
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAcceptInvite(invite.id)}
                          className="flex-1 bg-[#E96B46] text-white border-[2.5px] border-[#2A1D19] rounded-[20px] py-2 px-4 text-[0.88rem] font-extrabold cursor-pointer transition-all duration-150 shadow-[0_3px_0_#2A1D19] hover:-translate-y-[1.5px] hover:shadow-[0_4px_0_#2A1D19] active:translate-y-[1px] active:shadow-[0_1px_0_#2A1D19]"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(invite.id)}
                          className="bg-white hover:bg-red-50 text-gray-500 hover:text-red-700 border-[2.5px] border-gray-300 hover:border-red-500 rounded-[20px] py-2 px-4 text-[0.88rem] font-extrabold cursor-pointer transition-all duration-150"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 4: PROFILE CARD */}
          {activeTab === "perfil" && (
            <section className="groups-section-container">
              <div className="section-header">
                <h3>Seu Perfil</h3>
              </div>

              <div className="bg-white border-[2.5px] border-[#2A1D19] rounded-[28px] p-8 max-w-[480px] mx-auto text-center shadow-[0_6px_0_#2A1D19]">
                <div className="flex justify-center mb-4">
                  <div
                    className="w-[84px] h-[84px] rounded-full relative group cursor-pointer overflow-hidden border-[2.5px] border-[#2A1D19] flex items-center justify-center bg-[#FFF2EE] shadow-[0_3px_0_#2A1D19]"
                    onClick={triggerProfilePhotoUpload}
                    title="Clique para trocar sua foto de perfil"
                  >
                    {uploadingProfilePhoto ? (
                      <span className="spinner-inline border-[2px] border-t-transparent border-[#2A1D19] w-6 h-6"></span>
                    ) : profilePhoto ? (
                      <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="font-extrabold text-[1.8rem] text-[#E96B46]">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                </div>

                <h2 className="font-bold text-[#2A1D19] text-[1.5rem] m-0 mb-1">{user.firstName} {user.lastName}</h2>
                <div className="flex items-center justify-center gap-1.5 mb-6">
                  <p className="text-[#E96B46] font-extrabold text-[0.95rem] m-0">@{currentUsername}</p>
                  <button
                    onClick={() => {
                      setNewNickname(currentUsername);
                      setEditNicknameError("");
                      setEditNicknameSuccess(false);
                      setShowEditNicknameModal(true);
                    }}
                    className="text-[#8C7D75] hover:text-[#E96B46] cursor-pointer p-1 transition-colors duration-150 rounded-full hover:bg-[#FFF2EE]"
                    title="Editar Nickname"
                  >
                    <Pencil size={13} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="bg-[#F6F0E8] border-[2.5px] border-[#2A1D19] rounded-[20px] p-5 text-left mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-[#2A1D19]/10">
                    <span className="text-[0.85rem] text-[#8C7D75] font-semibold">E-mail cadastrado</span>
                    <span className="text-[0.88rem] text-[#2A1D19] font-bold">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#2A1D19]/10">
                    <span className="text-[0.85rem] text-[#8C7D75] font-semibold">Desafios ativos</span>
                    <span className="text-[0.88rem] text-[#2A1D19] font-bold">{groups.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[0.85rem] text-[#8C7D75] font-semibold">Identificação</span>
                    <span className="text-[0.72rem] bg-white border border-[#2A1D19]/15 rounded-md px-1.5 py-0.5 text-gray-500 font-mono select-all">
                      {user.id}
                    </span>
                  </div>
                </div>

                <a
                  href="/api/auth/logout"
                  className="bg-[#E96B46] text-white border-[2.5px] border-[#2A1D19] rounded-[30px] py-3.5 px-6 text-[0.95rem] font-extrabold cursor-pointer transition-all duration-150 flex items-center justify-center shadow-[0_4px_0_#2A1D19] hover:-translate-y-[2px] hover:shadow-[0_6px_0_#2A1D19] active:translate-y-[1.5px] active:shadow-[0_1.5px_0_#2A1D19] no-underline"
                >
                  🚪 Sair da Conta (Logout)
                </a>
              </div>
            </section>
          )}

        </main>



        {/* Create Challenge Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content create-group-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-close-header">
                <h3>Criar Novo Desafio</h3>
                <button className="close-x-btn" onClick={() => setShowCreateModal(false)}>×</button>
              </div>

              {createError && <div className="alert-inline alert-inline-error">{createError}</div>}

              <form onSubmit={handleCreateGroup} className="create-group-form">
                <div className="form-group-modal">
                  <label htmlFor="groupName">Nome do Desafio</label>
                  <input
                    id="groupName"
                    type="text"
                    placeholder="Ex: Terço das Rosas, 30 Dias de Oração"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                    maxLength={50}
                    disabled={createLoading}
                  />
                </div>

                <div className="form-group-modal">
                  <label htmlFor="groupDesc">Descrição (Opcional)</label>
                  <textarea
                    id="groupDesc"
                    placeholder="Quais são as intenções e regras deste desafio?"
                    rows={3}
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    disabled={createLoading}
                  />
                </div>

                <div className="form-group-modal">
                  <label htmlFor="groupEndDate">
                    Data de Término do Desafio <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "normal" }}>(Opcional)</span>
                  </label>
                  <input
                    id="groupEndDate"
                    type="date"
                    min={minDate}
                    value={newGroupEndDate}
                    onChange={(e) => setNewGroupEndDate(e.target.value)}
                    disabled={createLoading}
                  />
                  <span style={{ color: "var(--accent-terracotta)", fontSize: "0.75rem", marginTop: "4px", fontWeight: "bold" }}>
                    Deixe em branco para um desafio contínuo (tempo indeterminado) ♾️
                  </span>
                </div>

                <button type="submit" className="create-group-submit-btn" disabled={createLoading || !newGroupName.trim()}>
                  {createLoading ? <span className="spinner"></span> : "Criar Desafio 🚀"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Nickname Modal */}
        {showEditNicknameModal && (
          <div className="modal-overlay" onClick={() => setShowEditNicknameModal(false)}>
            <div className="modal-content create-group-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-close-header">
                <h3>Editar Seu Nickname</h3>
                <button className="close-x-btn" onClick={() => setShowEditNicknameModal(false)}>×</button>
              </div>

              {editNicknameError && <div className="alert-inline alert-inline-error">{editNicknameError}</div>}
              {editNicknameSuccess && (
                <div className="alert-inline alert-inline-success">
                  🎉 Nickname atualizado com sucesso!
                </div>
              )}

              <form onSubmit={handleUpdateNickname} className="create-group-form">
                <div className="form-group-modal">
                  <label htmlFor="editNickname">Novo Nickname</label>
                  <div className="invite-input-wrapper mt-1">
                    <span className="invite-at">@</span>
                    <input
                      id="editNickname"
                      type="text"
                      placeholder="seu_novo_nickname"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      required
                      maxLength={30}
                      disabled={editNicknameLoading || editNicknameSuccess}
                      style={{ paddingLeft: "26px" }}
                    />
                  </div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "6px", lineHeight: "1.4" }}>
                    Deve conter de 3 a 30 caracteres (apenas letras, números, hífen ou underline).
                  </span>
                </div>

                <button
                  type="submit"
                  className="create-group-submit-btn mt-2"
                  disabled={editNicknameLoading || editNicknameSuccess || !newNickname.trim() || newNickname.trim().toLowerCase() === currentUsername}
                >
                  {editNicknameLoading ? <span className="spinner"></span> : "Salvar Alterações"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Bottom Floating Navigation Bar */}
        <nav className="floating-nav-bar">
          <div
            onClick={() => setActiveTab("home")}
            className={`nav-item-wrapper ${activeTab === "home" ? "active" : ""}`}
            title="Desafios"
          >
            {activeTab === "home" ? (
              <div className="nav-active-circle">
                <Home className="nav-item-icon" size={20} strokeWidth={2.5} />
              </div>
            ) : (
              <Home className="nav-item-icon" size={20} strokeWidth={2.5} />
            )}
          </div>

          <div
            onClick={() => setActiveTab("diario")}
            className={`nav-item-wrapper ${activeTab === "diario" ? "active" : ""}`}
            title="Diário do Terço"
          >
            {activeTab === "diario" ? (
              <div className="nav-active-circle">
                <Flower className="nav-item-icon" size={20} strokeWidth={2.5} />
              </div>
            ) : (
              <Flower className="nav-item-icon" size={20} strokeWidth={2.5} />
            )}
          </div>

          {/* Central Highlighted + Action Button */}
          <div
            onClick={() => {
              setActiveTab("diario");
              setAutoTriggerUpload(true);
            }}
            className="nav-item-wrapper nav-item-wrapper-center-fab"
            title="Registrar Terço"
          >
            <div className="nav-center-fab-circle">
              <span className="nav-fab-plus-icon">+</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("notificacoes")}
            className={`nav-item-wrapper ${activeTab === "notificacoes" ? "active" : ""}`}
            title="Convites"
          >
            {activeTab === "notificacoes" ? (
              <div className="nav-active-circle">
                <Bell className="nav-item-icon" size={20} strokeWidth={2.5} />
              </div>
            ) : (
              <Bell className="nav-item-icon" size={20} strokeWidth={2.5} />
            )}
            {invitations.length > 0 && (
              <span className="nav-badge">{invitations.length}</span>
            )}
          </div>

          <div
            onClick={() => setActiveTab("perfil")}
            className={`nav-item-wrapper ${activeTab === "perfil" ? "active" : ""}`}
            title="Meu Perfil"
          >
            {activeTab === "perfil" ? (
              <div className="nav-active-circle">
                <User className="nav-item-icon" size={20} strokeWidth={2.5} />
              </div>
            ) : (
              <User className="nav-item-icon" size={20} strokeWidth={2.5} />
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
