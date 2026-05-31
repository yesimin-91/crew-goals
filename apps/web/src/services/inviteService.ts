import { fetchJson } from "./http";
import type {
  AcceptInviteResponse as AcceptInviteResponseDto,
  IgnoreInviteResponse as IgnoreInviteResponseDto,
  InviteDetailResponse,
  InvitesListResponse
} from "../../../../packages/shared/src/index";
import {
  mapInviteDetailResponse,
  mapInvitesListResponse
} from "./apiContracts";

export async function listInvites(signal?: AbortSignal) {
  const response = await fetchJson<InvitesListResponse>("/api/invites", { signal });
  return mapInvitesListResponse(response);
}

export async function getInvite(inviteId: string, signal?: AbortSignal) {
  const response = await fetchJson<InviteDetailResponse>(`/api/invites/${inviteId}`, {
    signal
  });
  return mapInviteDetailResponse(response);
}

export async function acceptInvite(inviteId: string) {
  return fetchJson<AcceptInviteResponseDto>(`/api/invites/${inviteId}/accept`, {
    method: "POST"
  });
}

export async function ignoreInvite(inviteId: string) {
  return fetchJson<IgnoreInviteResponseDto>(`/api/invites/${inviteId}/ignore`, {
    method: "POST"
  });
}
