"use client";
import {
  Activity,
  ArrowLeft,
  Box,
  CalendarDays,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Brand } from "./brand";
import type { Tab } from "./workspace-shared";

const nav = [
  { key: "summary", label: "Resumen", icon: LayoutDashboard },
  { key: "comms", label: "Comunicaciones en vivo", icon: Radio },
  { key: "schedule", label: "Horarios de formación", icon: CalendarDays },
  { key: "spaces", label: "Espacios", icon: Grid2X2 },
  { key: "reservations", label: "Reservas", icon: CalendarDays },
  { key: "agenda", label: "Asistente de agenda", icon: Sparkles },
  { key: "resources", label: "Recursos y préstamos", icon: Box },
  { key: "incidents", label: "Incidencias e IA", icon: Sparkles },
  { key: "plans", label: "Planos e integraciones", icon: Grid2X2 },
  { key: "audit", label: "Auditoría", icon: ClipboardList },
] as const;

const groups: { label: string; keys: readonly Tab[] }[] = [
  { label: "Tu espacio", keys: ["summary"] },
  { label: "Operación", keys: ["comms", "incidents", "resources"] },
  { label: "Campus", keys: ["spaces", "reservations", "schedule", "plans"] },
  { label: "Gestión", keys: ["agenda", "audit"] },
];
export function WorkspaceShell({
  tab,
  onNavigate,
  role,
  configured,
  loading,
  onRefresh,
  onSignOut,
  children,
}: {
  tab: Tab;
  onNavigate: (tab: Tab) => void;
  role: string;
  configured: boolean;
  loading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [moduleQuery, setModuleQuery] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLElement>(null);
  const active = nav.find((item) => item.key === tab);
  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  function navigate(next: Tab) {
    onNavigate(next);
    setOpen(false);
    setModuleQuery("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <div className="workspace-shell">
      <aside
        id="workspace-navigation"
        className={`workspace-sidebar${open ? " is-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <Brand />
        <div className="workspace-identity">
          <span className="workspace-campus-mark">C</span>
          <div>
            <strong>Campuslands</strong>
            <span>Centro de operaciones</span>
          </div>
        </div>
        <label className="module-search">
          <Search size={16} />
          <input
            type="search"
            aria-label="Buscar módulo"
            placeholder="Buscar módulo…"
            value={moduleQuery}
            onChange={(event) => setModuleQuery(event.target.value)}
          />
        </label>
        <nav aria-label="Módulos">
          {groups.map((group) => {
            const items = nav.filter(
              (item) =>
                group.keys.includes(item.key) &&
                item.label
                  .toLocaleLowerCase("es")
                  .includes(moduleQuery.toLocaleLowerCase("es")) &&
                (item.key !== "audit" || role === "ADMIN") &&
                (item.key !== "agenda" ||
                  role === "ADMIN" ||
                  role === "OPERATOR"),
            );
            return items.length ? (
              <div className="navigation-group" key={group.label}>
                <p>{group.label}</p>
                {items
                  .sort(
                    (a, b) =>
                      group.keys.indexOf(a.key) - group.keys.indexOf(b.key),
                  )
                  .map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      aria-current={tab === key ? "page" : undefined}
                      onClick={() => navigate(key)}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
              </div>
            ) : null;
          })}
        </nav>
        {moduleQuery &&
          !nav.some(
            (item) =>
              (item.key !== "audit" || role === "ADMIN") &&
              (item.key !== "agenda" ||
                role === "ADMIN" ||
                role === "OPERATOR") &&
              item.label
                .toLocaleLowerCase("es")
                .includes(moduleQuery.toLocaleLowerCase("es")),
          ) && (
            <p className="module-search-empty" role="status">
              No hay módulos con esa búsqueda.
            </p>
          )}
        <div className="sidebar-bottom">
          <p>
            <Activity size={16} /> Campuslands · CampusFlow
          </p>
          <Link href="/">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
          {configured && (
            <button type="button" onClick={onSignOut}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          )}
        </div>
      </aside>
      <main
        className="workspace-main"
        id="contenido"
        ref={heading}
        tabIndex={-1}
      >
        <header className="workspace-topbar">
          <div className="workspace-location">
            <button
              ref={toggle}
              className="icon-button navigation-toggle"
              type="button"
              aria-label={
                open ? "Cerrar menú de módulos" : "Abrir menú de módulos"
              }
              aria-expanded={open}
              aria-controls="workspace-navigation"
              onClick={() => {
                if (open) close();
                else {
                  setOpen(true);
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>(
                        "#workspace-navigation nav button",
                      )
                      ?.focus(),
                  );
                }
              }}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>
              CampusFlow <span className="location-divider">/</span>{" "}
              <strong>{active?.label}</strong>
            </span>
          </div>
          <div>
            <span className="account-identity">
              <Image
                src="/brand/campus-avatar.webp"
                alt=""
                width={40}
                height={40}
                unoptimized
              />
              <span>
                <small>Sesión actual</small>
                <span className="role-pill">
                  {role === "ADMIN"
                    ? "Administrador"
                    : role === "OPERATOR"
                      ? "Operador"
                      : "Comunidad"}
                </span>
              </span>
            </span>
            {configured && (
              <button
                type="button"
                className="icon-button mobile-account-action"
                aria-label="Cerrar sesión"
                onClick={onSignOut}
              >
                <LogOut size={18} />
              </button>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label="Actualizar datos"
              disabled={!configured || loading}
              onClick={onRefresh}
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>
        </header>
        <div className="workspace-body">{children}</div>
      </main>
    </div>
  );
}
