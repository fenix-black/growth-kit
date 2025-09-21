# GrowthKit Service — Centralized Referrals & Unlocks (broprint.js)

> **Goal**: Extract referrals/credits/unlocks into a **single service** (Next.js + Prisma + Postgres) that all your mini‑apps consume via a lightweight **client SDK** (React hook). This avoids duplicating DB and logic per app, enables global analytics/anti‑abuse, and keeps configuration centralized. Device identification on the client uses **broprint.js**.

---

## 1) Architecture Overview

* **Service**: Next.js (App Router) API + Prisma + Postgres (Neon/Supabase). Deployed once (Vercel Hobby/Pro).
* **Client SDK**: `@fenixblack/growthkit` — a small npm package exposing `useGrowthKit()` and helpers. Each mini‑app installs this package and points it at the service base URL.
* **Multi‑app**: Every consuming mini‑app registers as an **Application** in the service using an **App Key**. Policies, soft‑paywall thresholds, and referral rules are configured per app.
* **Multi‑tenant (optional)**: A **Tenant** layer can be toggled on if you host GrowthKit for multiple customers in the future.
* **Security**: Public endpoints are CORS‑limited and use **App Keys**. Admin endpoints require **Service Keys** (Bearer) or dashboard auth.
* **Fingerprint**: Client‑side `@rajesh896/broprint.js` provides a `fingerprint` string. It’s sent to the service; the service upserts the `Fingerprint` record and tracks usage/credits.
* **Anti‑abuse**: Centralized rate‑limits (Upstash Redis), IP/ASN heuristics, self‑ref checks, daily caps, optional Turnstile/PoW gate on suspicious traffic.

```
Mini‑App (client) ──SDK──▶ GrowthKit Service API ──▶ Postgres
                         ▲            │
                         └── Webhooks ◀┘ (optional: events to your apps)
```

---

## 2) Functional Scope

* **Usage credits** per fingerprint+app.
* **Soft paywall** after X uses with progressive data capture (name/email/verify) and referral incentives.
* **Referrals** via `/r/:code` + claim tokens; credits for referrer/visitor on completed action.
* **Waitlist landing** when arriving without referral (configurable per app) + invite batches (e.g., 30/day).
* **Config** per app: thresholds, credit amounts, caps, UI copy.
* **Observability**: event log, metrics, fraud dashboards (phase 3).

---

## 3) Data Model (Prisma)

```prisma
datasource db { provider = "postgresql" url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model Tenant { // optional; keep for future multi‑tenant
  id        String @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  apps      App[]
}

model App {
  id        String   @id @default(cuid())
  tenantId  String?  // nullable if single‑tenant
  appKey    String   @unique
  name      String
  createdAt DateTime @default(now())
  // config snapshot (JSON) for fast reads
  policy    Json

  tenant    Tenant?  @relation(fields: [tenantId], references: [id])
  apiKeys   ApiKey[]
  credits   Credit[]
  usages    Usage[]
  referrals Referral[]
  leads     Lead[]
  waitlist  Waitlist[]
}

model ApiKey {
  id        String   @id @default(cuid())
  appId     String
  label     String
  keyHash   String // store hash, not raw
  createdAt DateTime @default(now())
  lastUsedAt DateTime?

  app       App @relation(fields: [appId], references: [id])
  @@index([appId])
}

model Fingerprint {
  id           String   @id @default(cuid())
  fingerprint  String   @unique
  referralCode String   @unique
  createdAt    DateTime @default(now())

  credits      Credit[]
  usages       Usage[]
  leads        Lead[]
}

model Credit {
  id            String   @id @default(cuid())
  fingerprintId String
  appId         String
  amount        Int
  updatedAt     DateTime @updatedAt

  fingerprint   Fingerprint @relation(fields: [fingerprintId], references: [id])
  app           App         @relation(fields: [appId], references: [id])
  @@unique([fingerprintId, appId])
}

model Usage {
  id            String   @id @default(cuid())
  fingerprintId String
  appId         String
  count         Int      @default(0)
  updatedAt     DateTime @updatedAt

  fingerprint   Fingerprint @relation(fields: [fingerprintId], references: [id])
  app           App         @relation(fields: [appId], references: [id])
  @@unique([fingerprintId, appId])
}

model Referral {
  id          String   @id @default(cuid())
  appId       String?
  refCode     String
  visitorFp   String
  event       String   // visit | completed_action | email_verify
  credited    Boolean  @default(false)
  claimToken  String?
  ip          String?
  asn         String?
  userAgent   String?
  createdAt   DateTime @default(now())

  app         App?     @relation(fields: [appId], references: [id])
  @@index([appId])
  @@index([refCode, visitorFp, event])
}

model Lead {
  id            String   @id @default(cuid())
  fingerprintId String
  appId         String
  name          String?
  email         String?
  emailStatus   EmailStatus @default(PENDING)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  fingerprint   Fingerprint @relation(fields: [fingerprintId], references: [id])
  app           App         @relation(fields: [appId], references: [id])
  @@unique([fingerprintId, appId])
}

enum EmailStatus { PENDING SENT VERIFIED }

model Waitlist {
  id        String   @id @default(cuid())
  appId     String
  email     String
  status    WaitlistStatus @default(QUEUED)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  app       App @relation(fields: [appId], references: [id])
  @@unique([appId, email])
}

enum WaitlistStatus { QUEUED INVITED JOINED }

model EventLog { // optional: for observability
  id        String   @id @default(cuid())
  appId     String
  type      String   // usage.increment, credit.add, referral.visit, etc.
  payload   Json
  ip        String?
  asn       String?
  createdAt DateTime @default(now())

  app       App @relation(fields: [appId], references: [id])
  @@index([appId, type])
}
```

