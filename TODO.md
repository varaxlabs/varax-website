# Varax Compliance — Launch Tracker

Last updated: 2026-03-07 (backend launch-ready)

---

## What's Built

### Phase 0: Foundation

_Built before task tracking began. Reconstructed from commit history and codebase._

#### Project Bootstrap & Rename

- [x] Initial project scaffolding as "KubeShield" — Kubebuilder operator layout, Go module, Makefile, Dockerfile, LICENSE
- [x] Rename to "Varax" — binary, module path (`github.com/varax/operator`), CLI commands, CRD group (`compliance.varax.io`), all references
- [x] Product Requirements Document (`varax-compliance-prd.md`) — comprehensive spec covering target market, architecture, SOC2 mapping strategy, pricing model, and growth plan
- [x] Architecture documentation (`docs/architecture.md`) — system overview, dual-mode design (CLI + operator), scanning engine flow, compliance mapping, output layer diagrams
- [x] Developer guide (`docs/developing.md`) — build instructions, testing conventions, adding checks, project structure walkthrough

#### CRD & API Design

- [x] `ComplianceConfig` CRD type definition (`api/v1alpha1/complianceconfig_types.go`) — spec covers framework selection, control include/exclude lists, scanning interval, namespace exclusions, audit logging toggle, remediation config (auto-remediate + dry-run), report formats and schedule, alerting thresholds (score + critical violation count)
- [x] CRD status subresource — phase tracking (Scanning/Compliant/Violations/Error), last scan time, compliance score, violation count, per-framework status summary, Kubernetes conditions
- [x] `kubectl` printer columns — Framework, Score, Violations, Phase, Age visible in `kubectl get complianceconfigs`
- [x] Generated deep copy functions (`zz_generated.deepcopy.go`)
- [x] CRD YAML manifest (`helm/varax/crds/complianceconfig-crd.yaml`) with validation rules (enum, pattern, min/max)
- [x] Sample ComplianceConfig (`config/samples/complianceconfig_soc2.yaml`)

_The CRD was designed with forward-looking fields (remediation, reports, alerts, schedule) from the start — anticipating features that would be built incrementally. This meant the API contract was stable from day one and didn't need breaking changes as features landed._

#### Operator Controller

- [x] Reconciler loop (`internal/controller/complianceconfig_controller.go`) — watches ComplianceConfig, runs scan, maps to SOC2, updates CRD status, records Prometheus metrics, requeues on configurable interval
- [x] Phase state machine — transitions through Scanning → Compliant/Violations, with Error handling
- [x] Configurable scan interval with minimum 1-minute floor to prevent API server DoS
- [x] Audit logging reconciliation — detects cloud provider, auto-enables audit logging via provider-specific SDK
- [x] EKS cluster name detection from node labels (`alpha.eksctl.io/cluster-name`, `eks.amazonaws.com/cluster`)
- [x] Controller RBAC annotations — fine-grained `+kubebuilder:rbac` markers for pods, namespaces, RBAC resources, network policies, apps workloads

_The controller was designed to be self-contained: it builds its own kubernetes clientset from the manager's REST config rather than requiring injection. This simplifies the operator setup — just deploy and point at a ComplianceConfig._

#### Scanning Engine

- [x] `Check` interface (`pkg/scanning/scanner.go`) — ID, Name, Description, Severity, Benchmark, Section, Run method. All checks are pure functions against a `kubernetes.Interface`.
- [x] Registry pattern (`pkg/scanning/scanner.go`) — `Register()`, `All()`, `ByBenchmark()`, `BySection()` filtering. Checks self-register via `RegisterAll()`.
- [x] `ScanRunner` orchestration (`pkg/scanning/runner.go`) — iterates all registered checks, panic recovery per check, context cancellation support, progress callback for TUI integration, scan timing and summary computation
- [x] Per-check timeout (30s) — prevents a single slow/stuck API call from blocking the entire scan
- [x] Initial 20 CIS Section 5 checks — workload security (RBAC, pod security, network policies, secrets, namespaces)
- [x] System namespace skipping — `kube-system`, `kube-public`, `kube-node-lease` excluded from all checks to avoid false positives on infrastructure components

_Starting with Section 5 was a deliberate choice: these are the checks that matter on managed Kubernetes where sections 1-4 are provider-controlled. This gave the scanner immediate value for the target market (EKS/AKS/GKE users) before the full CIS benchmark was implemented._

#### Data Model

