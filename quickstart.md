# Varax Quickstart Guide

Varax is a Kubernetes compliance automation tool that maps CIS benchmarks to SOC 2 controls, giving you a real-time compliance score and actionable remediation steps.

## What You Get

- **50+ security checks** across CIS Kubernetes Benchmarks, NSA/CISA hardening guidelines, Pod Security Standards, and RBAC best practices
- **SOC 2 control mapping** — each check maps to SOC 2 controls, producing a compliance score
- **Auto-remediation** (Pro) — fix violations with a single flag
- **Evidence collection** (Pro) — export bundles for auditors
- **Reports** (Pro) — HTML readiness and executive compliance reports
- **Interactive explorer** (Pro) — full-screen TUI for drilling into results
- **Scan history** — local BoltDB storage with automatic 90-day pruning

## Prerequisites

- A running Kubernetes cluster (any distribution)
- `kubectl` configured with cluster access
- Helm 3 (for operator mode)

## Install

### Binary (CLI Mode)

```bash
# macOS / Linux
curl -sSL https://get.varax.io | sh

# Or download from GitHub Releases
```

### Helm (Operator Mode)

```bash
helm repo add varax https://charts.varax.io
helm repo update
helm install varax varax/varax -n varax-system --create-namespace
```

### Docker

```bash
docker pull ghcr.io/varaxlabs/varax:latest
```

## Your First Scan

Run a one-shot compliance scan against your cluster:

```bash
varax scan
```

This connects to your current kubeconfig context, runs all checks, maps results to SOC 2 controls, and displays a compliance score.

<!-- screenshot: scan output with score gauge and control table -->

### Output Formats

```bash
# Styled terminal output (default when TTY detected)
varax scan

# Plain text (no ANSI colors, good for CI logs)
varax scan -o plain

# JSON (pipe to jq, store in S3, send to a dashboard)
varax scan -o json
```

### Filter by Benchmark

```bash
# Only CIS Kubernetes Benchmark checks
varax scan --benchmark CIS

# Only NSA/CISA hardening checks
varax scan --benchmark NSA-CISA

# Only Pod Security Standards checks
varax scan --benchmark PSS

# Only RBAC best-practice checks
varax scan --benchmark RBAC

# All benchmarks (default)
varax scan --benchmark all
```

### Scan with Evidence Collection (Pro)

```bash
varax scan --evidence
```

Collects cluster evidence (pod specs, RBAC bindings, network policies, etc.) and stores them alongside the scan result. Export later with `varax evidence export`.

### Scan with Auto-Remediation (Pro)

```bash
# Preview what would be fixed (dry-run is on by default)
varax scan --remediate

# Actually apply fixes
varax scan --remediate --dry-run=false
```

Remediation patches workloads to fix violations (e.g., setting `runAsNonRoot: true`, dropping capabilities). System namespaces (`kube-system`, `kube-public`, `kube-node-lease`) are always skipped.

## View Scan History

```bash
# Latest scan status with SOC 2 control breakdown
varax status

# Last 5 scans
varax status --history 5

# Show evidence collection status
varax status --evidence

# Filter controls by benchmark
varax status --benchmark CIS
```

## Generate Reports (Pro)

```bash
# Generate an HTML compliance report
varax report generate

# Export evidence bundle
varax evidence export
```

## Continuous Monitoring (Operator Mode)

Deploy Varax as a Kubernetes operator for continuous compliance scanning.

### Helm Install

```bash
helm install varax varax/varax \
  -n varax-system --create-namespace \
  --set config.scanInterval=1h \
  --set config.remediation.enabled=true \
  --set config.remediation.dryRun=true
```

### ComplianceConfig CRD

For fine-grained control, create a `ComplianceConfig` resource:

```yaml
apiVersion: compliance.varax.io/v1alpha1
kind: ComplianceConfig
metadata:
  name: soc2-compliance
  namespace: varax-system
spec:
  framework: SOC2
  scanning:
    interval: "5m"
    excludeNamespaces:
      - kube-system
      - kube-public
      - kube-node-lease
  auditLogging:
    enabled: false
  remediation:
    autoRemediate: false
    dryRun: true
  reports:
    formats:
      - json
    schedule: "0 0 * * 0"
  alerts:
    scoreThreshold: 70
    criticalViolations: 0
```

```bash
kubectl apply -f complianceconfig.yaml
```

### Prometheus Metrics

The operator exposes Prometheus metrics. Enable the ServiceMonitor:

```bash
helm install varax varax/varax \
  -n varax-system --create-namespace \
  --set prometheus.serviceMonitor.enabled=true
```

## Licensing

Varax has a free tier and a Pro tier.

**Free** — all 50+ compliance checks, SOC 2 scoring, scan history, JSON/plain/styled output.

**Pro** — adds auto-remediation, evidence collection, reports, scheduled reports, and the interactive explorer.

### Activate a License

```bash
# Set your license key (persisted to ~/.varax/license)
export VARAX_LICENSE_KEY="<your-key>"

# Or pass it in the Helm chart
helm install varax varax/varax \
  --set licenseKey="<your-key>"
```

### Refresh a License

```bash
varax license refresh
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Compliance scan
  run: |
    varax scan -o json > compliance.json
    SCORE=$(jq '.compliance.overall_score' compliance.json)
    echo "Compliance score: $SCORE%"
    if [ "$SCORE" -lt 80 ]; then
      echo "::error::Compliance score $SCORE% is below 80% threshold"
      exit 1
    fi
```

### GitLab CI Example

```yaml
compliance:
  stage: test
  script:
    - varax scan -o json > compliance.json
    - |
      SCORE=$(jq '.compliance.overall_score' compliance.json)
      if [ "$SCORE" -lt 80 ]; then
        echo "Compliance score $SCORE% below threshold"
        exit 1
      fi
  artifacts:
    paths:
      - compliance.json
```

## Shell Completion

```bash
# Bash
varax completion bash > /etc/bash_completion.d/varax

# Zsh
varax completion zsh > "${fpath[1]}/_varax"

# Fish
varax completion fish > ~/.config/fish/completions/varax.fish
```

## Storage Management

Scan results are stored locally in `~/.varax/varax.db` (BoltDB). Scans older than 90 days are auto-pruned. To manually prune:

```bash
# Prune records older than 30 days
varax prune --max-age 30d
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--kubeconfig` | Path to kubeconfig file (default: `~/.kube/config`, then `KUBECONFIG` env, then in-cluster) |
| `-o, --output` | Output format: `styled`, `plain`, or `json` |

## What's Next

- Explore your results: `varax explore` (Pro)
- Set up continuous scanning with the Helm operator
- Export evidence for your next SOC 2 audit: `varax evidence export`
- Integrate into CI to gate deployments on compliance score