---

## 4) API Surface (Service)

**Base URL**: `https://growthkit.fenixblack.ai` (example)

### Public (client‑facing) — CORS‑limited to allowed origins

* `POST /v1/me`
  Body: `{ appKey, apiKey, fp }`  → Ensures fingerprint/app rows; returns `{ referralCode, credits, usageCount, policy, baseUrl }`.
* `POST /v1/complete`
  Body: `{ appKey, apiKey, fp }`  → Increments usage, consumes credits (if enabled), applies referral credits (if claim present), returns `{ ok, credits, usageCount }`.
* `POST /v1/claim/name`
  Body: `{ appKey, apiKey, fp, name }` → Adds name, credits once.
* `POST /v1/claim/email`
  Body: `{ appKey, apiKey, fp, email }` → Saves email, triggers provider send (magic link / code).
* `POST /v1/verify/email`
  Body: `{ appKey, token|code }` → Marks verified, credits.
* `POST /v1/referral/visit`
  Body: `{ appKey, apiKey }` with claim token from `/r/:code` cookie → Records visit.
* `GET  /r/:code`
  Sets claim cookie (Edge optional) then redirects to consumer app URL (provided via `policy.ui.redirectUrl`).
* `POST /v1/waitlist`
  Body: `{ appKey, email }` → Adds to waitlist.

### Admin (owner/dashboard)

* `POST /v1/admin/app` → Create/update app, policy JSON.
* `POST /v1/admin/apikey` → Issue/revoke API keys for the app.
* `GET  /v1/admin/metrics` → Aggregates (credits issued, referral K, etc.).
* `POST /v1/admin/invite-batch` → Promote N waitlist emails to INVITED.

**Headers**

* Public endpoints: `x-app-key`, `x-api-key` (hash compare on server).
* Admin endpoints: Bearer `SERVICE_KEY`.

**CORS**

* Allow list per app (origins/domains). Reject others.

**Versioning**

* Prefix with `/v1`. Backwards‑compatible responses; deprecate gradually.

---

## 5) Client SDK (`@fenixblack/growthkit`)

**Install** (consumer mini‑app):

```bash
npm i @fenixblack/growthkit @rajesh896/broprint.js
```

**SDK API**