- [x] Check result model (`pkg/models/types.go`) — CheckResult with ID, severity, status (Pass/Fail/Warn/Skip), per-resource evidence (kind, name, namespace, field, value), message
- [x] Scan result model — scan ID, timestamp, duration, results array, summary counts
- [x] Five severity levels — Critical, High, Medium, Low, Info
- [x] Compliance model (`pkg/models/compliance.go`) — Control, ControlMapping, ControlResult (with status: Pass/Fail/Partial/NotAssessed), ComplianceResult with framework, score, control results

#### SOC2 Compliance Mapping

- [x] SOC2 Trust Services Criteria controls (`pkg/compliance/soc2_controls.go`) — 16 controls defined (CC5.1, CC5.2, CC6.1-CC6.8, CC7.1-CC7.4, CC8.1, A1.1, A1.2) spanning access control, monitoring, change management, and availability
- [x] CIS-to-SOC2 mapper (`pkg/compliance/mapper.go`) — maps check results to control results, derives control status from constituent check outcomes (all pass → Pass, any fail → Fail, mixed → Partial)
- [x] Compliance scorer (`pkg/compliance/scorer.go`) — percentage-based scoring: passing controls / assessed controls × 100

#### CLI Output Layer

- [x] Lipgloss style system (`pkg/cli/styles.go`) — color palette, severity badge rendering (Critical=red, High=orange, etc.), status badges, section headers
- [x] Theme engine (`pkg/cli/theme.go`) — styled vs. plain mode, auto-detect TTY via `term.IsTerminal()`
- [x] Score gauge (`pkg/cli/score_gauge.go`) — visual compliance score with color-coded bar (green ≥80, yellow ≥60, red <60)
- [x] Summary box (`pkg/cli/summary_box.go`) — bordered output with pass/fail/warn/skip counts, framework, scan time
- [x] Control table (`pkg/cli/control_table.go`) — tabular control status display with colored status badges
- [x] JSON output mode (`pkg/cli/json_output.go`) — machine-readable output for CI/CD integration

#### Cloud Providers

- [x] Provider abstraction (`pkg/providers/provider.go`) — `AuditLogProvider` interface with `EnableAuditLogging()` and `IsAuditLoggingEnabled()`
- [x] Provider detection (`pkg/providers/detect.go`) — reads node labels to identify EKS (`eks.amazonaws.com/`), AKS (`kubernetes.azure.com/`), GKE (`cloud.google.com/`), defaults to SelfHosted
- [x] EKS provider (`pkg/providers/aws/eks.go`) — real AWS SDK v2 implementation, `NewEKSProvider()` loads credentials, enables CloudWatch audit log types
- [x] Self-hosted provider (`pkg/providers/selfhosted/`) — creates audit policy ConfigMap for self-managed clusters

#### BoltDB Storage

- [x] Store interface (`pkg/storage/store.go`) — SaveScanResult, GetLatestScanResult, ListScanResults, SaveEvidenceBundle, GetLatestEvidenceBundle, SaveLicense, GetLicense, PruneOlderThan, Close
- [x] BoltDB implementation (`pkg/storage/boltdb.go`) — file-based embedded database, separate buckets for scans, evidence, licenses, remediation reports
- [x] Default path: `~/.varax/varax.db` with `0700` directory permissions

#### Prometheus Metrics

- [x] 7 metric definitions (`pkg/metrics/metrics.go`) — compliance score (by framework+cluster), violations (by severity+framework), control status (by framework+control), last scan timestamp, scan duration, checks by status, audit logging enabled (by provider+cluster)
- [x] `RecordControlStatus()` helper — maps status strings to numeric gauge values (Pass=1, Partial=0.5, Fail=0, else=-1)

_The metrics were designed for Grafana dashboard integration from the start — labeled by framework and cluster so multi-cluster deployments can aggregate. The audit logging metric is a nice touch for alerting: you can fire an alert if any cluster drops to 0._

#### Helm Chart

- [x] Full Helm chart (`helm/varax/`) — Chart.yaml, values.yaml, NOTES.txt, helpers template
- [x] Deployment template — configurable replicas, resource limits, security context (non-root, read-only rootfs, drop all capabilities), liveness/readiness probes
- [x] RBAC templates — ClusterRole, ClusterRoleBinding, ServiceAccount, audit policy Role
- [x] PersistentVolumeClaim for BoltDB storage
- [x] NetworkPolicy — ingress restricted to Prometheus scrape + kubelet probes, egress limited to DNS + K8s API + cloud APIs
- [x] PodDisruptionBudget — configurable minAvailable for HA deployments
- [x] ServiceMonitor for Prometheus Operator integration — configurable scrape interval, optional TLS
- [x] Service for metrics endpoint exposure
- [x] Default ComplianceConfig resource creation

