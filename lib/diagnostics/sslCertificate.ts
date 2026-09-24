/**
 * SSL certificate diagnostics: issuer, validity dates, trust problems.
 *
 * SERVER-ONLY: uses Node's tls module.
 * SECURITY: connects to a user-supplied host, so it MUST use `safeLookup`
 * from lib/security/ssrfGuard.ts. `rejectUnauthorized: false` is deliberate:
 * we only read the certificate to report on it and never send any data.
 * Contains no secrets.
 */

import "server-only";
import tls from "node:tls";
import { safeLookup } from "@/lib/security/ssrfGuard";
import type { SslInfo } from "./types";

const TLS_TIMEOUT_MS = 5000;
const DAY_MS = 86400000;

function errorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

function emptySsl(error: string): SslInfo {
  return {
    ok: false,
    valid: false,
    issuer: null,
    validFrom: null,
    validTo: null,
    daysRemaining: null,
    protocol: null,
    error,
  };
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function toIso(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function describeTlsProblem(code: string): string {
  switch (code) {
    case "CERT_HAS_EXPIRED":
      return "The certificate has expired.";
    case "CERT_NOT_YET_VALID":
      return "The certificate isn't valid yet.";
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "SELF_SIGNED_CERT_IN_CHAIN":
      return "The certificate is self-signed, so browsers won't trust it.";
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return "The certificate doesn't cover this domain name.";
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
    case "UNABLE_TO_GET_ISSUER_CERT_LOCALLY":
    case "UNABLE_TO_GET_ISSUER_CERT":
      return "The certificate chain is incomplete or untrusted.";
    default:
      return code
        ? "The certificate could not be verified (" + code + ")."
        : "The certificate could not be verified.";
  }
}

function describeTlsConnectError(code: string): string {
  switch (code) {
    case "EBLOCKED":
      return "This domain points to a private network address, so it wasn't contacted.";
    case "ECONNREFUSED":
      return "Port 443 refused the connection, so the site may not support HTTPS.";
    case "ENOTFOUND":
      return "The domain couldn't be resolved.";
    case "ECONNRESET":
      return "The connection was reset during the secure handshake.";
    case "EHOSTUNREACH":
    case "ENETUNREACH":
      return "The server's network is unreachable.";
    default:
      return "A secure connection couldn't be established.";
  }
}

export function checkSsl(domain: string): Promise<SslInfo> {
  return new Promise((resolve) => {
    let settled = false;

    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      lookup: safeLookup, // SECURITY: SSRF guard
      rejectUnauthorized: false,
    });

    const timer = setTimeout(() => {
      finish(emptySsl("The secure connection timed out."));
    }, TLS_TIMEOUT_MS);

    function finish(info: SslInfo) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(info);
    }

    socket.once("secureConnect", () => {
      const cert = socket.getPeerCertificate();
      if (!cert || !cert.valid_to) {
        finish(emptySsl("The server didn't present a certificate."));
        return;
      }

      const validTo = toIso(cert.valid_to);
      const validFrom = toIso(cert.valid_from);
      const daysRemaining =
        validTo !== null ? Math.floor((new Date(validTo).getTime() - Date.now()) / DAY_MS) : null;

      const rawAuthError = socket.authorizationError as unknown;
      let authCode = "";
      if (typeof rawAuthError === "string") {
        authCode = rawAuthError;
      } else if (rawAuthError instanceof Error) {
        authCode = errorCode(rawAuthError) || rawAuthError.message;
      }

      const issuer = cert.issuer ? firstString(cert.issuer.O) || firstString(cert.issuer.CN) : null;

      finish({
        ok: true,
        valid: socket.authorized,
        issuer,
        validFrom,
        validTo,
        daysRemaining,
        protocol: socket.getProtocol(),
        problem: socket.authorized ? undefined : describeTlsProblem(authCode),
      });
    });

    socket.once("error", (err) => {
      finish(emptySsl(describeTlsConnectError(errorCode(err))));
    });
  });
}
