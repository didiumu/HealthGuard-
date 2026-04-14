import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService, { APIError, NetworkError, TimeoutError } from "./services/api";
import "./DoctorDashboard.css";

/* ── SVG icons ── */
const Icon = {
  users: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM17 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 0 0-1.5-4.33A5 5 0 0 1 19 16v1h-6.07zM6 11a5 5 0 0 1 5 5v1H1v-1a5 5 0 0 1 5-5z"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-12a1 1 0 1 0-2 0v4a1 1 0 0 0 2 0V6zm-1 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clipRule="evenodd"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
      <path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8z" clipRule="evenodd"/>
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" clipRule="evenodd"/>
    </svg>
  ),
};

const SYMPTOM_ICONS = {
  fever: "🌡️", cough: "🫁", headache: "🤕", fatigue: "😴", breathing: "💨",
};

const STAT_META = {
  neutral: { icon: Icon.users,   bg: "stat-bg-blue"  },
  high:    { icon: Icon.alert,   bg: "stat-bg-red"   },
  medium:  { icon: Icon.warning, bg: "stat-bg-amber" },
  low:     { icon: Icon.check,   bg: "stat-bg-green" },
};

const SORT_FIELDS = ["name", "normalizedScore", "risk", "time"];

function initials(name) {
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function relativeTime(iso, lang) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(lang);
}