```ts
export type GrowthKitOptions = {
  serviceBaseUrl: string;        // e.g., https://growthkit.fenixblack.ai
  appKey: string;                // configured in service
  apiKey: string;                // per-app public API key (hash verified server-side)
};

export type GrowthState = {
  loading: boolean;
  error?: string;
  credits: number;
  usageCount: number;
  referralCode: string;
  referralLink: string;
  policy: any;                   // IncentivePolicy
  shouldShowSoftPaywall: boolean;
  refresh(): Promise<void>;
  share(): Promise<boolean>;
  completeAction(): Promise<{ ok: boolean; reason?: string }>;
  claimName(name: string): Promise<{ ok: boolean; reason?: string }>;
  claimEmail(email: string): Promise<{ ok: boolean; reason?: string }>;
  verifyEmail(tokenOrCode: string): Promise<{ ok: boolean; reason?: string }>;
  joinWaitlist(email: string): Promise<{ ok: boolean; reason?: string }>;
};
```

**SDK Hook (broprint.js inside)**

```ts
// package: @fenixblack/growthkit
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";

export function useGrowthKit(opts: GrowthKitOptions): GrowthState {
  const { serviceBaseUrl, appKey, apiKey } = opts;
  const [fp, setFp] = useState<string | null>(null);
  const [state, setState] = useState<any>({ loading: true });

  // 1) Get fingerprint
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = await getCurrentBrowserFingerPrint();
        if (alive) setFp(id);
      } catch (e) {
        if (alive) setState({ loading: false, error: "fingerprint_error" });
      }
    })();
    return () => { alive = false };
  }, []);

  // 2) Fetch ME
  const refresh = useCallback(async () => {
    if (!fp) return;
    const res = await fetch(`${serviceBaseUrl}/v1/me`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      body: JSON.stringify({ appKey, apiKey, fp })
    });
    const data = await res.json();
    setState((s: any) => ({ ...s, ...data, loading: false }));
  }, [serviceBaseUrl, appKey, apiKey, fp]);

  useEffect(() => { if (fp) void refresh(); }, [fp, refresh]);

  const referralLink = useMemo(() => state?.referralCode ? `${state.baseUrl ?? window.location.origin}/r/${state.referralCode}` : "", [state]);
  const shouldShowSoftPaywall = useMemo(() => {
    const th = state?.policy?.softPaywall?.thresholdUses ?? Infinity;
    const every = state?.policy?.softPaywall?.showOnEveryMultiple;
    if (typeof state?.usageCount !== "number") return false;
    if (state.usageCount >= th) return true;
    if (every && state.usageCount > 0 && state.usageCount % every === 0) return true;
    return false;
  }, [state]);

  async function share() {
    if (!referralLink) return false;
    const text = `I’m using this mini‑app. Try it: ${referralLink}`;
    try { if ((navigator as any).share) { await (navigator as any).share({ title: "Mini‑app", text, url: referralLink }); } else { await navigator.clipboard.writeText(text); } return true; } catch { return false; }
  }

  async function completeAction() {
    const res = await fetch(`${serviceBaseUrl}/v1/complete`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      body: JSON.stringify({ appKey, apiKey, fp })
    });
    const json = await res.json();
    if (json?.ok) await refresh();
    return json;
  }

  async function claimName(name: string) {
    const res = await fetch(`${serviceBaseUrl}/v1/claim/name`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      body: JSON.stringify({ appKey, apiKey, fp, name })
    });
    const json = await res.json();
    if (json?.ok) await refresh();
    return json;
  }

  async function claimEmail(email: string) {
    const res = await fetch(`${serviceBaseUrl}/v1/claim/email`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      body: JSON.stringify({ appKey, apiKey, fp, email })
    });
    const json = await res.json();
    if (json?.ok) await refresh();
    return json;
  }

  async function verifyEmail(tokenOrCode: string) {
    const res = await fetch(`${serviceBaseUrl}/v1/verify/email`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      body: JSON.stringify({ appKey, token: tokenOrCode })
    });
    const json = await res.json();
    if (json?.ok) await refresh();
    return json;
  }

  async function joinWaitlist(email: string) {
    const res = await fetch(`${serviceBaseUrl}/v1/waitlist`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      body: JSON.stringify({ appKey, email })
    });
    return await res.json();
  }

  return {
    loading: Boolean(state?.loading),
    error: state?.error,
    credits: state?.credits ?? 0,
    usageCount: state?.usageCount ?? 0,
    referralCode: state?.referralCode ?? "",
    referralLink,
    policy: state?.policy ?? {},
    shouldShowSoftPaywall,
    refresh,
    share,
    completeAction,
    claimName,
    claimEmail,
    verifyEmail,
    joinWaitlist,
  } as GrowthState;
}
```