_The Helm chart was production-hardened from the start: NetworkPolicy, PDB, non-root security context, read-only filesystem. This is table stakes for a compliance product — you can't sell security tooling that doesn't follow its own advice._

#### Dockerfile & Build

- [x] Multi-stage Dockerfile — Go builder stage, distroless runtime image (`gcr.io/distroless/static:nonroot`), non-root user (65532)
- [x] Static binary build — `CGO_ENABLED=0`, stripped (`-ldflags="-s -w"`)
- [x] Build-arg support for SHA256 digest pinning of base images (supply chain security)
- [x] `.dockerignore` — excludes test files, docs, git history from build context
- [x] Makefile targets — build, test, fmt, vet, lint, generate, manifests, docker-build, clean

#### Testing Foundation

- [x] k8s fake clientset pattern — all check tests use `fake.NewSimpleClientset()` with fixture data, no real cluster needed
- [x] testify assert/require — consistent assertion style across all test files
- [x] CLI unit tests (`cmd/varax/cmd_test.go`) — command wiring, flag parsing, input validation
- [x] Coverage threshold — >80% enforced

### Phase 1: Operator Core

- [x] Kubebuilder scaffolding + ComplianceConfig CRD (`api/v1alpha1/`)
- [x] Cobra CLI commands: `operator`, `scan`, `version` (`cmd/varax/`)
- [x] Lipgloss style foundation: palette, badges, summary box, theme (`pkg/cli/styles.go`, `theme.go`)
- [x] Cloud provider auto-detection: EKS/AKS/GKE/self-hosted (`pkg/providers/detect.go`)
- [x] Auto-enable audit logging — EKS via AWS SDK (`pkg/providers/aws/eks.go`)
- [x] CIS Benchmark scanner — 85 checks registered (`pkg/scanning/checks/`)
- [x] SOC2 control mapping — 16 controls (`pkg/compliance/soc2_controls.go`)
- [x] Deployment validation output: score gauge + summary box (`pkg/cli/score_gauge.go`, `summary_box.go`)
- [x] Prometheus metrics endpoint — 7 metric types (`pkg/metrics/metrics.go`)
- [x] Helm chart: deployment, RBAC, PVC, CRD, NOTES.txt (`helm/varax/`)
- [x] Unit tests >80% coverage (currently 80.5%)
- [x] BoltDB local storage for scan history (`pkg/storage/`)
- [x] Dual-mode output: styled/plain/JSON with TTY auto-detect (`pkg/cli/theme.go`, `json_output.go`)

### Phase 2: Full Scanner + Evidence

- [x] CIS Benchmark scanner expansion — 85 checks across sections 1-5
- [x] NSA/CISA hardening guide scanner — 15 checks: 6 unique + 9 delegating (`pkg/scanning/checks/nsa_*.go`)
- [x] Pod Security Standards checker — 5 checks (`pkg/scanning/checks/pss_checks.go`)
- [x] RBAC analyzer (least privilege) — 4 checks + analyzer module (`pkg/rbac/`, `pkg/scanning/checks/rbac_checks.go`)
- [x] Full SOC2 control mapping for all checks — 16 controls mapped to CIS/NSA/PSS/RBAC
- [x] Compliance score calculation — percentage-based with partial support (`pkg/compliance/scorer.go`)
- [x] Evidence collector: RBAC, Network, Audit, Encryption (`pkg/evidence/`)
- [x] `varax scan` with Bubble Tea animated progress — spinner, progress bar, ETA (`pkg/cli/tui/`)
- [x] Styled control table with badges (`pkg/cli/control_table.go`)
- [x] `varax status` command — history, controls, evidence, benchmark filter (`cmd/varax/status.go`)
- [x] Azure AKS audit log provider — interface, logic, tests (`pkg/providers/azure/`). Real Azure SDK not wired (deferred).
- [x] GCP GKE audit log provider — interface, logic, tests (`pkg/providers/gke/`). Real GCP SDK not wired (deferred).

#### Provider SDK Status

| Provider | Interface | Logic | Tests | Real SDK | Production-Ready |
|----------|-----------|-------|-------|----------|-----------------|
| EKS (AWS) | Done | Done | Done | `aws-sdk-go-v2` wired, `NewEKSProvider()` loads real credentials | Yes |
| AKS (Azure) | Done | Done | Done | No Azure SDK in go.mod, only `NewAKSProviderWithClient()` (mock injection) | Deferred |
| GKE (Google) | Done | Done | Done | No GCP SDK in go.mod, only `NewGKEProviderWithClient()` (mock injection) | Deferred |
| Self-hosted | Done | Done | Done | Uses k8s client directly, `NewSelfHostedProvider()` | Yes |

