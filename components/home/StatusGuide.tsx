/**
 * Long-form explainer content for the homepage: what "up," "down" and
 * "slow" mean here, how response time is measured, server vs local
 * problems, check frequency, and what HTTP status codes mean. Exists to
 * give real, original, useful text alongside the checker tool itself.
 * Pure presentation, no data or security logic.
 */

import { SITE_NAME } from "@/lib/config/site";

export default function StatusGuide() {
  return (
    <section className="mt-10 text-sm text-muted leading-relaxed space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-lg font-bold text-ink mb-2">
          Website status checker: what &quot;up,&quot; &quot;down&quot; and &quot;slow&quot; mean
        </h2>
        <p>
          When {SITE_NAME} checks a website, it makes a real connection to that
          site&apos;s server at that exact moment, the same way your browser
          would, and records exactly what comes back. That result falls into
          one of three categories:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong className="text-ink">Up</strong> &mdash; our server
            connected successfully and the site&apos;s own server responded
            without a serious error (anything below an HTTP 500-level
            response).
          </li>
          <li>
            <strong className="text-ink">Down</strong> &mdash; either our
            server couldn&apos;t establish a connection at all (the request
            timed out, the connection was refused, or the domain
            didn&apos;t resolve), or the site&apos;s own server returned an
            error response (HTTP 500 or higher).
          </li>
          <li>
            <strong className="text-ink">Slow</strong> &mdash; the site
            responded and is technically up, but took noticeably longer
            than typical to answer. This still counts as &quot;up&quot; in
            the headline status, but the response-time figure and load
            timing breakdown on each site&apos;s report page make it
            visible.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-ink mb-2">
          How response time is measured
        </h3>
        <p>
          We send a lightweight HEAD request first, since it&apos;s the
          cheapest way to confirm a server is responding. If a server
          rejects HEAD requests outright (some do), we fall back to a full
          GET request instead. The response time shown is the time between
          sending that request and receiving the first response headers
          back &mdash; not a full page load with images, scripts and fonts,
          which is why our number can differ from what you see in a
          browser&apos;s own network tab.
        </p>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-ink mb-2">
          Why a website might show as down for us but work fine for you
          (or the other way around)
        </h3>
        <p>
          A website being unreachable from our servers and a website being
          unreachable from your device are two different things, and they
          don&apos;t always agree. Common reasons for the mismatch:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong className="text-ink">Server-side problems</strong>{" "}
            affect everyone the same way: the site&apos;s hosting,
            database, or application crashed or is overloaded. If we show a
            site as down and you also can&apos;t load it, this is almost
            always the cause.
          </li>
          <li>
            <strong className="text-ink">Local connection problems</strong>{" "}
            only affect you: a stale DNS cache, a browser extension, a
            company or school firewall blocking the site, an ISP-level
            block, or a problem with your own network. If we show a site as
            up but you still can&apos;t load it, start here.
          </li>
          <li>
            Some sites deliberately block automated requests (including
            ours) while serving real visitors normally, which can make an
            otherwise-healthy site look down in an automated check.
          </li>
          <li>
            Geographic routing means a site can genuinely respond faster or
            slower, or even fail, from one region&apos;s network path and
            not another&apos;s &mdash; our result reflects our
            servers&apos; location, not necessarily yours.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-ink mb-2">
          How often sites are checked
        </h3>
        <p>
          Individual lookups (typing in any domain) run a fresh, live check
          the moment you ask, every time. Separately, the top tracked sites
          shown on the homepage are re-checked automatically every couple
          of minutes, and an outage alert is raised the instant one of the
          top 50 stops responding &mdash; so the &quot;Having
          problems&quot; list reflects near real-time status, not a stale
          snapshot.
        </p>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-ink mb-2">
          What HTTP status codes mean
        </h3>
        <p>Every response includes a three-digit HTTP status code. Broadly:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <strong className="text-ink">2xx (e.g. 200 OK)</strong> &mdash;
            success. The request worked and the server returned the
            expected content.
          </li>
          <li>
            <strong className="text-ink">3xx (e.g. 301, 302)</strong>{" "}
            &mdash; redirect. The site is pointing the request somewhere
            else, such as from a bare domain to its www version, or from
            HTTP to HTTPS.
          </li>
          <li>
            <strong className="text-ink">4xx (e.g. 403, 404)</strong>{" "}
            &mdash; client error. The request itself was rejected or the
            specific page wasn&apos;t found &mdash; the server is generally
            still up.
          </li>
          <li>
            <strong className="text-ink">5xx (e.g. 500, 502, 503)</strong>{" "}
            &mdash; server error. The site&apos;s own infrastructure failed
            to handle the request, which is what we count as
            &quot;down.&quot;
          </li>
        </ul>
        <p className="mt-2">
          Each individual site report shows the exact status code returned,
          along with the full chain of redirects and response headers, if
          any, under the collapsible detail tabs.
        </p>
      </div>
    </section>
  );
}
