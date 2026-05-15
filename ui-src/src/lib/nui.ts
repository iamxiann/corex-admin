// NUI bridge — talks to the FiveM client via the cfx fetch protocol.
//
// In production (inside FiveM), `window.GetParentResourceName()` is defined and
// returns the resource name ("corex-admin"). Fetch URLs become:
//   https://corex-admin/<callbackName>
//
// In dev (running `bun run dev` in a normal browser), there is no resource
// host, so we short-circuit to mock data. This keeps the design feedback loop
// fast without ever shipping mock data to production.

declare global {
  interface Window {
    GetParentResourceName?: () => string;
    invokeNative?: (name: string, ...args: unknown[]) => void;
  }
}

export const IS_NUI = typeof window !== "undefined" && typeof window.GetParentResourceName === "function";
export const RESOURCE = IS_NUI ? window.GetParentResourceName!() : "corex-admin";

/**
 * Call a NUI endpoint registered on the Lua client with
 *   RegisterNUICallback('<name>', function(body, cb) ... end)
 *
 * Falls back to `mockFn` when running in a normal browser (dev mode).
 * Throws on non-2xx so the caller can show an error toast.
 */
export async function nuiFetch<TResp, TBody = unknown>(
  name: string,
  body?: TBody,
  mockFn?: () => Promise<TResp> | TResp,
): Promise<TResp> {
  if (!IS_NUI) {
    if (!mockFn) {
      throw new Error(`nuiFetch(${name}): no mock provided for dev mode`);
    }
    // Tiny artificial latency so loading states are visible in dev
    await new Promise((r) => setTimeout(r, 60));
    return await mockFn();
  }

  const res = await fetch(`https://${RESOURCE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw new Error(`nuiFetch(${name}) ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as TResp;
}

/** Tell the client to release focus / hide the NUI cursor */
export function closeNui() {
  if (IS_NUI) {
    void nuiFetch("close", {});
  }
}

/** Subscribe to a server-pushed event delivered via SendNUIMessage. */
export function onNuiMessage<T = unknown>(type: string, handler: (payload: T) => void) {
  const listener = (event: MessageEvent) => {
    const data = event.data as { type?: string; payload?: T } | undefined;
    if (!data || data.type !== type) return;
    handler(data.payload as T);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