### Infrastructure & Hardening

- [x] GitHub Actions CI workflow (`.github/workflows/ci.yaml`) — `go mod verify`, golangci-lint, vet, test, gosec SAST, govulncheck, 80% coverage threshold, build
- [x] GitHub Actions release workflow (`.github/workflows/release.yaml`) — tag-triggered: test, build + push to GHCR, Cosign keyless signing, Helm chart OCI push + signing
- [x] Dockerfile supply chain security — distroless base image, non-root user, SHA256 digest pinning support
- [x] Helm RBAC tightening — separate ClusterRole/ServiceAccount/Role scoping, audit policy role isolation
- [x] Controller nil pointer guard + configurable dev-mode logging
- [x] DRY refactor — extracted shared check helpers (`pkg/scanning/checks/helpers.go`): system namespace filtering, managed cluster detection, control plane check skipping
- [x] Generic resource cache (`pkg/scanning/cache.go`) — pre-fetches all K8s resources with 500-item pagination. Single generic `paginatedList[T any]` helper replaces 9 near-identical functions.
- [x] Evidence collection hardening — paginated fetching (500 items), error aggregation via `errors.Join`
- [x] Prometheus metric naming fix — removed `_total` suffix from Gauge metrics (Counter-only convention)
- [x] golangci-lint v2.10.1 with gosec exclusions for false positives (G115, G203)
- [x] Go version management — 1.25 → 1.25.7 → 1.26.1, tracking stdlib vulnerability fixes
- [x] Dependency vulnerability fixes — `golang.org/x/oauth2` (GO-2025-3488), OpenTelemetry SDK

### Data Retention

- [x] `varax prune` CLI command — `--max-age` flag (default 30 days)
- [x] Auto-prune on scan save — records >90 days automatically cleaned
- [x] `--history` flag capped at 100 to prevent excessive memory use
- [x] `PruneOlderThan` added to Store interface with BoltDB implementation

### Phase 3: Reports, Licensing & TUI

- [x] HTML report templates: readiness, executive, control detail (`pkg/reports/templates/`)
- [x] Go html/template rendering engine with go:embed (`pkg/reports/html_renderer.go`)
- [x] Embedded CSS for professional styling, print-friendly (`pkg/reports/css.go`)
- [x] `varax report` CLI command: html + json, readiness + executive (`cmd/varax/report.go`)
- [x] `varax evidence` CLI command: per-control + all-controls (`cmd/varax/evidence.go`)
- [x] Evidence-to-control mapping (`pkg/reports/evidence_mapping.go`)
- [x] Remediation guidance — ~80 check IDs (`pkg/reports/remediation.go`)
- [x] Scan metadata in reports: duration, pass/fail/warn/skip counts
- [x] Historical trend data in reports from BoltDB scan history
- [x] Template functions library (`pkg/reports/funcs.go`)
- [x] Shared responsibility section in reports — provider-managed vs customer-controlled
- [x] `StatusProviderManaged` check status — distinguishes provider-managed from error skips
- [x] License key validation — Ed25519-signed keys with 5-day grace period (`pkg/license/`)
- [x] Free vs Pro feature gating (`pkg/license/features.go`)
- [x] `varax license status` and `activate` commands
- [x] License key generation tool (`cmd/keygen/`) — `generate-keypair` and `sign` subcommands (internal, not shipped)
- [x] `varax explore` interactive TUI — Bubble Tea full-screen, vim keybindings, drill into controls/checks
- [x] Terminal report format (`--format terminal`) — Lipgloss-rendered
- [x] Score trend rendering (`pkg/cli/trend.go`) — sparkline with directional change indicators

### Phase 4: Auto-Remediation & Release

- [x] Auto-remediation engine — plan/execute orchestration with safety checks (`pkg/remediation/`)
- [x] Remediators: security context, pod spec, service account, network policy, limit range (`pkg/remediation/remediators/`)
- [x] Remediation storage — reports persisted to BoltDB, metrics recorded
- [x] `varax remediate` CLI command + `--remediate` flag on scan
- [x] Operator controller integration — auto-remediation gated by CRD spec + Pro license
- [x] Container image on GHCR with Cosign/Sigstore keyless signing
- [x] Helm chart published to GHCR as OCI artifact (`oci://ghcr.io/varaxlabs/charts/varax`)
- [x] Sample reports in `/examples/`
- [x] `varax license refresh` command + license API client (`pkg/license/client.go`)
- [x] Shell completion command — `varax completion bash|zsh|fish` (`cmd/varax/completion.go`)
- [x] Dockerfile base image SHA256 digest pinning (golang + distroless)
- [x] License key format spec for frontend team (`docs/license-key-spec.md`)
- [x] README CLI reference — added explore, remediate, license refresh, completion, scan flags

