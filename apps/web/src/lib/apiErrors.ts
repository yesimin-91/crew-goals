import { ApiError } from "../services/http";

export function getErrorStatus(error: unknown) {
  return error instanceof ApiError ? error.status : null;
}

export function getErrorCode(error: unknown) {
  return error instanceof ApiError ? error.code ?? null : null;
}

export function isNotFoundError(error: unknown) {
  return getErrorStatus(error) === 404;
}