function StatCard({ label, value, sub, accent, trend }) {
  const meta = STAT_META[accent];
  return (
    <div className={`stat-card stat-${accent}`}>
      <div className="stat-top">
        <div className={`stat-icon-wrap ${meta.bg}`}>{meta.icon}</div>
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? "trend-up" : "trend-down"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function RiskBadge({ risk, label }) {
  return (
    <span className={`risk-badge risk-${risk}`}>
      <span className="risk-dot-css" aria-hidden="true" />
      {label}
    </span>
  );
}

function PatientRow({ p, expanded, onToggle, t, i18n }) {
  const isOpen = expanded === p.id;
  const timeStr = new Date(p.time).toLocaleTimeString(i18n.language, {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={`pt-row pt-row-${p.risk}${isOpen ? " pt-row-open" : ""}`}>

      {/* ── Main row ── */}
      <div
        className="pt-row-main"
        onClick={() => onToggle(p.id)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(p.id)}
      >
        {/* LEFT: avatar + identity */}
        <div className="pt-left">
          <div className={`pt-avatar pt-avatar-${p.risk}`} aria-hidden="true">
            {initials(p.name)}
          </div>
          <div className="pt-identity">
            <span className="pt-name">{p.name}</span>
            <span className="pt-time-rel">{relativeTime(p.time, i18n.language)}</span>
          </div>
        </div>

        {/* MIDDLE: symptom icons */}
        <div className="pt-middle">
          <div className="pt-symptom-group">
            {p.symptoms.map((s) => (
              <span key={s} className="pt-symptom-chip" title={t(`symptoms.${s}`)}>
                {SYMPTOM_ICONS[s] ?? s}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT: score + risk + time */}
        <div className="pt-right">
          <div className="pt-score-block">
            <span className={`pt-score-num pt-score-${p.risk}`}>{p.normalizedScore}</span>
            <span className="pt-score-denom">/100</span>
          </div>
          <RiskBadge risk={p.risk} label={t(`risk_labels.${p.risk}`)} />
          <span className="pt-time-abs">{timeStr}</span>
          <span className={`pt-chevron${isOpen ? " open" : ""}`} aria-hidden="true">
            {Icon.chevron}
          </span>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {isOpen && (
        <div className="pt-detail" role="region" aria-label={p.name}>
          <div className="pt-detail-col">
            <p className="pt-detail-label">{t("dash.col_symptoms")}</p>
            <div className="pt-detail-pills">
              {p.symptoms.map((s) => (
                <span key={s} className={`pt-detail-pill pt-detail-pill-${p.risk}`}>
                  <span aria-hidden="true">{SYMPTOM_ICONS[s]}</span>
                  {t(`symptoms.${s}`)}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-detail-col">
            <p className="pt-detail-label">{t("score")}</p>
            <p className="pt-detail-score">
              {p.normalizedScore}<span>/100</span>
            </p>
          </div>
          <div className="pt-detail-col">
            <p className="pt-detail-label">{t("dash.col_risk")}</p>
            <RiskBadge risk={p.risk} label={t(`risk_labels.${p.risk}`)} />
          </div>
          <div className="pt-detail-col">
            <p className="pt-detail-label">{t("dash.col_time")}</p>
            <p className="pt-detail-time">{timeStr}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorDashboard() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter]     = useState("all");
  const [sortKey, setSortKey]   = useState("time");
  const [sortDir, setSortDir]   = useState("desc");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Fetch patient assessments from backend
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await apiService.getAssessments();
        setPatients(data);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        // Don't show error to user for background refresh failures
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAssessments, 30000);
    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(() => ({
    total:  patients.length,
    high:   patients.filter((p) => p.risk === "high").length,
    medium: patients.filter((p) => p.risk === "medium").length,
    low:    patients.filter((p) => p.risk === "low").length,
  }), [patients]);

  const filteredPatients = useMemo(() => {
    let list = patients;
    if (filter !== "all") list = list.filter((p) => p.risk === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "time") { av = new Date(av); bv = new Date(bv); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [patients, filter, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id));

  const SortBtn = ({ col, label }) => (
    <button
      className={`sort-btn${sortKey === col ? " sort-btn-active" : ""}`}
      onClick={() => toggleSort(col)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span className={`sort-icon ${sortKey === col ? "sort-active" : "sort-idle"}`}>
        {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );

  const dateStr = useMemo(() => {
    const now = new Date();
    if (i18n.language === "rw") {
      const days   = t("days",   { returnObjects: true });
      const months = t("months", { returnObjects: true });
      const day    = Array.isArray(days)   ? days[now.getDay()]     : "";
      const month  = Array.isArray(months) ? months[now.getMonth()] : "";
      return `${day}, ${now.getDate()} ${month} ${now.getFullYear()}`;
    }
    return now.toLocaleDateString(i18n.language, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }, [i18n.language, t]);

  return (
    <div className="db-root">

      {/* ── Header ── */}
      <div className="db-header">
        <div className="db-header-left">
          <div className="db-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <h1 className="db-title">{t("dash.title")}</h1>
            <p className="db-date">{dateStr}</p>
          </div>
        </div>
        <div className="db-live-pill">
          <span className="db-live-dot" />
          <span>{counts.total} {t("dash.total_patients")}</span>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="stat-grid">
        <StatCard label={t("dash.total_patients")} value={counts.total}  accent="neutral" trend={12} />
        <StatCard label={t("dash.high_risk")}      value={counts.high}   accent="high"    sub={t("dash.needs_attention")} trend={8} />
        <StatCard label={t("dash.medium_risk")}    value={counts.medium} accent="medium"  sub={t("dash.monitor_closely")} trend={-3} />
        <StatCard label={t("dash.low_risk")}       value={counts.low}    accent="low"     sub={t("dash.stable")} trend={5} />
      </div>

      {/* ── Patient list card ── */}
      <div className="db-card">

        {/* Toolbar */}
        <div className="db-toolbar">
          <div className="db-search-wrap">
            <span className="db-search-icon" aria-hidden="true">{Icon.search}</span>
            <input
              className="db-search"
              type="search"
              placeholder={t("dash.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("dash.search_placeholder")}
            />
          </div>
          <div className="db-toolbar-right">
            {/* Sort controls */}
            <div className="db-sort-group" aria-label="Sort by">
              {SORT_FIELDS.map((f) => (
                <SortBtn key={f} col={f} label={
                  f === "name"             ? t("dash.col_patient")  :
                  f === "normalizedScore"  ? t("score")             :
                  f === "risk"             ? t("dash.col_risk")     :
                                             t("dash.col_time")
                } />
              ))}
            </div>
            {/* Filter pills */}
            <div className="db-filters" role="group" aria-label={t("dash.filter_by_risk")}>
              {["all", "high", "medium", "low"].map((f) => (
                <button
                  key={f}
                  className={`db-filter-btn${filter === f ? " active" : ""} filter-${f}`}
                  onClick={() => setFilter(f)}
                >
                  {f !== "all" && <span className={`filter-dot dot-${f}`} />}
                  {f === "all" ? t("dash.filter_all") : t(`risk_labels.${f}`)}
                  {f !== "all" && <span className="filter-count">{counts[f]}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column labels */}
        <div className="pt-col-labels" aria-hidden="true">
          <span className="pt-col-identity">{t("dash.col_patient")}</span>
          <span className="pt-col-symptoms">{t("dash.col_symptoms")}</span>
          <span className="pt-col-right">{t("score")} · {t("dash.col_risk")} · {t("dash.col_time")}</span>
        </div>

        {/* Patient rows */}
        <div className="pt-list" role="list">
          {loading ? (
            <div className="db-empty-inner" role="listitem">
              <div className="db-empty-icon">⏳</div>
              <p>Loading assessments...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="db-empty-inner" role="listitem">
              <div className="db-empty-icon">{Icon.search}</div>
              <p>{patients.length === 0 ? "No assessments yet" : t("dash.no_results")}</p>
            </div>
          ) : (
            filteredPatients.map((p) => (
              <PatientRow
                key={p.id}
                p={p}
                expanded={expanded}
                onToggle={toggleExpand}
                t={t}
                i18n={i18n}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="db-foot">
          <span className="db-foot-count">
            {t("dash.showing", { count: filteredPatients.length, total: counts.total })}
          </span>
          <div className="db-foot-legend">
            <span className="legend-item"><span className="legend-dot dot-high" />{t("risk_labels.high")}</span>
            <span className="legend-item"><span className="legend-dot dot-medium" />{t("risk_labels.medium")}</span>
            <span className="legend-item"><span className="legend-dot dot-low" />{t("risk_labels.low")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