---

## Managed Kubernetes & Shared Responsibility Model

### The compliance reality on managed K8s

Managed K8s (EKS/AKS/GKE) is our primary market — Series A-C startups almost always run managed.
The shared responsibility model means the cloud provider handles the control plane, but the
customer still owns everything in the data plane: RBAC, pod security, network policies, secrets
management, audit log retention, workload configuration. That's the majority of what SOC2
auditors actually ask about.

Most teams don't fully understand where the provider's responsibility ends and theirs begins.
The audit log situation is a perfect example: EKS disables control plane audit logging by
default. Companies assume "it's managed, so it's fine" — and fail an audit because there's
no evidence trail. That's a gap Varax directly closes.

### What Varax can and can't do on managed clusters

| CIS Section | Component | Managed K8s Status | Varax Action |
|-------------|-----------|-------------------|--------------|
| 1.2.x (26 checks) | API Server flags | Provider-managed | Report as "Provider-Managed" with shared responsibility note |
| 1.3.x (7 checks) | Controller Manager | Provider-managed | Report as "Provider-Managed" |
| 1.4.x (2 checks) | Scheduler | Provider-managed | Report as "Provider-Managed" |
| 2.x (7 checks) | etcd | Provider-managed | Report as "Provider-Managed" |
| 3.x (2 checks) | Control Plane Config | Provider-managed | Report as "Provider-Managed" |
| 4.2.x (13 checks) | Kubelet | Partially managed | Mixed — scan what's accessible, note the rest |
| 5.x (28 checks) | Workload Security | **Customer-controlled** | Full scanning + evidence + remediation |

### Check count reality

| Benchmark | Registered | Actionable on Managed K8s |
|-----------|-----------|--------------------------|
| CIS | 85 | ~30 (sections 5.x customer-controlled; 1-4 provider-managed but reported) |
| NSA/CISA | 15 | ~15 (mostly workload-level) |
| PSS | 5 | 5 (namespace-level, always customer-controlled) |
| RBAC | 4 | 4 (always customer-controlled) |
| **Total** | **109** | **~54 actionable + ~55 provider-managed (reported, not skipped)** |

All 109 checks are valuable — the provider-managed ones inform auditors about the shared
responsibility split.

**The real differentiator**: AWS Security Hub tells you "your EKS cluster has 3 findings."
Varax tells you "here's your CC6.1 evidence package, here's your RBAC snapshot, here's proof
audit logging is enabled and retained for 13 months." Plus a clear shared responsibility
section that maps provider-managed controls for the auditor.

---

## Launch Blockers

_These must be done before taking money._

### Frontend repo (Astro + Cloudflare Worker)

The backend (this repo) is launch-ready. Remaining work lives in the frontend repo:

- [ ] Astro landing page — pricing, features, docs
- [ ] Stripe Checkout integration — payment flow
- [ ] Cloudflare Worker for license key minting — receives Stripe `checkout.session.completed` webhook, Ed25519-signs license keys, emails to customer. **See [`docs/license-key-spec.md`](docs/license-key-spec.md) for the signing contract.**
- [ ] Deploy Ed25519 private key to Worker environment (generated via `cmd/keygen/ generate-keypair`, never in git)
- [ ] Stripe webhook secret validation in Worker

### Verify the happy path

- [ ] End-to-end: `helm install` → `varax scan` → see compliance score on a real cluster
- [ ] End-to-end: `keygen sign` → `varax license activate` → `varax report` → HTML opens in browser
- [ ] End-to-end: Stripe test checkout → Worker fires → key arrives in email → activate works

---

## Launch Polish

_Important but not strictly blocking revenue._

- [ ] README screenshots and terminal output GIFs — the quick-start section has commands but no visuals

---

## Post-Launch / v1.1+

### Provider Completion

- [ ] GKE real SDK client — add `cloud.google.com/go/container/apiv1`, implement `NewGKEProvider()`
- [ ] Azure AKS real SDK client — add `github.com/Azure/azure-sdk-for-go`, implement `NewAKSProvider()`

### Feature Expansion

- [ ] Scheduled report generation (cron-based, operator mode)
- [ ] PDF export (currently: browser Print → Save as PDF)
- [ ] Auto-refresh license in operator controller (periodic `license refresh` call)

### Out of Scope (separate repos)

- SaaS dashboard — **v2** (varax-api, varax-dashboard)
- Documentation site — separate concern, README is sufficient for v1
- HIPAA / PCI-DSS framework mappings — v2
- Multi-cluster aggregation — v2