**Consumer usage (mini‑app)**

```tsx
import { useGrowthKit } from "@fenixblack/growthkit";

export default function CreditsBadge() {
  const gk = useGrowthKit({
    serviceBaseUrl: process.env.NEXT_PUBLIC_GK_URL!,
    appKey: process.env.NEXT_PUBLIC_GK_APP_KEY!,
    apiKey: process.env.NEXT_PUBLIC_GK_PUBLIC_KEY!,
  });
  if (gk.loading) return <div>…</div>;
  return (
    <div>
      <div>Credits: {gk.credits}</div>
      <button onClick={() => gk.share()}>Share</button>
    </div>
  );
}
```

---

## 6) Security & Anti‑Abuse

* **App Keys & API Keys**: Each app gets a public API key. Store only **hash** on server. Check `x-api-key` via timing‑safe compare.
* **CORS Allowlist**: Per app origins; reject others.
* **Rate‑limits**: Upstash Redis sliding windows per IP/ASN and per fingerprint.
* **Self‑ref check**: If referrer.fp == visitor.fp, deny.
* **Daily caps**: `dailyCapPerReferrer` enforced per app.
* **Claim TTL**: 24h default.
* **Optional gates**: Cloudflare Turnstile on suspicious requests; PoW challenge for costly actions.

---

## 7) Implementation Plan

1. **Repo structure**

```
/growthkit-service      # Next.js service (API + dashboard later)
  prisma/
  app/
  src/
  .env
/growthkit-sdk          # npm package @fenixblack/growthkit
  src/useGrowthKit.ts
  package.json
```

2. **Service**

* Migrate schema; seed `App` + policy JSON.
* Admin endpoints to issue API keys (hash with bcrypt/argon2).
* Public endpoints with CORS + rate‑limit middleware.
* `/r/:code` route (Edge optional) sets claim cookie and redirects to consumer app URL (config).

3. **SDK**

* Implement hook (above) + small helpers (formatting referral text, OG share utilities).
* Bundle: ESM + types; mark `use client` inside hook.

4. **CI/CD**

* Vercel for service; npm publish for SDK.

5. **Docs**

* Quickstart + examples.

---

## 8) Environment Variables

**Service**

* `DATABASE_URL`
* `REF_SECRET` (HMAC for claim tokens)
* `SERVICE_KEY` (admin)
* `EMAIL_PROVIDER_KEY` (Resend/Sendgrid)
* `CORS_ALLOWLIST` (comma‑separated)

**Consumer apps**

* `NEXT_PUBLIC_GK_URL`
* `NEXT_PUBLIC_GK_APP_KEY`
* `NEXT_PUBLIC_GK_PUBLIC_KEY`

---

## 9) Waitlist Ops

* Endpoint to enqueue emails.
* Admin job to promote N/day (default 30). Can be a scheduled function or manual action.
* Optional webhook: `waitlist.invited` with `{ appKey, email }` to notify your apps.

---

## 10) Metrics

* Viral K, soft‑paywall conversion (name/email/verify), referral conversion, effective CAC (credits cost proxy), retention.
* Store aggregates in `EventLog` and compute via SQL views or a tiny analytics worker.

---

## 11) Migration from Inline Approach

* Keep existing per‑app tables read‑only while you integrate SDK.
* Roll out new SDK to one mini‑app as canary.
* Backfill existing fingerprints (if compatible) or let GrowthKit recreate referral codes.
* Decommission duplicated logic once parity is confirmed.

---

## 12) Copy Defaults (EN)

* **Modal**: "You’ve reached your free limit. Unlock more uses by completing your profile or inviting friends."
* **Name**: "+1 use by adding your name"
* **Email**: "+1 use by adding your email"
* **Verify**: "+1 use by confirming your email"
* **Referral**: "+2 uses per friend who visits your link"
* **Waitlist**: "Join the waitlist and you’ll be invited soon."

