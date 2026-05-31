export const appRoutes = {
  home: "/",
  goals: "/goals",
  createGoal: "/goals/create",
  chooseGoalFriends: "/goals/friends",
  previewGoal: "/goals/preview",
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

export function buildPostRunPath(activityId: string) {
  return `/post-run/${activityId}`;
}
