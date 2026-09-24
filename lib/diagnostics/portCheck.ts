/**
 * Port diagnostics: checks whether common web ports accept connections.
 *
 * SERVER-ONLY: uses Node's net module.
 * SECURITY rules for this file:
 *  - The port list is a FIXED allowlist. Never let users choose ports:
 *    arbitrary port scanning from our server looks like abuse and can get
 *    the hosting account flagged.
 *  - Every connection MUST use `lookup: safeLookup` (SSRF guard).
 *  - We only open and immediately close the TCP connection; no data is sent.
 * Contains no secrets.
 */

import "server-only";
import net from "node:net";
import { safeLookup } from "@/lib/security/ssrfGuard";
import type { PortResult } from "./types";

const PORT_TIMEOUT_MS = 3000;

// SECURITY: fixed allowlist, see header comment.
const WEB_PORTS: ReadonlyArray<{ port: number; label: string }> = [
  { port: 80, label: "HTTP" },
  { port: 443, label: "HTTPS" },
  { port: 8080, label: "HTTP alt" },
];

function probePort(host: string, port: number, label: string): Promise<PortResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;

    const socket = net.connect({ host, port, lookup: safeLookup });

    const finish = (open: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({ port, label, open, ms: open ? Date.now() - started : null });
    };

    const timer = setTimeout(() => finish(false), PORT_TIMEOUT_MS);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

export function checkWebPorts(domain: string): Promise<PortResult[]> {
  return Promise.all(WEB_PORTS.map((p) => probePort(domain, p.port, p.label)));
}
