/**
 * Row of four compact cards: DNS, SSL certificate, Domain registration, Server.
 * Pure presentation, no data or security logic.
 * UNTRUSTED DATA: issuer, registrar and server names come from third parties
 * and are rendered as plain text.
 */

import type { ReactNode } from "react";
import type { Diagnostics } from "@/lib/diagnostics/types";
import { daysText, formatDate, plural } from "./format";

const EXPIRY_WARNING_DAYS = 14;
const DOMAIN_WARNING_DAYS = 30;

type Tone = "good" | "bad" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  good: "text-up",
  bad: "text-down",
  neutral: "text-muted",
};

function Card({ title, tone, verdict, children }: { title: string; tone: Tone; verdict: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg bg-white/70 border border-line p-3 min-w-0">
      <div className="text-[11px] uppercase text-muted/70">{title}</div>
      <div className={"mt-0.5 font-semibold " + TONE_CLASS[tone]}>{verdict}</div>
      <div className="mt-1 space-y-0.5 text-xs text-muted leading-snug">{children}</div>
    </div>
  );
}

function Line({ children }: { children: ReactNode }) {
  return <div className="truncate">{children}</div>;
}

function Value({ children }: { children: ReactNode }) {
  return <span className="text-ink">{children}</span>;
}

export default function DiagnosticCards({ d }: { d: Diagnostics }) {
  const { dns, ssl, http, domain, ports } = d;

  // SSL
  const sslDays = ssl.daysRemaining;
  let sslTone: Tone = "good";
  let sslVerdict = "Valid";
  if (!ssl.ok) {
    sslTone = "bad";
    sslVerdict = "Unavailable";
  } else if (!ssl.valid) {
    sslTone = "bad";
    sslVerdict = "Not trusted";
  } else if (sslDays !== null && sslDays <= EXPIRY_WARNING_DAYS) {
    sslTone = "bad";
    sslVerdict = "Expiring soon";
  }

  // Domain registration. "Unknown" is neutral, not an error: some
  // extensions simply don't publish this data.
  const domainDays = domain.daysRemaining;
  let domainTone: Tone = "neutral";
  let domainVerdict = "Unknown";
  if (domain.ok) {
    domainTone = "good";
    domainVerdict = "Registered";
    if (domainDays !== null && domainDays < 0) {
      domainTone = "bad";
      domainVerdict = "Expired";
    } else if (domainDays !== null && domainDays <= DOMAIN_WARNING_DAYS) {
      domainTone = "bad";
      domainVerdict = "Expiring soon";
    }
  }

  const extraIps = dns.ipv4.length + dns.ipv6.length - 1;
  const firstIp = dns.ipv4[0] ?? dns.ipv6[0];
  const serverOk = http.ok && http.finalStatus !== null && http.finalStatus < 500;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card title="DNS" tone={dns.ok ? "good" : "bad"} verdict={dns.ok ? "Resolves" : "Failed"}>
        {dns.error && <Line>{dns.error}</Line>}
        {firstIp && (
          <Line>
            <Value>{firstIp}</Value>
            {extraIps > 0 && " +" + extraIps + " more"}
          </Line>
        )}
        {dns.lookupMs !== null && (
          <Line>
            Lookup <Value>{dns.lookupMs + " ms"}</Value>
          </Line>
        )}
      </Card>

      <Card title="SSL certificate" tone={sslTone} verdict={sslVerdict}>
        {ssl.error && <Line>{ssl.error}</Line>}
        {ssl.problem && <Line>{ssl.problem}</Line>}
        {ssl.ok && (
          <>
            <Line>
              Expires <Value>{formatDate(ssl.validTo)}</Value>
            </Line>
            {sslDays !== null && <Line>{daysText(sslDays)}</Line>}
            {ssl.issuer && <Line>By {ssl.issuer}</Line>}
          </>
        )}
      </Card>

      <Card title="Domain" tone={domainTone} verdict={domainVerdict}>
        {domain.error && <Line>{domain.error}</Line>}
        {domain.ok && (
          <>
            <Line>
              Expires <Value>{formatDate(domain.expiresAt)}</Value>
            </Line>
            {domainDays !== null && <Line>{daysText(domainDays)}</Line>}
            {domain.registrar && <Line>{domain.registrar}</Line>}
          </>
        )}
      </Card>

      <Card
        title="Server"
        tone={serverOk ? "good" : "bad"}
        verdict={http.ok && http.finalStatus !== null ? "HTTP " + http.finalStatus : "No response"}
      >
        {http.error && <Line>{http.error}</Line>}
        {http.ok && (
          <Line>
            <Value>{http.server ?? "Software hidden"}</Value>
            {http.cdn && " via " + http.cdn}
          </Line>
        )}
        {ports.length > 0 && (
          <Line>
            Ports{" "}
            {ports.map((p) => (
              <span
                key={p.port}
                className={"font-mono mr-1.5 " + (p.open ? "text-up" : "text-down line-through")}
                title={p.label + " port " + p.port + (p.open ? " is open" : " is closed")}
              >
                {p.port}
                <span className="sr-only">{p.open ? " open" : " closed"}</span>
              </span>
            ))}
          </Line>
        )}
        {http.hops.length > 1 && <Line>{plural(http.hops.length - 1, "redirect")}</Line>}
      </Card>
    </div>
  );
}
