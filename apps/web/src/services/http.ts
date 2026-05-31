export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface JsonRequestOptions extends RequestInit {
  signal?: AbortSignal;
}

export async function fetchJson<T>(input: string, init?: JsonRequestOptions): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    let details: unknown = null;
    let message = `Request failed with status ${response.status}`;
    let code: string | undefined;

    if (text) {
      try {
        details = JSON.parse(text) as unknown;
      } catch {
        details = text;
      }

      if (
        details &&
        typeof details === "object" &&
        "message" in details &&
        typeof (details as { message?: unknown }).message === "string"
      ) {
        message = (details as { message: string }).message;
      }

      if (
        details &&
        typeof details === "object" &&
        "code" in details &&
        typeof (details as { code?: unknown }).code === "string"
      ) {
        code = (details as { code: string }).code;
      }
    }

    throw new ApiError(message, response.status, code, details);
  }

  return (await response.json()) as T;
}
