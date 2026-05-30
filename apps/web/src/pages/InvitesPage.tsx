import { ActionLink } from "../components/Action";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { PageHeader } from "../components/PageHeader";
import { useCrewGoalsApi } from "../app/CrewGoalsApiContext";
import { buildInvitePath } from "../app/routes";
import { mapInviteListItem } from "../features/invites/inviteViewModels";
import { useAsyncData } from "../hooks/useAsyncData";

function getInviteLinkLabel(statusLabel: string) {
  return statusLabel === "Ready to review" ? "Open invite" : "View status";
}

export function InvitesPage() {
  const api = useCrewGoalsApi();
  const { state, reload } = useAsyncData(
    async (signal) => {
      const invites = await api.listInvites(signal);
      return invites.map(mapInviteListItem);
    },
    [api]
  );

  if (state.status === "loading") {
    return (
      <LoadingState
        title="Loading invites"
        body="Checking pending, blocked, and unavailable invite states."
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="Invites could not load"
        body="The invites list depends on explicit availability states, so we stopped here instead of rendering a misleading generic fallback."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="app-screen">
      <PageHeader
        eyebrow="Invites"
        title="Crew goal invites"
        description="Joinable, blocked, and unavailable invites now keep their own clear state instead of collapsing into a generic error."
      />

      {state.data.length ? (
        <div className="stack-list">
          {state.data.map((invite) => (
            <section className="panel panel--compact" key={invite.id}>
              <div className="panel__top">
                <div>
                  <p className="eyebrow">Invited by {invite.inviterName}</p>
                  <h2>{invite.title}</h2>
                </div>
                <span className={`pill pill--${invite.statusTone}`}>{invite.statusLabel}</span>
              </div>

              <div className="metric-grid">
                <article className="metric-card">
                  <span>Target</span>
                  <strong>{invite.targetLabel}</strong>
                </article>
                <article className="metric-card">
                  <span>Duration</span>
                  <strong>{invite.durationLabel}</strong>
                </article>
                <article className="metric-card">
                  <span>Members</span>
                  <strong>{invite.membersLabel}</strong>
                </article>
              </div>

              <p className="support-copy">{invite.description}</p>
              <p className="meta-copy">{invite.expiresLabel}</p>

              <div className="inline-actions">
                <ActionLink block to={buildInvitePath(invite.id)}>
                  {getInviteLinkLabel(invite.statusLabel)}
                </ActionLink>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="No invites"
          title="Your inbox is clear"
          body="When invite read flows arrive from notifications or friends, they will land here."
        />
      )}
    </div>
  );
}
