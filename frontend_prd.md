# Varax Marketing Website — Product Requirements Document

**Version**: 2.0
**Last Updated**: March 2026
**Status**: Planning
**Domain**: varax.io (secured)
**Relationship**: Companion document to the Varax Compliance Automation Platform PRD v3.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Naming & Domain Strategy](#naming--domain-strategy)
3. [Two-Product Brand Strategy](#two-product-brand-strategy)
4. [Goals & Success Metrics](#goals--success-metrics)
5. [Target Audiences](#target-audiences)
6. [Site Architecture](#site-architecture)
7. [Page-by-Page Specifications](#page-by-page-specifications)
8. [Varax Monitor Section](#varax-monitor-section)
9. [Conversion Funnels](#conversion-funnels)
10. [Content Marketing Hub](#content-marketing-hub)
11. [SEO Strategy](#seo-strategy)
12. [Technical Stack & Hosting](#technical-stack--hosting)
13. [Design Principles](#design-principles)
14. [Email Capture & Nurture](#email-capture--nurture)
15. [Stripe Integration & Purchase Flow](#stripe-integration--purchase-flow)
16. [Analytics & Tracking](#analytics--tracking)
17. [Legal & Compliance Pages](#legal--compliance-pages)
18. [Launch Phases](#launch-phases)
19. [Open Questions](#open-questions)

---

## Executive Summary

The marketing website is the central hub for the entire go-to-market strategy. It's the home for **two products under one brand**: **Varax Monitor**, the free, open-source CronJob monitoring tool (the community builder), and **Varax**, the commercial Compliance Platform (the revenue driver). It serves four critical functions: showcasing the free tool to build trust and community, converting open-source users into paying compliance customers, establishing credibility in the Kubernetes space, and capturing leads through content marketing.

This is not a web app — it's a marketing, documentation, and content site with a Stripe-powered purchase flow. Both products are CLI/operator tools installed via Helm. The website sells, educates, and converts.

**Two-product strategy on one site**: Varax Monitor gets its own dedicated section — not buried as a footnote, but elevated as a genuine product that demonstrates Kubernetes expertise. Users who discover the free tool and trust the brand are the highest-quality leads for the compliance platform. The website architecture reflects this funnel: free tool → trust → compliance need → paid product.

**Key principle**: DevOps engineers and platform engineers are the audience. They are skeptical of marketing fluff, responsive to technical depth, and make purchasing decisions based on documentation quality, sample output, and peer trust (GitHub stars, community adoption). The site must feel like a developer tool's homepage, not a SaaS landing page.

---

## Naming & Domain Strategy

### Confirmed Names

| Element | Name | Status |
|---------|------|--------|
| **Company / Brand** | Varax | Confirmed |
| **Compliance Platform** | Varax | Confirmed (flagship product shares the brand name) |
| **OSS CronJob Monitor** | Varax Monitor | Confirmed |
| **Domain** | varax.io | Secured |

### Domain Configuration

- **Primary domain**: `varax.io` — marketing site, docs, blog
- **GitHub org**: `github.com/varax` (or `github.com/varax-io` if unavailable)
- **Email**: `hello@varax.io`, `support@varax.io`
- **DNS**: Managed via Cloudflare (free tier sufficient)
- **SSL**: Automatic via hosting provider or Cloudflare

### CLI Commands

The compliance platform CLI uses the `varax` command directly:

```
varax scan
varax report
varax report --format pdf
```

Varax Monitor uses a separate Helm chart under the Varax org:

```
helm install varax-monitor varax/varax-monitor
```

---

## Two-Product Brand Strategy

### The Portfolio

| | Varax Monitor | Varax Compliance Platform |
|---|---|---|
| **Role** | Community builder, trust engine | Revenue driver |
| **Price** | Free forever (Apache 2.0) | Free tier + Pro at $149/mo |
| **Purpose on website** | Attract developers, demonstrate K8s expertise, build email list | Convert trust into revenue |
| **Primary audience** | Any K8s team with CronJobs | Teams needing SOC2 compliance |
| **GitHub repo** | `varax/varax-monitor` | `varax/operator` |

### Brand Architecture

Both products live under the Varax brand. The website presents them as a product suite from a team that deeply understands Kubernetes operations:

```
Varax
├── Varax Monitor — "Free Kubernetes CronJob monitoring. Zero config. Zero cost."
└── Varax — "Automated SOC2 compliance for Kubernetes. Scan, evidence, report."
```

### Why One Website, Not Two

- **Shared credibility**: GitHub stars and community trust from Varax Monitor directly benefit the compliance platform's perceived quality.
- **SEO consolidation**: One domain (varax.io) accumulates all authority. Blog posts about CronJobs and compliance both build the same domain's ranking.
- **Simpler brand story**: "We build Kubernetes tools" is clearer than managing two separate identities.
- **Natural upgrade path**: Users who find Varax Monitor discover the compliance tool on the same site. No redirect, no friction.
- **Lower maintenance**: One codebase, one deployment, one analytics setup.

### How the Products Connect on the Site

The primary navigation gives Varax (the compliance platform) top billing as the revenue product, but Varax Monitor has its own dedicated section — not hidden in a footer link. The relationship should feel like how Hashicorp presents Terraform (free) alongside Vault (commercial) — both legitimate products, one ecosystem.

Users arriving for Varax Monitor should naturally encounter the compliance platform through:

1. A persistent "Also from Varax" banner or nav element
2. Blog posts that span both products ("Monitoring + Compliance: Your K8s Operations Checklist")
3. The Varax Monitor page itself, with a tasteful (not aggressive) cross-promotion section
4. Email nurture sequences that introduce Varax compliance to Varax Monitor users

---

## Goals & Success Metrics

### Primary Goals

1. **Convert open-source users to Pro subscribers** — the website is where `varax report` upgrade prompts send users
2. **Capture email leads** from content marketing visitors
3. **Establish credibility** as the Kubernetes compliance authority
4. **Provide documentation** that makes installation and usage frictionless

### Website KPIs

| Metric | Month 1-3 | Month 4-6 | Month 7-12 |
|--------|-----------|-----------|------------|
| Monthly unique visitors | 500 | 2,000 | 5,000+ |
| Blog post pageviews/month | 1,000 | 5,000 | 15,000+ |
| Email list subscribers | 100 | 500 | 1,000+ |
| Pricing page visits | 50 | 300 | 1,000+ |
| Stripe checkout initiated | 5 | 20 | 50+ |
| Pro purchases completed | 2 | 8 | 20+ |
| Avg. time on docs pages | >3 min | >3 min | >3 min |
| Bounce rate (homepage) | <60% | <50% | <45% |

---

## Target Audiences

These align with the customer personas defined in the Varax Compliance PRD v3.0, but with website-specific behavioral context.

### Audience 1: The GitHub Discoverer

**Who**: DevOps/platform engineer who found the open-source repo on GitHub, Reddit, or Hacker News.
**Arrives at**: Homepage or docs (via README links).
**Wants**: To understand what the tool does beyond the README, see sample reports, and evaluate if it's worth installing.
**Conversion goal**: Install the operator, eventually upgrade to Pro.

### Audience 2: The Upgrade-Prompted User

**Who**: Existing free-tier user who ran `varax report` and saw "Upgrade to Pro for full audit-ready reports."
**Arrives at**: Pricing page directly (the CLI links here).
**Wants**: To see exactly what Pro includes, view a sample report, and buy immediately.
**Conversion goal**: Purchase Pro license within that session.

### Audience 3: The SEO/Content Reader

**Who**: Engineer searching for "SOC2 for Kubernetes", "CIS benchmark Kubernetes", or "Kubernetes compliance automation."
**Arrives at**: Blog post or guide.
**Wants**: To solve a specific compliance problem. Doesn't know Varax yet.
**Conversion goal**: Email capture, nurture, free install, Pro.

### Audience 4: The CTO/Decision Maker

**Who**: Technical leader evaluating tools for their team. May have been forwarded a link by their DevOps engineer.
**Arrives at**: Homepage or pricing page.
**Wants**: ROI justification, credibility signals, and a clear understanding of what they're buying.
**Conversion goal**: Approve the purchase or sign up for a consulting assessment.

---

## Site Architecture

### Sitemap

```
varax.io/
├── / ........................... Homepage (hero, value prop, social proof, CTA)
├── /pricing ................... Pricing tiers, FAQ, purchase CTAs
├── /docs ...................... Documentation hub
│   ├── /docs/compliance/ ...... Varax compliance platform docs
│   │   ├── quickstart ......... 5-minute installation guide
│   │   ├── configuration ...... ComplianceConfig CRD reference
│   │   ├── scanning ........... Scanner details, check list
│   │   ├── reports ............ Report types, generation guide
│   │   ├── remediation ........ Auto-remediation guide
│   │   ├── soc2-mapping ....... Full SOC2 control mapping reference
│   │   └── faq ................ Technical FAQ
│   └── /docs/monitor/ ......... Varax Monitor docs
│       ├── quickstart ......... 60-second installation guide
│       ├── metrics ............ Prometheus metrics reference
│       ├── dashboards ......... Grafana dashboard setup
│       ├── alerts ............. Alert rules reference
│       └── faq ................ Technical FAQ
├── /monitor ................... Varax Monitor product page (dedicated landing)
├── /blog ...................... Content marketing hub
│   ├── /blog/[slug] ........... Individual blog posts
│   └── /blog/tags/[tag] ....... Tag-filtered views
├── /sample-report ............. Interactive sample SOC2 report (gated or ungated)
├── /consulting ................ SOC2 Readiness Assessment service page
├── /about ..................... About page (founder story, mission, open source commitment)
├── /changelog ................. Product changelog / release notes
├── /privacy ................... Privacy policy
├── /terms ..................... Terms of service
└── /404 ....................... Custom 404
```

### Navigation Structure

**Primary nav** (persistent header):

```
[Varax Logo]    Products ▾    Docs    Pricing    Blog    GitHub    [Get Started]
                  ├── Varax Compliance
                  └── Varax Monitor (Free)
```

**Footer**:

```
Products          Resources          Company           Legal
─────────         ─────────          ─────────         ─────────
Varax Compliance  Compliance Docs    About             Privacy Policy
Varax Monitor     Monitor Docs       Consulting        Terms of Service
Pricing           Blog               GitHub
Sample Report     SOC2 Mapping       Contact
Changelog         FAQ
```

---

## Page-by-Page Specifications

### Homepage (`/`)

The homepage must accomplish five things in order of priority:

1. **Communicate the value prop in <5 seconds** — "What is this and why should I care?"
2. **Show, don't tell** — sample report screenshot, terminal output, compliance score
3. **Establish credibility** — GitHub stars, install count, community signals
4. **Provide two clear CTAs** — "Install Free" and "View Sample Report"
5. **Address both engineers and decision-makers** — technical depth for engineers, ROI for CTOs

#### Hero Section

The homepage leads with the Varax compliance platform (the revenue product) but prominently features Varax Monitor as proof of the brand's Kubernetes expertise.

```
[Tagline — one line, e.g. "Kubernetes tools that keep your clusters running and compliant."]
[Subheadline — e.g. "Open-source monitoring and compliance automation for Kubernetes.
 From CronJob observability to audit-ready SOC2 reports — all Kubernetes-native, all self-hosted."]

[Primary CTA: "Explore Compliance"]  [Secondary CTA: "Free Varax Monitor"]

[Hero visual: terminal screenshot showing `varax report` command generating a PDF,
 or a split view of terminal + the resulting report]
```

#### Social Proof Bar

```
[GitHub stars count]    [Docker/GHCR pulls]    [# of clusters monitored (opt-in telemetry)]
```

If early stage and numbers are low, replace with logos of frameworks/standards supported:
```
CIS Benchmark  •  NSA/CISA  •  SOC2 Trust Services  •  Pod Security Standards
```

#### "How It Works" Section

Three steps, each with a code snippet or visual:

1. **Install** — `helm install varax varax/operator` (show terminal)
2. **Scan** — `varax scan` output showing compliance score (show terminal)
3. **Report** — `varax report --format pdf` → PDF screenshot (show output)

#### Feature Grid

Four to six key features, each with an icon and 1-2 sentence description:

- **Auto-Discovery** — Scans your entire cluster automatically. No configuration files to maintain.
- **SOC2 Control Mapping** — Every check maps to specific SOC2 Trust Services Criteria.
- **Audit-Ready Reports** — Generate the PDF your auditor needs with one CLI command.
- **Auto-Enable Audit Logging** — Programmatically enables K8s audit logging on EKS, AKS, and GKE.
- **Auto-Remediation** — Opt-in fixes for failing checks with dry-run mode.
- **Zero External Dependencies** — Runs entirely in your cluster. Your data never leaves.

#### Comparison Section (Optional — Phase 2+)

| | Varax | Kubescape | Vanta/Drata |
|---|---|---|---|
| K8s-native operator | Yes | Yes | No |
| Audit-ready PDF reports | Yes | No | Yes (not K8s-specific) |
| Auto-enable audit logging | Yes | No | No |
| Flat-rate pricing | Yes | No (per-node) | No ($10K+/yr) |
| Self-hosted / air-gapped | Yes | Yes | No |

#### CTA Section (Bottom)

```
Ready to see your compliance score?

[Install Free — takes 60 seconds]    or    [Talk to us about a SOC2 Assessment]
```

---

### Pricing Page (`/pricing`)

This is the highest-intent page on the site. The CLI upgrade prompt links directly here (`varax.io/pricing`).

#### Tier Layout

| | Free | Pro ($149/month) |
|---|---|---|
| Compliance scanning | All checks | All checks |
| CLI output | Summary only | Full detailed output |
| PDF reports | No | Audit-ready |
| SOC2 control mapping | Basic | Complete with evidence |
| Auto-remediation | Dry-run only | Full auto-fix |
| Email support | Community only | Priority email |
| License | Apache 2.0 | Commercial |

#### Key Elements

- Toggle between monthly / annual pricing (annual = 2 months free)
- "View Sample Report" link next to Pro tier
- FAQ section addressing common objections
- Money-back guarantee badge (30-day)
- Stripe Checkout integration

---

### Sample Report Page (`/sample-report`)

**Purpose**: Show, don't tell. The sample report is the single most persuasive asset for converting free users to Pro.

- Interactive HTML version of a Varax compliance report
- Generated from a real Kind cluster with intentional failures
- Downloadable PDF version
- Comparison callout: "Free tier shows a summary. Pro generates this full report."

---

### Documentation Hub (`/docs`)

Split into two clear sections:

**Varax Compliance Docs** (`/docs/compliance/`):
- Quickstart (5-minute install)
- Configuration (ComplianceConfig CRD reference)
- Scanning (scanner details, check list)
- Reports (types, generation)
- Remediation (auto-fix guide)
- SOC2 Mapping (full control reference)
- FAQ

**Varax Monitor Docs** (`/docs/monitor/`):
- Quickstart (60-second install)
- Metrics (Prometheus reference)
- Dashboards (Grafana setup)
- Alerts (alert rules reference)
- FAQ

---

### Consulting Page (`/consulting`)

**Purpose**: Sell the $2K-$5K SOC2 Readiness Assessment service.

- What the engagement includes (install, scan, manual review, written recommendations, walkthrough call, 30-day follow-up)
- Pricing: "Starting at $2,000"
- Who it's for: "Teams that want hands-on help getting SOC2-ready"
- What you get: Deliverables list
- CTA: "Schedule a call" (Calendly embed or link)
- Testimonials (once available)

---

### About Page (`/about`)

- Founder story: Why you built this (Kubernetes expertise + compliance pain point)
- Open-source commitment: Why the core is Apache 2.0
- Mission: Make Kubernetes compliance accessible to every team
- Link to Varax Monitor as proof of community commitment
- Photo optional but adds trust for consulting sales

---

## Varax Monitor Section

### Varax Monitor Landing Page (`/monitor`)

This is a full product page — not a sidebar mention. Varax Monitor is the first thing many users will encounter from the Varax brand, so it needs to stand on its own while naturally leading visitors toward the broader ecosystem.

#### Hero Section

```
Varax Monitor
Free Kubernetes CronJob monitoring. Zero config. Zero cost.

Auto-discover every CronJob in your cluster. Track execution, detect failures,
alert on missed schedules — all through Prometheus and Grafana. Installs in 60 seconds.

[Install Now]    [View on GitHub]
```

#### The Problem / Solution Block

**The problem**: Kubernetes CronJobs fail silently. Your nightly backup didn't run? Your report generator has been broken for a week? You won't know until someone complains. Existing solutions are either expensive SaaS tools that require per-job configuration, or hours of DIY Prometheus PromQL wrangling.

**The solution**: One Helm command. Zero configuration. Every CronJob monitored automatically.

#### Feature Grid

- **Auto-Discovery** — Detects every CronJob in your cluster automatically using Kubernetes Informers. Add a new CronJob? It's monitored instantly.
- **Pre-Built Dashboards** — Import the included Grafana dashboard and see all your CronJobs in one view. Execution history, success rates, duration trends.
- **Smart Alert Rules** — Pre-configured Prometheus alerts for: job failures, missed schedules, abnormal duration, and stuck jobs. Copy-paste into your AlertManager.
- **Prometheus Native** — Exports clean, well-labeled Prometheus metrics. Works with your existing monitoring stack. No new tools to learn.
- **Lightweight** — <50MB memory, <0.05 CPU. Read-only cluster access. No persistent storage needed.
- **100% Free** — Apache 2.0 licensed. No per-job pricing. No telemetry. No vendor lock-in.

#### Metrics Reference Preview

Quick-reference table on the landing page. Links to full docs for details.

| Metric | Type | Description |
|--------|------|-------------|
| `cronjob_last_execution_status` | Gauge | Last execution result (1=success, 0=failure) |
| `cronjob_last_execution_duration_seconds` | Gauge | Duration of last execution |
| `cronjob_execution_total` | Counter | Total executions (labeled success/failure) |
| `cronjob_missed_schedules_total` | Counter | Missed schedule count |
| `cronjob_next_schedule_time` | Gauge | Unix timestamp of next expected run |
| `cronjob_is_suspended` | Gauge | Whether the CronJob is suspended |

[View full metrics reference →](/docs/monitor/metrics)

#### Community & Adoption Stats

```
[GitHub stars]    [Docker pulls]    [Clusters monitored]    [CronJobs tracked]
```

Early stage fallback: "Trusted by Kubernetes operators running production clusters on EKS, AKS, and GKE."

#### Cross-Promotion Section (Bottom of Page)

This should feel natural, not like an upsell popup. Frame it as "more from the same team":

```
Your CronJobs are monitored. But is your cluster compliant?

Varax scans your Kubernetes cluster for SOC2 violations
and generates audit-ready reports with one CLI command.

Same Kubernetes-native approach. Same zero-config philosophy.

[Learn about Varax Compliance]    [View Sample Report]
```

**Design note**: This cross-promotion block should be visually distinct (different background, subtle border) but not aggressive. Think of how Vercel promotes Next.js on their other product pages — present but tasteful. No popups, no modals, no "Don't miss this!" energy.

#### CTA Section (Final)

```
Monitor every CronJob in your cluster. Free forever.

$ helm install varax-monitor varax/varax-monitor

[Install Now]    [Read the Docs]    [Star on GitHub]
```

### Varax Monitor Documentation (`/docs/monitor/*`)

Separate documentation section within the shared docs hub. Same design, same search index, but clearly scoped.

**Quickstart** (`/docs/monitor/quickstart`)
- Prerequisites (Helm, kubectl, a Kubernetes cluster with Prometheus)
- Installation (2 commands)
- Verifying it's working (check metrics endpoint)
- Importing the Grafana dashboard
- Setting up alerts

**Metrics Reference** (`/docs/monitor/metrics`)
- Complete list of all exported metrics
- Label descriptions
- Example PromQL queries for common use cases

**Dashboards** (`/docs/monitor/dashboards`)
- Grafana dashboard JSON import instructions
- Dashboard panel descriptions
- Customization guide

**Alert Rules** (`/docs/monitor/alerts`)
- Pre-built alert rules with AlertManager configuration
- Tuning thresholds for your environment
- Slack/PagerDuty/email integration examples

**FAQ** (`/docs/monitor/faq`)
- "Does it work with kube-state-metrics?" — Yes, it complements it.
- "What K8s versions are supported?" — 1.21+
- "Can I monitor specific namespaces only?" — Yes, via Helm values.
- "How much resources does it use?" — <50MB RAM, <0.05 CPU.

### Varax Monitor Blog Content

The Varax Monitor expands the content marketing surface area significantly. These posts target a broader K8s operations audience that may not be searching for compliance content yet:

| # | Title | Target Keyword | Cross-Sell Potential |
|---|-------|---------------|---------------------|
| 1 | "Monitor All Your Kubernetes CronJobs in 60 Seconds" | kubernetes cronjob monitoring | Low (awareness) |
| 2 | "Why Your Kubernetes CronJobs Are Failing Silently" | kubernetes cronjob failing | Low (awareness) |
| 3 | "Prometheus Metrics for Kubernetes CronJobs: A Complete Guide" | prometheus cronjob metrics | Medium (technical audience) |
| 4 | "Kubernetes CronJob Alerting with Prometheus and AlertManager" | kubernetes cronjob alerts | Medium (technical audience) |
| 5 | "CronJob Monitoring + SOC2 Compliance: Your K8s Operations Checklist" | kubernetes operations checklist | High (bridge content) |
| 6 | "From CronJob Monitoring to Full Cluster Compliance with Varax" | (branded) | High (conversion content) |

Posts #5 and #6 are **bridge content** — they naturally connect the Varax Monitor audience to the compliance platform by framing them as two parts of a mature Kubernetes operations practice.

---

## Conversion Funnels

### Funnel 1: GitHub → Website → Install → Upgrade (Compliance)

```
GitHub README "Learn more" link
    → varax.io
        → Docs/Quickstart
            → Install free tier
                → Run `varax report`
                    → See upgrade prompt in CLI
                        → varax.io/pricing
                            → Stripe Checkout
                                → Pro customer
```

**Key metric**: GitHub referral → Install conversion rate

### Funnel 2: Varax Monitor → Trust → Varax Compliance (The Bridge Funnel)

This is the signature funnel for the two-product strategy:

```
Search "kubernetes cronjob monitoring" or Reddit/HN discovery
    → varax.io/monitor (or GitHub README)
        → Install Varax Monitor (free)
            → Positive experience, trust established
                → See cross-promotion in CLI output, docs, or website
                    → Visit varax.io/sample-report or homepage
                        → Learn about Varax compliance platform
                            → Install compliance free tier
                                → Upgrade to Pro
```

**Key metric**: Varax Monitor install → Varax compliance install rate (target: 5-10%)

This funnel may take weeks or months to convert. The email nurture sequence bridges the gap — Varax Monitor users who sign up for the newsletter receive compliance-related content that surfaces the paid product naturally.

### Funnel 3: SEO/Content → Email → Install → Upgrade

```
Google search "SOC2 Kubernetes compliance"
    → Blog post on varax.io/blog
        → Email signup (in-content CTA or exit intent)
            → Nurture sequence (3-5 emails)
                → Install free tier
                    → Upgrade to Pro
```

**Key metric**: Blog visit → Email signup rate (target: 3-5%)

### Funnel 4: Direct Intent → Purchase

```
CLI upgrade prompt → varax.io/pricing
    → View sample report
        → Stripe Checkout
            → Pro customer
```

**Key metric**: Pricing page → Purchase conversion rate (target: 5-10%)

### Funnel 5: Consulting

```
Homepage or blog → varax.io/consulting
    → Schedule call (Calendly)
        → Discovery call
            → SOC2 Assessment engagement ($2K-$5K)
                → Pro subscriber post-engagement
```

---

## Content Marketing Hub

Content marketing is the primary growth engine. The blog targets high-intent keywords that DevOps engineers and CTOs search when they're facing compliance deadlines.

### Content Pillars

1. **SOC2 for Kubernetes** — The primary pillar. Everything about achieving and maintaining SOC2 in K8s environments.
2. **Kubernetes Security Hardening** — CIS Benchmarks, NSA/CISA guidelines, pod security, RBAC best practices.
3. **Compliance Automation** — General compliance engineering, evidence collection, audit preparation.
4. **Kubernetes Operations** — CronJob monitoring, observability, production best practices (feeds the Varax Monitor audience).

### Launch Blog Posts (Priority Order)

| # | Title | Target Keyword | Funnel |
|---|-------|---------------|--------|
| 1 | "The Complete Guide to SOC2 Compliance for Kubernetes" | kubernetes soc2 | SEO → Email |
| 2 | "CIS Kubernetes Benchmark: What It Is and How to Automate It" | cis benchmark kubernetes | SEO → Email |
| 3 | "Automating SOC2 Evidence Collection in Kubernetes" | soc2 automation | SEO → Install |
| 4 | "Kubernetes RBAC Audit: Finding Permission Gaps Before Your Auditor Does" | kubernetes rbac audit | SEO → Email |
| 5 | "Why We Built Varax: The Open-Source Kubernetes Compliance Tool" | (branded) | Trust building |

### Blog Post Template

Each post should include:
- Title + meta description (SEO optimized)
- Author name and date
- Estimated reading time
- Table of contents for posts >1,500 words
- Code blocks where relevant
- CTA at the bottom (relevant to the post topic)
- Related posts section
- Social sharing links

---

## SEO Strategy

### Primary Keywords

| Keyword | Monthly Volume (Est.) | Difficulty | Page Target |
|---------|----------------------|------------|-------------|
| kubernetes soc2 | 200-500 | Medium | Blog + Homepage |
| kubernetes compliance | 500-1,000 | Medium-High | Blog + Homepage |
| kubernetes security audit | 200-400 | Medium | Blog |
| cis benchmark kubernetes | 500-800 | Medium | Blog + Docs |
| kubernetes compliance automation | 100-200 | Low-Medium | Homepage |

### Secondary Keywords

| Keyword | Monthly Volume (Est.) | Page Target |
|---------|----------------------|-------------|
| kubernetes audit logging | 300-500 | Blog |
| soc2 automation tools | 500-1,000 | Blog |
| kubernetes rbac audit | 200-400 | Blog |
| kubernetes network policy soc2 | 50-100 | Blog |
| kubernetes security hardening | 300-500 | Blog |

### Technical SEO

- Server-side rendering or static generation (Astro SSG or Next.js SSR)
- Proper meta tags, Open Graph, and Twitter cards on every page
- Sitemap.xml and robots.txt
- Structured data (Organization, SoftwareApplication, Article schemas)
- Canonical URLs
- Fast load times (<2s LCP) — critical for developer audience
- Mobile responsive (engineers read on phones at conferences)

### Link Building (Organic)

- Submit to CNCF Landscape / Artifact Hub (backlink + discovery)
- GitHub README links back to varax.io
- Blog posts shared on Reddit, Hacker News, Kubernetes Slack
- Guest posts on DevOps blogs (optional, lower priority)
- Conference talk slides linking to Varax

---

## Technical Stack & Hosting

### Recommended Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | Astro or Next.js (static export) | Fast static sites, great DX, MDX support for blog |
| **Styling** | Tailwind CSS | Consistent with the product ecosystem, fast to iterate |
| **Blog/Docs** | MDX (Markdown + components) | Write content in Markdown, embed interactive elements |
| **Search (Docs)** | Algolia DocSearch (free for OSS) | Industry standard for dev docs search |
| **Hosting** | Cloudflare Pages or Vercel | Free tier sufficient, global CDN, automatic SSL |
| **CMS** | Git-based (MDX files in repo) | No external CMS needed — content lives in the repo |
| **Analytics** | Plausible or Fathom | Privacy-respecting, no cookie banner needed |
| **Email** | Buttondown or ConvertKit | Simple, developer-friendly email marketing |
| **Payments** | Stripe Checkout | Already specified in the Varax Compliance PRD |
| **Forms** | Calendly (consulting) | Scheduling for consulting calls |

### Why Astro Over Next.js for the Marketing Site

- The marketing site is primarily static content (blog, docs, landing pages)
- Astro ships zero JS by default, resulting in faster page loads
- Astro supports MDX natively for blog and docs
- Interactive islands (pricing toggle, search) can use React components where needed
- Astro + Cloudflare Pages = effectively free hosting with global CDN

**Note**: This is separate from the v2 SaaS dashboard, which will use Next.js. The marketing site and the product dashboard are different codebases.

### Repository Structure

```
varax-website/
├── src/
│   ├── pages/
│   │   ├── index.astro              # Homepage
│   │   ├── pricing.astro            # Pricing page
│   │   ├── monitor.astro            # Varax Monitor product page
│   │   ├── sample-report.astro      # Sample report page
│   │   ├── consulting.astro         # Consulting page
│   │   ├── about.astro              # About page
│   │   ├── changelog.astro          # Changelog
│   │   ├── privacy.astro            # Privacy policy
│   │   ├── terms.astro              # Terms of service
│   │   ├── blog/
│   │   │   ├── index.astro          # Blog listing
│   │   │   └── [...slug].astro      # Dynamic blog post pages
│   │   └── docs/
│   │       ├── index.astro          # Docs hub
│   │       └── [...slug].astro      # Dynamic doc pages
│   ├── content/
│   │   ├── blog/                    # MDX blog posts
│   │   └── docs/
│   │       ├── compliance/          # Varax compliance docs (MDX)
│   │       └── monitor/             # Varax Monitor docs (MDX)
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ProductCard.astro
│   │   ├── PricingCard.astro
│   │   ├── ComparisonTable.astro
│   │   ├── CodeBlock.astro
│   │   ├── TerminalDemo.astro
│   │   ├── NewsletterSignup.astro
│   │   ├── CrossPromo.astro
│   │   └── SampleReport.astro
│   ├── layouts/
│   │   ├── Base.astro
│   │   ├── Blog.astro
│   │   └── Docs.astro
│   └── styles/
│       └── global.css
├── public/
│   ├── reports/
│   ├── dashboards/
│   ├── og-images/
│   └── favicon.svg
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## Design Principles

### Overall Aesthetic

**Inspiration**: Tailscale, Linear, Planetscale — clean developer tool marketing sites with technical depth.

**NOT**: Enterprise SaaS landing pages with stock photos, gradient blobs, and "Schedule a Demo" popups.

### Specific Guidelines

1. **Dark mode first** — the primary audience lives in dark terminals. Offer light mode toggle.
2. **Monospace code** — all code blocks, terminal output, and CLI examples in a clear monospace font (JetBrains Mono or similar).
3. **Minimal animation** — subtle transitions only. No parallax, no auto-playing videos, no scroll-jacking.
4. **Terminal-inspired hero** — the hero visual should feel like a terminal window showing `varax scan` in action.
5. **High information density** — DevOps engineers want facts, not whitespace. Pack more content per screen than a typical SaaS site.
6. **No stock photos** — use diagrams, terminal screenshots, report screenshots, and code. If people imagery is needed, use illustrations.
7. **Color palette** — derive from the Kubernetes blue (#326CE5) ecosystem. Consider a complementary security-oriented accent (green for "passing" checks, red/amber for failures).
8. **Typography** — clean sans-serif for body (Inter, system font stack), monospace for code. Two font families maximum.

---

## Email Capture & Nurture

### Capture Points

- Blog post in-content CTAs ("Get the full SOC2 checklist")
- Newsletter signup in footer
- Varax Monitor docs ("Stay updated on new features")
- Exit intent on high-value pages (pricing, sample report)

### Nurture Sequences

**Sequence A: Compliance-focused** (entered via blog or homepage)
1. Welcome + "The 5-Minute SOC2 Readiness Check for Kubernetes" (immediate value)
2. "How Varax Automates SOC2 Evidence Collection" (product education)
3. "Case Study: From 0 to SOC2-Ready in 30 Days" (social proof, when available)
4. "Free vs Pro: What You Get with a Varax License" (conversion)

**Sequence B: Varax Monitor-focused** (entered via monitor docs or GitHub)
1. Welcome + "3 Prometheus Queries Every K8s Operator Should Know" (immediate value)
2. "Why CronJob Monitoring Is Just the Start of K8s Observability" (bridge)
3. "From Monitoring to Compliance: The K8s Maturity Path" (introduce Varax compliance)
4. "Try Varax Free: See Your Cluster's Compliance Score" (conversion)

---

## Stripe Integration & Purchase Flow

### Purchase Flow

1. User clicks "Buy Pro" on pricing page
2. Stripe Checkout session created (server-side)
3. User completes payment on Stripe-hosted page
4. Stripe webhook triggers license key generation
5. User receives email with license key and activation instructions
6. User runs `varax activate [LICENSE_KEY]` in their cluster

### Stripe Configuration

- Product: "Varax Pro"
- Price: $149/month or $1,490/year (2 months free)
- Payment methods: Credit card (Stripe default)
- Receipts: Automatic via Stripe
- Refund policy: 30-day money-back guarantee

---

## Analytics & Tracking

### Tools

- **Plausible or Fathom** — privacy-respecting, no cookie banner needed
- **Stripe Dashboard** — payment analytics
- **Google Search Console** — SEO performance

### Key Events to Track

- Homepage → Pricing page navigation
- Pricing page → Stripe Checkout initiated
- Blog post → Email signup
- Varax Monitor page → Compliance page navigation (cross-sell)
- Docs quickstart → Install command copied
- Sample report page → Pricing page navigation

---

## Legal & Compliance Pages

### Privacy Policy (`/privacy`)

- What data is collected (analytics only — no PII unless they purchase)
- Email list data handling
- Stripe payment data (Stripe handles PCI compliance)
- Cookie policy (none if using Plausible/Fathom)
- GDPR compliance statement

### Terms of Service (`/terms`)

- License terms for Varax free tier (Apache 2.0)
- License terms for Varax Pro (commercial license)
- Acceptable use
- Payment terms and refund policy (30-day money-back guarantee)
- Limitation of liability
- Governing law

**Recommendation**: Use a template generator for initial drafts (e.g., Termly, iubenda) and have a lawyer review before launch. Budget: $500-$1,000 for legal review.

---

## Launch Phases

### Phase 0: Pre-Launch (Before Product v1 is Complete)

**Goal**: Start building SEO authority and email list before the product ships.

- Register domain (varax.io secured)
- Deploy a minimal coming-soon page with email capture
- Publish 2-3 foundational blog posts (target primary SEO keywords)
- Set up analytics
- Create social media accounts

**Deliverables**: varax.io live, 1-3 blog posts indexed, email capture working.

### Phase 1: MVP Launch (Aligned with Varax Monitor Release — Weeks 1-3)

**Goal**: Minimum viable site for the Varax Monitor launch. This is Varax's first public appearance.

**Pages to ship**:
- Homepage (two-product hero, features, install CTAs)
- Varax Monitor landing page (`/monitor`)
- Varax Monitor quickstart docs
- Blog with 2-3 CronJob-focused posts
- Privacy policy and terms of service
- About page

**Not needed for Phase 1**: Pricing page, Stripe integration, compliance docs, sample report, consulting page.

**Timeline**: 1 week of focused development (Varax Monitor ships in Weeks 1-3, so the site needs to be ready).

### Phase 1.5: Compliance Launch (Aligned with Product v1 Phase 4 — Week 14+)

**Goal**: Full marketing site for the Varax compliance platform launch.

**Pages to add**:
- Pricing page with Stripe Checkout integration
- Varax compliance quickstart docs
- Sample report page
- Full compliance documentation
- 3-5 compliance-focused blog posts

**Timeline**: 1-2 weeks of focused development.

### Phase 2: Content Expansion (Months 4-6)

**Goal**: Full content marketing engine running.

- Complete documentation site (all doc pages)
- Consulting page
- 10+ blog posts published
- Email nurture sequence active
- Comparison table on homepage
- Changelog page

### Phase 3: Optimization (Months 7-12)

**Goal**: Conversion optimization based on data.

- A/B test pricing page layout
- Add ROI calculator
- Add customer testimonials / case studies (once available)
- Optimize based on analytics data
- Consider adding a product demo video (terminal screencast)

---

## Open Questions

1. ~~**Product name and domain**~~ — Resolved. Brand is Varax, domain is varax.io, compliance platform is Varax, OSS monitor is Varax Monitor.
2. **Blog authoring workflow** — Write in Markdown and commit to Git? Or use a headless CMS? Recommendation: Git-based (simpler, no dependencies).
3. **Docs versioning** — Do we need versioned docs from day one, or can we start with "latest only" and add versioning later? Recommendation: Latest-only for v1.
4. **Sample report: real or synthetic data?** — The sample report should show realistic cluster data. Do we generate this from a sample Kind cluster, or hand-craft the data? Recommendation: Generate from a real Kind cluster with intentional failures for demonstration.
5. **Consulting scheduling** — Calendly free tier, or build a simple contact form? Recommendation: Calendly free tier (less friction, immediate confirmation).
6. **Legal budget** — Do we want a lawyer to review privacy policy and ToS before launch, or use templates for MVP? Recommendation: Templates for MVP, lawyer review within 60 days.
7. **GitHub org availability** — Need to confirm `github.com/varax` is available. If not, use `github.com/varax-io`.

---

*Document Version: 2.0*
*Last Updated: March 2026*
*Status: Planning*
*Brand: Varax*
*Domain: varax.io*