---

# Per‑app referral links with a centralized service (Next.js)

Goal: Keep **one centralized GrowthKit service** (DB + logic), while each mini‑app uses **its own domain** for referral URLs like `https://mytool.app/r/ABC123`. A small **middleware + SDK** in each app exchanges the path code for a short‑lived **claim token** issued by the service, stored as a **first‑party cookie** on that app’s domain. This preserves per‑app branding and avoids duplicating DB.

---

## High‑level flow

1. User clicks `https://mytool.app/r/ABC123`.
2. **App middleware** catches `/r/:code` and calls the **GrowthKit service** `/v1/referral/exchange` with `{ appKey, code }`.
3. Service validates code, mints a **claim JWT** (or HMAC token) with TTL, returns it.
4. Middleware sets **HttpOnly cookie** `ref_claim` on `mytool.app` and **redirects** to the intended page (e.g., `/app`).
5. On first render, the **SDK hook** gets the browser fingerprint using **broprint.js**, calls `POST /v1/me` and then `POST /v1/referral/visit` (optional) so the service can record a `visit` event.
6. When the user completes the action, the app calls `POST /v1/complete`; the service reads the claim and credits referrer/visitor.

Notes:

* Cookie lives on the **app domain**, not the service domain.
* If you prefer not to use cookies, keep the **claim** in a `Secure` cookie or a signed `localStorage` item; cookies are simplest for HttpOnly.

---

## Middleware (per mini‑app)

`middleware.ts`

```ts
import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: ["/r/:code*"] };

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const match = url.pathname.match(/^\/r\/(.+)$/);
  if (!match) return NextResponse.next();
  const refCode = match[1];

  // Call centralized GrowthKit service to exchange code for a claim token
  const serviceBase = process.env.NEXT_PUBLIC_GK_URL!;
  const appKey = process.env.NEXT_PUBLIC_GK_APP_KEY!;
  const apiKey = process.env.NEXT_PUBLIC_GK_PUBLIC_KEY!;

  const res = await fetch(`${serviceBase}/v1/referral/exchange`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-app-key": appKey,
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ appKey, code: refCode })
  });

  if (!res.ok) {
    // Fallback: redirect home without claim
    const target = new URL("/app", req.url);
    return NextResponse.redirect(target);
  }

  const { claim, redirectPath = "/app", ttlSeconds = 24 * 3600 } = await res.json();

  const resp = NextResponse.redirect(new URL(redirectPath, req.url));
  resp.cookies.set("ref_claim", claim, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: ttlSeconds,
    path: "/",
  });
  return resp;
}
```

---

## Service: exchange endpoint

`app/api/v1/referral/exchange/route.ts` (GrowthKit service)

```ts
import { NextResponse } from "next/server";
import { verifyAppKeys, mintClaim } from "@/lib/referrals";

export async function POST(req: Request) {
  const h = Object.fromEntries(req.headers);
  const { appKey, code } = await req.json();
  if (!verifyAppKeys(h["x-app-key"], h["x-api-key"], appKey)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // TODO: look up referrer by code, validate app policy, etc.
  // const referrer = await prisma.fingerprint.findFirst({ where: { referralCode: code } });
  // if (!referrer) return NextResponse.json({ ok: false }, { status: 404 });

  const ttlSeconds = 24 * 3600; // from policy
  const claim = await mintClaim({ appKey, refCode: code, ttlSeconds });
  return NextResponse.json({ ok: true, claim, ttlSeconds });
}
```

`mintClaim` can produce a compact JWT/HMAC string encoding `{ appKey, refCode, iat, exp }`.

---

## Client SDK hook (per mini‑app)

Using broprint.js and the app‑domain `ref_claim` cookie.

`useGrowthKit.ts`

