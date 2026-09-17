# Platform & Infrastructure Awareness

### Question a5cf8a95-fcdc-423b-b0c4-f64e2e6bc4e9

- An engineer adds custom redirects and security headers directly inside the Vercel/Cloudflare web console. Why is this **"Dashboard Drift Smell"** dangerous, and how does **Hosting Config as Code** eliminate it?

### Answer

- **The dashboard drift smell**:
  - Web console configurations exist outside git version control; they cannot be code-reviewed, diffed, or rolled back.
  - If the hosting account is migrated, a preview environment is created, or a disaster recovery spin-up occurs, all dashboard rules vanish.
  - Developers debugging locally cannot replicate production routing rules because the headers and rewrites only exist in the remote GUI.
- **Hosting Config as Code**:
  - All routing rules, custom response headers (CSP, HSTS), URL rewrites, and caching directives must be committed to the repository in declarative configuration files (`vercel.json`, `netlify.toml`, `wrangler.toml`).
  - Changes undergo standard pull request review, run against preview deployments, and maintain a historical git audit trail.

```json
// vercel.json
// ✅ Declarative, version-controlled edge routing and security headers
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "redirects": [
    { "source": "/old-pricing", "destination": "/pricing", "permanent": true }
  ]
}
```

- [More detail on Vercel Project Configuration](https://vercel.com/docs/projects/project-configuration)

---

### Question e8c86bd8-2d10-4bb5-b0a8-50722a06187c

- What is the **GitOps** deployment pattern, and how does it establish Git as the single source of truth for both application and infrastructure state?

### Answer

- **GitOps core philosophy**:
  - The entire desired state of the system (application code, environment configurations, and infrastructure declarations) is stored declaratively in a Git repository.
  - Deployment is driven strictly by Git operations (pull requests, merges, and tags). Engineers never manually run deployment scripts or touch production servers.
- **Continuous Reconciliation**:
  - Automated deployment agents or GitOps operators (e.g., ArgoCD, Flux, or native cloud host webhooks) continuously monitor the Git repository.
  - When a commit merges to `main`, the operator detects drift between the active production state and the declared Git state, automatically converging production to match Git.
- **Senior benefit**: Rollbacks are standard `git revert` operations; access control is managed via standard Git repository permissions rather than provisioning cloud CLI credentials to individual developers.

- [More detail on GitOps Principles](https://opengitops.dev/)

---

### Question c4008e46-ea6a-4392-aff1-9a4c7b49c259

- How does a senior frontend engineer demonstrate **Infrastructure as Code (IaC) Literacy** (Terraform / Pulumi) without being a full-time DevOps or cloud engineer?

### Answer

- **The senior frontend boundary**: Senior frontend engineers are not expected to architect complex Kubernetes clusters or multi-region VPC topologies from scratch.
- **The baseline IaC literacy standard**:
  1. **Reading & Reviewing Edge Infrastructure**: Ability to read Terraform/Pulumi definitions that declare CloudFront distributions, S3 buckets, Route53 DNS records, and SSL certificates.
  2. **Advocating for Edge Hygiene**: Identifying anti-patterns in PRs (e.g., missing Gzip/Brotli compression in CDN configs, insecure default S3 permissions, or incorrect cache TTLs on edge behaviors).
  3. **Self-Service Capability**: Modifying an existing Terraform file to add a new subdomain redirect or update an S3 lifecycle policy without requiring a dedicated DevOps ticket.

```hcl
# main.tf: Senior frontend literacy example - auditing CloudFront distribution caching
resource "aws_cloudfront_distribution" "frontend_cdn" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-frontend"
  }

  default_cache_behavior {
    target_origin_id       = "S3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true # ✅ Senior check: verify Brotli/Gzip compression is active!
    default_ttl            = 86400
  }
}
```

- [More detail on Terraform AWS CloudFront Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution)
