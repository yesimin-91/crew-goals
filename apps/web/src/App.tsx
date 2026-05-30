import { NavLink, Outlet } from "react-router-dom";

import { appRoutes } from "./app/routes";

function AppTabLink({
  to,
  label
}: {
  to: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === appRoutes.home}
      className={({ isActive }) => `tab-link${isActive ? " tab-link--active" : ""}`}
    >
      {label}
    </NavLink>
  );
}

export function App() {
  return (
    <div className="shell">
      <div className="preview-frame">
        <p className="preview-label">Desktop stays as a centered mobile preview.</p>
        <main className="phone">
          <header className="status-header">
            <span>9:41</span>
            <span>Crew Goals Phase 1</span>
          </header>

          <div className="app-body">
            <Outlet />
          </div>

          <nav className="tab-nav" aria-label="Primary">
            <AppTabLink to={appRoutes.home} label="Home" />
            <AppTabLink to={appRoutes.goals} label="Goals" />
            <AppTabLink to={appRoutes.invites} label="Invites" />
          </nav>
        </main>
      </div>
    </div>
  );
}