```ts
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";

export function useGrowthKit(opts: { serviceBaseUrl: string; appKey: string; apiKey: string; }) {
  const { serviceBaseUrl, appKey, apiKey } = opts;
  const [fp, setFp] = useState<string | null>(null);
  const [state, setState] = useState<any>({ loading: true });

  useEffect(() => { (async () => {
    try { setFp(await getCurrentBrowserFingerPrint()); }
    catch { setState({ loading: false, error: "fingerprint_error" }); }
  })(); }, []);

  const refresh = useCallback(async () => {
    if (!fp) return;
    const res = await fetch(`${serviceBaseUrl}/v1/me`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      credentials: "include", // send ref_claim cookie to service if on same eTLD+1 via subdomain; otherwise service reads claim provided by app proxy (see note below)
      body: JSON.stringify({ appKey, fp })
    });
    const data = await res.json();
    setState({ loading: false, ...data });
  }, [fp, serviceBaseUrl, appKey, apiKey]);

  useEffect(() => { if (fp) void refresh(); }, [fp, refresh]);

  const referralLink = useMemo(() => state?.referralCode ? `${window.location.origin}/r/${state.referralCode}` : "", [state]);

  async function completeAction() {
    const res = await fetch(`${serviceBaseUrl}/v1/complete`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-key": appKey, "x-api-key": apiKey },
      credentials: "include",
      body: JSON.stringify({ appKey, fp })
    });
    const json = await res.json();
    if (json?.ok) await refresh();
    return json;
  }

  return { ...state, referralLink, completeAction, refresh };
}
```

> **Cross‑domain cookie note:** If your service runs on a different eTLD+1 (e.g., `growthkit.dev` vs `mytool.app`), the service cannot read the app’s cookie directly. Two options:
>
> 1. Keep **claim cookie only on the app domain** and send it to the service via an **app proxy API** (`/api/gk/*`) that forwards requests and attaches the cookie header.
> 2. Place the service under a shared parent domain (e.g., `api.fenixblack.ai` and apps `*.fenixblack.ai`) and set cookie domain to `.fenixblack.ai` when appropriate.

---

## App‑side proxy (recommended if different domains)

Create a thin API route in each app to forward requests to the service and attach cookies/headers.

`app/api/gk/complete/route.ts`

```ts
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const claim = cookies().get("ref_claim")?.value;
  const body = await req.json();
  const res = await fetch(`${process.env.NEXT_PUBLIC_GK_URL}/v1/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-app-key": process.env.NEXT_PUBLIC_GK_APP_KEY!,
      "x-api-key": process.env.NEXT_PUBLIC_GK_PUBLIC_KEY!,
      "x-ref-claim": claim ?? "", // forward claim explicitly
      "x-forwarded-for": headers().get("x-forwarded-for") || "",
      "user-agent": headers().get("user-agent") || "",
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
```

On the **service**, read `x-ref-claim` if cookie isn’t available.

---

## Service: reading claim token

`lib/referrals.ts`

```ts
import crypto from "crypto";

const SECRET = process.env.REF_SECRET!;

export function mintClaim(payload: { appKey: string; refCode: string; ttlSeconds: number; }) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + payload.ttlSeconds;
  const raw = `${payload.appKey}|${payload.refCode}|${iat}|${exp}`;
  const h = crypto.createHmac("sha256", SECRET).update(raw).digest("hex");
  return Buffer.from(`${raw}|${h}`).toString("base64url");
}

export function verifyClaim(token: string) {
  try {
    const raw = Buffer.from(token, "base64url").toString();
    const [appKey, refCode, iat, exp, h] = raw.split("|");
    const chk = crypto.createHmac("sha256", SECRET).update(`${appKey}|${refCode}|${iat}|${exp}`).digest("hex");
    if (chk !== h) return null;
    if (Math.floor(Date.now() / 1000) > Number(exp)) return null;
    return { appKey, refCode };
  } catch { return null; }
}
```

In your service handlers (e.g., `/v1/complete`), resolve the claim token from **cookie** or `x-ref-claim` header, call `verifyClaim`, and apply credits accordingly.

---

## TL;DR

* Yes, keep **referral URLs on each app’s domain**.
* Use **Next.js middleware** to exchange the code for a **short‑lived claim** minted by the centralized service.
* Store the claim in an **HttpOnly cookie** on the **app domain**.
* The **SDK hook** handles fingerprint + API calls.
* If the service is on another domain, add an **app‑side proxy** to forward the claim.
