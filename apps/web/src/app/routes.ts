export const appRoutes = {
  home: "/",
  goals: "/goals",
  invites: "/invites"
} as const;

export function buildGoalPath(goalId: string) {
  return `/goals/${goalId}`;
}

export function buildInvitePath(inviteId: string) {
  return `/invites/${inviteId}`;
}

export function buildInviteUnavailablePath(inviteId: string) {
  return `/invites/${inviteId}/unavailable`;
}
