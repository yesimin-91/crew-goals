import { useEffect, useState } from "react";

import type { EntryOverview } from "../../../packages/shared/src";

const fallbackOverview: EntryOverview = {
  headline: "Run separately. Finish together.",
  subheadline:
    "Create a 7-day distance goal with 1 to 3 friends. Every eligible Run or Trail Run adds to the same crew target after sync.",
  rules: [
    "Goal starts immediately after invites are sent.",
    "Friends who join later only contribute future runs.",
    "Only trusted Run and Trail Run activities count."
  ],
  highlights: [
    { label: "Cycle", value: "7 days" },
    { label: "Crew size", value: "2-4 people" },
    { label: "Goal type", value: "Distance" }
  ]
};

type ApiState =
  | { status: "loading" }
  | { status: "ready"; data: EntryOverview }
  | { status: "error"; message: string };

export function App() {
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      try {
        const response = await fetch("/api/home-entry");

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = (await response.json()) as EntryOverview;

        if (!cancelled) {
          setApiState({ status: "ready", data });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unknown API error";
          setApiState({ status: "error", message });
        }
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const overview =
    apiState.status === "ready" ? apiState.data : fallbackOverview;

  return (
    <div className="shell">
      <main className="phone">
        <header className="status-header">
          <span>9:41</span>
          <span>Crew Goals MVP</span>
        </header>

        <section className="hero-card">
          <div className="hero-card__top">
            <p className="eyebrow">Crew Goals / Phase 1</p>
            <span className="pill">Mobile only</span>
          </div>

          <div className="hero-card__body">
            <h1>{overview.headline}</h1>
            <p>{overview.subheadline}</p>
          </div>

          <div className="stats-grid">
            {overview.highlights.map((item) => (
              <article className="stat-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className="hero-actions">
            <button type="button" className="button button--primary">
              Start a Goal
            </button>
            <button type="button" className="button button--ghost">
              Review PRD Flow
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Core Rules</p>
            <h2>What this MVP must keep true</h2>
          </div>

          <div className="rule-list">
            {overview.rules.map((rule) => (
              <article className="rule-item" key={rule}>
                <span className="rule-item__mark">✓</span>
                <p>{rule}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Build Direction</p>
            <h2>Project foundation</h2>
          </div>

          <div className="stack-list">
            <article className="info-card">
              <span>Frontend</span>
              <strong>React + TypeScript + Vite</strong>
              <p>Ready to expand into create, invite, detail, and result flows.</p>
            </article>
            <article className="info-card">
              <span>Backend</span>
              <strong>Fastify + TypeScript</strong>
              <p>Prepared for goal, invite, sync, and lifecycle rules.</p>
            </article>
            <article className="info-card">
              <span>Data</span>
              <strong>SQLite + Drizzle schema</strong>
              <p>The local database file is created automatically on backend startup.</p>
            </article>
          </div>
        </section>

        <section className="status-card">
          <div>
            <span className="status-card__label">API status</span>
            <strong>
              {apiState.status === "ready"
                ? "Connected"
                : apiState.status === "error"
                  ? "Fallback mode"
                  : "Connecting"}
            </strong>
          </div>
          <p>
            {apiState.status === "error"
              ? `Frontend is still usable. Backend message: ${apiState.message}`
              : "Overview content is being served by the Fastify API."}
          </p>
        </section>
      </main>
    </div>
  );
}
