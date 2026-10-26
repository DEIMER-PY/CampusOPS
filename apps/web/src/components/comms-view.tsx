"use client";

import {
  AlertTriangle,
  AtSign,
  BellRing,
  Box,
  CornerDownLeft,
  Cpu,
  Grid2X2,
  Hash,
  Laptop,
  Megaphone,
  MessageSquare,
  Send,
  ShieldAlert,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { useCampusSocket } from "@/hooks/use-campus-socket";
import type { Resource, Space } from "./workspace-shared";

const ROLES_LIST = [
  { value: "ADMIN", label: "Administrador General", color: "#c084fc" },
  { value: "FORMACION", label: "Formación & Aulas", color: "#38bdf8" },
  { value: "SOPORTE", label: "Soporte Técnico", color: "#2dd4bf" },
  { value: "MARKETING", label: "Marketing & Alianzas", color: "#fbbf24" },
  { value: "COWORKING", label: "Co-working & Estudio", color: "#67e8f9" },
  {
    value: "FULL_SERVICE",
    label: "Full Service & Logística",
    color: "#4ade80",
  },
  { value: "CLONAI", label: "ClonAI & Innovación", color: "#a855f7" },
];

export function CommsView({
  socket,
  spaces,
  resources,
  role,
}: {
  socket: ReturnType<typeof useCampusSocket>;
  spaces: Space[];
  resources: Resource[];
  role: string;
}) {
  const {
    activeChannel,
    channels,
    members,
    messages,
    presence,
    mentionAlert,
    errorMessage,
    joinChannel,
    sendMessage,
    dismissMentionAlert,
    updateMemberRole,
  } = socket;

  const [inputContent, setInputContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [selectedEntityInfo, setSelectedEntityInfo] = useState<{
    type: "space" | "resource" | "user";
    id?: string;
    name: string;
    detail: string;
    badge: string;
    currentRole?: string;
  } | null>(null);

  const [updatingUserRole, setUpdatingUserRole] = useState(false);
  const [roleUpdateNotice, setRoleUpdateNotice] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = role === "ADMIN";
  const currentChannelObj = useMemo(
    () => channels.find((c) => c.slug === activeChannel),
    [channels, activeChannel],
  );

  const isBroadcastChannel =
    currentChannelObj?.isBroadcastOnly ?? activeChannel === "avisos-generales";
  // All areas can post anywhere, except #avisos-generales which is reserved for admins
  const canPostInCurrentChannel = !isBroadcastChannel || isAdmin;

  // Area representatives and admins can emit urgent announcements in their channel
  const canSendUrgent = useMemo(() => {
    if (isAdmin) return true;
    const areaChannelMap: Record<string, string[]> = {
      formacion: ["FORMACION"],
      "co-working": ["COWORKING"],
      "marketing-alianzas": ["MARKETING"],
      "soporte-tecnico": ["SOPORTE"],
      "full-service": ["FULL_SERVICE"],
      clonai: ["CLONAI"],
    };
    return Boolean(areaChannelMap[activeChannel]?.includes(role));
  }, [isAdmin, activeChannel, role]);

  // Auto scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll down when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Autocomplete suggestions based on @ (Members, Spaces, Resources)
  const filteredSuggestions = useMemo(() => {
    const q = mentionFilter.toLowerCase();

    // 1. Members
    const memberMatches = members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q),
      )
      .map((m) => ({
        type: "user" as const,
        id: m.id,
        tag: `@usuario:${m.name}`,
        label: m.name,
        sub: `Área: ${m.role} • ${m.email || "Campuslands"}`,
      }));

    // 2. Spaces
    const spaceMatches = spaces
      .filter((s) => s.name.toLowerCase().includes(q))
      .map((s) => ({
        type: "space" as const,
        id: s.id,
        tag: `@espacio:${s.name}`,
        label: s.name,
        sub: `Aforo: ${s.capacity} pax • ${s.status}`,
      }));

    // 3. Resources
    const resourceMatches = resources
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
      )
      .map((r) => ({
        type: "resource" as const,
        id: r.id,
        tag: `@equipo:${r.code}`,
        label: `${r.name} (${r.code})`,
        sub: `Estado: ${r.status}`,
      }));

    return [...memberMatches, ...spaceMatches, ...resourceMatches].slice(0, 10);
  }, [members, spaces, resources, mentionFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputContent(val);

    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf("@");

    if (lastAt !== -1 && !textBefore.slice(lastAt).includes(" ")) {
      setMentionMenuOpen(true);
      setMentionFilter(textBefore.slice(lastAt + 1));
    } else {
      setMentionMenuOpen(false);
    }
  };

  const insertMention = (tag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBefore = inputContent.slice(0, cursorPos);
    const textAfter = inputContent.slice(cursorPos);
    const lastAt = textBefore.lastIndexOf("@");

    let newText = "";
    if (lastAt !== -1 && !textBefore.slice(lastAt).includes(" ")) {
      newText = `${textBefore.slice(0, lastAt)}${tag} ${textAfter}`;
    } else {
      newText = `${inputContent} ${tag} `;
    }

    setInputContent(newText);
    setMentionMenuOpen(false);
    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  const handleSend = () => {
    const trimmed = inputContent.trim();
    if (!trimmed) return;
    if (!canPostInCurrentChannel) return;

    // Detect mentioned spaces, resources and users
    const spacesFound = Array.from(
      trimmed.matchAll(/@espacio:([a-zA-Z0-9_-]+)/g),
      (m) => m[1],
    );
    const resourcesFound = Array.from(
      trimmed.matchAll(/@equipo:([a-zA-Z0-9_-]+)/g),
      (m) => m[1],
    );
    const usersFound = Array.from(
      trimmed.matchAll(/@usuario:([^,;.!?\n@]+)/g),
      (m) => m[1].trim(),
    );

    const mentions =
      spacesFound.length || resourcesFound.length || usersFound.length
        ? {
            spaces: spacesFound.length ? spacesFound : undefined,
            resources: resourcesFound.length ? resourcesFound : undefined,
            users: usersFound.length ? usersFound : undefined,
          }
        : undefined;

    const success = sendMessage(
      trimmed,
      isUrgent && isAdmin ? "URGENT" : "NORMAL",
      mentions,
    );

    if (success) {
      setInputContent("");
      setIsUrgent(false);
      setMentionMenuOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserRole(true);
    setRoleUpdateNotice("");
    const ok = await updateMemberRole(userId, newRole);
    setUpdatingUserRole(false);
    if (ok) {
      setRoleUpdateNotice(`Área actualizada a ${newRole}.`);
      if (selectedEntityInfo) {
        setSelectedEntityInfo({
          ...selectedEntityInfo,
          currentRole: newRole,
          badge: `Área: ${newRole}`,
        });
      }
    } else {
      setRoleUpdateNotice("Error al actualizar área.");
    }
  };

  // Render text with clickable smart mentions for Spaces, Resources, and Members
  const renderMessageContent = (content: string) => {
    const parts = content.split(
      /(@espacio:[a-zA-Z0-9_-]+|@equipo:[a-zA-Z0-9_-]+|@usuario:[^,;.!?\n@]+)/g,
    );
    return parts.map((part, i) => {
      const partKey = `${part}-${i}`;

      // 1. Space Mention
      if (part.startsWith("@espacio:")) {
        const spaceName = part.replace("@espacio:", "");
        const spaceObj = spaces.find(
          (s) => s.name.toLowerCase() === spaceName.toLowerCase(),
        );
        return (
          <button
            key={partKey}
            type="button"
            className="smart-mention-pill smart-mention-space"
            onClick={() =>
              setSelectedEntityInfo({
                type: "space",
                name: spaceObj ? spaceObj.name : spaceName,
                detail: spaceObj
                  ? `Aforo para ${spaceObj.capacity} personas.`
                  : "Espacio no listado en el catálogo activo.",
                badge: spaceObj
                  ? `Estado: ${spaceObj.status}`
                  : "Espacio del Campus",
              })
            }
          >
            <Grid2X2 size={12} />
            <span>{spaceName}</span>
          </button>
        );
      }

      // 2. Resource Mention
      if (part.startsWith("@equipo:")) {
        const resourceCode = part.replace("@equipo:", "");
        const resObj = resources.find(
          (r) => r.code.toLowerCase() === resourceCode.toLowerCase(),
        );
        return (
          <button
            key={partKey}
            type="button"
            className="smart-mention-pill smart-mention-resource"
            onClick={() =>
              setSelectedEntityInfo({
                type: "resource",
                name: resObj ? `${resObj.name} (${resObj.code})` : resourceCode,
                detail: resObj
                  ? `Recurso registrado en el inventario de Campuslands.`
                  : "Equipo del campus.",
                badge: resObj ? `Estado: ${resObj.status}` : "Equipo",
              })
            }
          >
            <Laptop size={12} />
            <span>{resourceCode}</span>
          </button>
        );
      }

      // 3. User / Member Mention
      if (part.startsWith("@usuario:")) {
        const userName = part.replace("@usuario:", "");
        const memberObj = members.find(
          (m) => m.name.toLowerCase() === userName.toLowerCase(),
        );
        const memberRole = memberObj?.role || "MIEMBRO";
        return (
          <button
            key={partKey}
            type="button"
            className="smart-mention-pill smart-mention-user"
            onClick={() =>
              setSelectedEntityInfo({
                type: "user",
                id: memberObj?.id,
                name: memberObj ? memberObj.name : userName,
                detail: memberObj?.email
                  ? `Correo: ${memberObj.email}`
                  : "Miembro del campus.",
                badge: `Área: ${memberRole}`,
                currentRole: memberRole,
              })
            }
          >
            <User size={12} />
            <span>{userName}</span>
            <span
              className={`comms-role-mini role-${memberRole.toLowerCase()}`}
            >
              {memberRole}
            </span>
          </button>
        );
      }

      return <span key={partKey}>{part}</span>;
    });
  };

  return (
    <div className="comms-workspace-container">
      {/* TOAST DE MENCIÓN EN VIVO */}
      {mentionAlert && (
        <aside role="alert" className="mention-alert-toast">
          <button
            type="button"
            className="mention-alert-main-btn"
            onClick={() => {
              joinChannel(mentionAlert.channelSlug);
              dismissMentionAlert();
            }}
          >
            <div className="mention-alert-content">
              <BellRing size={16} className="text-accent animate-pulse" />
              <div>
                <strong>
                  {mentionAlert.authorName} ({mentionAlert.authorRole})
                </strong>{" "}
                te ha mencionado en <code>#{mentionAlert.channelSlug}</code>
                <p className="text-xs text-secondary mt-0.5">
                  {mentionAlert.content}
                </p>
              </div>
            </div>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              dismissMentionAlert();
            }}
          >
            <X size={15} />
          </button>
        </aside>
      )}

      {/* SIDEBAR DE CANALES */}
      <aside className="comms-sidebar">
        {/* CANAL OFICIAL / BROADCAST */}
        <div className="comms-channel-section">
          <span className="comms-section-label">CANAL OFICIAL</span>
          <button
            type="button"
            className={`comms-channel-item ${
              activeChannel === "avisos-generales" ? "is-active" : ""
            } is-broadcast`}
            onClick={() => joinChannel("avisos-generales")}
          >
            <div className="comms-channel-left">
              <Megaphone size={15} className="comms-broadcast-icon" />
              <span className="comms-channel-name">avisos-generales</span>
            </div>
            <span className="comms-channel-badge">Oficial</span>
          </button>
        </div>

        {/* CANALES DE ÁREAS OPERATIVAS (7 canales) */}
        <div className="comms-channel-section">
          <span className="comms-section-label">ÁREAS DEL CAMPUS</span>
          <div className="comms-channel-list">
            {channels
              .filter((c) => c.slug !== "avisos-generales")
              .map((channel) => {
                const isActive = activeChannel === channel.slug;

                // Pick an icon based on slug
                let IconComponent = Hash;
                if (channel.slug === "full-service") IconComponent = Truck;
                if (channel.slug === "clonai") IconComponent = Cpu;
                if (channel.slug === "soporte-tecnico") IconComponent = Laptop;

                return (
                  <button
                    key={channel.slug}
                    type="button"
                    className={`comms-channel-item ${isActive ? "is-active" : ""}`}
                    onClick={() => joinChannel(channel.slug)}
                  >
                    <div className="comms-channel-left">
                      <IconComponent size={14} className="comms-hash-icon" />
                      <span className="comms-channel-name">{channel.slug}</span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* PRESENCIA EN EL CANAL ACTIVO */}
        <div className="comms-presence-card">
          <div className="comms-presence-header">
            <Users size={14} />
            <span>En este canal ({presence.onlineCount})</span>
          </div>
          <div className="comms-presence-list">
            {presence.users.length === 0 ? (
              <span className="comms-presence-empty">
                Sin otros usuarios conectados
              </span>
            ) : (
              presence.users.map((u) => (
                <div key={u.id} className="comms-user-presence-row">
                  <span className="comms-presence-dot-live" />
                  <span className="comms-user-name" title={u.name}>
                    {u.name}
                  </span>
                  <span
                    className={`comms-user-role role-${u.role.toLowerCase()}`}
                  >
                    {u.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CHAT */}
      <section className="comms-main-pane">
        {/* HEADER DEL CANAL */}
        <header className="comms-chat-header">
          <div className="comms-header-info">
            <div className="comms-header-title-row">
              {isBroadcastChannel ? (
                <Megaphone size={18} className="text-accent" />
              ) : (
                <Hash size={18} className="text-secondary" />
              )}
              <h2 className="comms-channel-heading">#{activeChannel}</h2>
              {isBroadcastChannel && (
                <span
                  className="status-badge"
                  style={{ borderColor: "var(--accent)" }}
                >
                  Solo lectura para miembros
                </span>
              )}
            </div>
            <p className="comms-channel-desc">
              {currentChannelObj?.description ||
                "Canal en tiempo real para coordinar solicitudes y operaciones entre áreas."}
            </p>
          </div>

          <div className="comms-header-meta">
            <span className="comms-presence-indicator">
              <span className="comms-presence-indicator-dot" />
              {presence.onlineCount} presentes
            </span>
          </div>
        </header>

        {/* BANNER SI ES CANAL OFICIAL Y NO ES ADMIN */}
        {isBroadcastChannel && !isAdmin && (
          <div className="comms-broadcast-notice">
            <ShieldAlert size={16} />
            <span>
              Canal oficial de difusión de Campuslands. Solo administradores
              pueden emitir avisos aquí.
            </span>
          </div>
        )}

        {/* FEED DE MENSAJES */}
        <div className="comms-messages-scroll">
          {messages.length === 0 ? (
            <div className="comms-messages-empty">
              <MessageSquare size={32} className="opacity-30 mb-2" />
              <p>No hay mensajes en #{activeChannel} aún.</p>
              <span className="text-xs text-muted">
                {canPostInCurrentChannel
                  ? "Escribe una solicitud o mensaje para coordinar con esta área."
                  : "Espera los comunicados oficiales del campus."}
              </span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMsgUrgent = msg.priority === "URGENT";
              const timeFormatted = new Date(msg.createdAt).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

              return (
                <article
                  key={msg.id}
                  className={`comms-message-item ${
                    isMsgUrgent ? "is-urgent-message" : ""
                  }`}
                >
                  <div className="comms-message-avatar">
                    {msg.authorName.charAt(0).toUpperCase()}
                  </div>

                  <div className="comms-message-body">
                    <div className="comms-message-meta">
                      <span className="comms-author-name">
                        {msg.authorName}
                      </span>
                      <span
                        className={`status-badge role-pill role-${msg.authorRole.toLowerCase()}`}
                      >
                        {msg.authorRole}
                      </span>
                      {isMsgUrgent && (
                        <span className="comms-urgent-tag">
                          <BellRing size={11} className="inline mr-1" />
                          URGENTE
                        </span>
                      )}
                      <time
                        className="comms-message-time"
                        dateTime={msg.createdAt}
                      >
                        {timeFormatted}
                      </time>
                    </div>

                    <div className="comms-message-text">
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                </article>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* MODAL / TARJETA DE ENTIDAD O MIEMBRO SELECCIONADO */}
        {selectedEntityInfo && (
          <div className="comms-entity-modal">
            <div className="comms-entity-header">
              <div className="flex items-center gap-2">
                {selectedEntityInfo.type === "space" ? (
                  <Grid2X2 size={16} className="text-accent" />
                ) : selectedEntityInfo.type === "resource" ? (
                  <Box size={16} className="text-blue" />
                ) : (
                  <User size={16} className="text-accent" />
                )}
                <strong>{selectedEntityInfo.name}</strong>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setSelectedEntityInfo(null);
                  setRoleUpdateNotice("");
                }}
              >
                ✕
              </button>
            </div>

            <p className="text-sm mt-1 mb-2">{selectedEntityInfo.detail}</p>

            <div className="flex justify-between items-center text-xs flex-wrap gap-2">
              <span className="status-badge">{selectedEntityInfo.badge}</span>

              {/* Si es un miembro y el usuario logueado es ADMIN, permitir reasignar área */}
              {selectedEntityInfo.type === "user" &&
                selectedEntityInfo.id &&
                isAdmin && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted">Reasignar área:</span>
                    <select
                      disabled={updatingUserRole}
                      value={selectedEntityInfo.currentRole || "FORMACION"}
                      onChange={(e) =>
                        selectedEntityInfo.id &&
                        handleRoleChange(selectedEntityInfo.id, e.target.value)
                      }
                      className="text-xs p-1 rounded bg-black/40 border border-white/20"
                    >
                      {ROLES_LIST.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} ({r.value})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              <button
                type="button"
                className="button button-small"
                onClick={() => {
                  setSelectedEntityInfo(null);
                  setRoleUpdateNotice("");
                }}
              >
                Cerrar
              </button>
            </div>

            {roleUpdateNotice && (
              <p className="text-xs text-accent mt-2 font-semibold">
                ✓ {roleUpdateNotice}
              </p>
            )}
          </div>
        )}

        {/* ERROR MESSAGE NOTIFICATION */}
        {errorMessage && (
          <div className="comms-error-bar">
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* COMPOSER / ENTRADA DE MENSAJES */}
        <div className="comms-composer-container">
          {/* AUTOCOMPLETE POPUP (Miembros, Espacios y Equipos) */}
          {mentionMenuOpen && filteredSuggestions.length > 0 && (
            <div className="comms-mention-dropdown">
              <div className="comms-mention-header">Menciones sugeridas:</div>
              {filteredSuggestions.map((sug) => (
                <button
                  key={sug.tag}
                  type="button"
                  className="comms-mention-option"
                  onClick={() => insertMention(sug.tag)}
                >
                  <div className="flex items-center gap-2">
                    {sug.type === "user" ? (
                      <User size={13} className="text-purple-400" />
                    ) : sug.type === "space" ? (
                      <Grid2X2 size={13} className="text-accent" />
                    ) : (
                      <Box size={13} className="text-blue" />
                    )}
                    <strong>{sug.tag}</strong>
                  </div>
                  <span className="text-xs text-muted">{sug.sub}</span>
                </button>
              ))}
            </div>
          )}

          <div className="comms-composer-box">
            <textarea
              ref={textareaRef}
              rows={2}
              className="comms-composer-textarea"
              placeholder={
                canPostInCurrentChannel
                  ? `Escribe en #${activeChannel}… Usa @ para mencionar miembros (@usuario:Nombre), salas o equipos`
                  : `Canal restringido. Solo administradores pueden publicar.`
              }
              value={inputContent}
              disabled={!canPostInCurrentChannel}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            <div className="comms-composer-toolbar">
              <div className="comms-composer-tools-left">
                {/* Botón rápido para invocar mención */}
                <button
                  type="button"
                  className="comms-tool-btn"
                  disabled={!canPostInCurrentChannel}
                  onClick={() => {
                    setInputContent((prev) => `${prev}@`);
                    setMentionMenuOpen(true);
                    setMentionFilter("");
                    textareaRef.current?.focus();
                  }}
                  title="Mencionar miembro, sala o equipo con @"
                >
                  <AtSign size={15} />
                  <span>Mencionar (@)</span>
                </button>

                {/* Switch de Alta Prioridad para Administradores y Representantes */}
                {canSendUrgent && (
                  <label
                    className="comms-urgent-toggle"
                    title={
                      isAdmin
                        ? "Emite un comunicado oficial prioritario"
                        : "Emite un aviso urgente en este canal"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      disabled={!canPostInCurrentChannel}
                    />
                    <BellRing
                      size={13}
                      className={isUrgent ? "text-amber-400" : "text-muted"}
                    />
                    <span
                      className={isUrgent ? "text-amber-400 font-semibold" : ""}
                    >
                      {isAdmin ? "Aviso Oficial" : "Urgente"}
                    </span>
                  </label>
                )}
              </div>

              <div className="comms-composer-tools-right">
                <span className="comms-keyboard-tip">
                  <CornerDownLeft size={11} className="inline mr-1" />
                  Enter para enviar
                </span>
                <button
                  type="button"
                  className="button button-small comms-send-btn"
                  disabled={!canPostInCurrentChannel || !inputContent.trim()}
                  onClick={handleSend}
                >
                  <Send size={14} />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
