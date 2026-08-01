# Web security

### Question a66e88c5-1e40-4212-ad25-5bbda088a2d7

- Security Headers - Strict-Transport-Security (HSTS)

### Answer

- purpose: enforce HTTPS, prevent downgrade attacks, Man-in-the-Middle (MITM)
- value: max-age=63072000; includeSubDomains; preload
  - max-age=63072000 → 2 years
  - includeSubDomains → apply to all subdomains
  - preload → allow browser to preload HSTS list
  - Forces the browser to strictly communicate over HTTPS only for 2 years (including subdomains) and allows domain preloading.

---

### Question 8c7de6af-90d0-4fb9-a663-a53be5724784

- Security Headers - X-Frame-Options

### Answer

- purpose: prevent clickjacking attacks
- value: DENY | SAMEORIGIN | ALLOW-FROM uri
  - DENY → disallow all framing
  - SAMEORIGIN → allow framing only from the same origin
  - ALLOW-FROM uri → allow framing only from the specified URI
  - Prevents any website from loading your site inside an `<iframe>` (legacy browser fallback for CSP frame-ancestors 'none').

---

### Question 57a9a2ae-a861-412d-9125-29d01669b147

- Security Headers - X-Content-Type-Options

### Answer

- purpose: prevent MIME type sniffing
- value: nosniff
  - Prevents the browser from interpreting files as a different MIME type than what is specified in the Content-Type header, reducing the risk of executing malicious scripts.

---

### Question 26bbd761-d11a-468e-a2e7-7d73b6438545

- Security Headers - Referrer-Policy

### Answer

- what is it: "When a user clicks a link on my website, here is how much information you are allowed to tell the website they land on."
- purpose: control the amount of referrer information sent with requests
- value: no-referrer | no-referrer-when-downgrade | origin | origin-when-cross-origin | same-origin | strict-origin | strict-origin-when-cross-origin | unsafe-url
  - strict-origin-when-cross-origin → send the full URL for same-origin requests, the origin for cross-origin requests, and no referrer for cross-origin requests to less secure destinations
  - same-origin → send the full URL only for same-origin requests
  - no-referrer → never send the Referer header
  - no-referrer-when-downgrade → send the Referer header only when navigating to a same-origin or HTTPS page

- others:
  - origin → send only the origin of the document
  - origin-when-cross-origin → send the full URL for same-origin requests, but only the origin for cross-origin requests
  - strict-origin → send the origin only for same-origin requests, and no referrer for cross-origin requests
  - unsafe-url → always send the full URL, even for cross-origin requests

---

### Question df6105d0-f23e-4c48-a205-48dd30256158

- Security Headers - Permissions-Policy

### Answer

- purpose: control access to browser features and APIs, prevent Feature Exploitation
- value: geolocation=(self), microphone=(), camera=()
  - geolocation=(self) → allow geolocation only for the same origin
  - microphone=() → disallow microphone access for all origins

---

### Question 5872ede3-1ed1-4dad-85fe-18690a031845

- Security Headers - Content-Security-Policy (CSP)

### Answer

- purpose: XSS Damage & Data Theft & Code Injection
- Dictates trusted domains for scripts, styles, images, and API targets (connect-src 'self').
- most important values:
  - default-src 'self' as a safe baseline fallback.
  - script-src 'self' to restrict which JavaScript execution sources are trusted.
  - connect-src 'self' to enforce our BFF boundary — ensuring browser fetch calls can only talk to our Next.js backend and cannot secretly exfiltrate tokens to an attacker's server.

---

### Question 97185602-4440-4a6a-8211-5f5aa9264eca

- rank the imp;ortance of security headers

### Answer

1. Content-Security-Policy (CSP)
2. Strict-Transport-Security (HSTS)
3. X-Content-Type-Options
4. X-Frame-Options
5. Referrer-Policy
6. Permissions-Policy

---

### Question 35acbfe5-f6c3-4d8a-84fb-985258509a07

- Does Next.js has built-in CSRF protection?

### Answer

- Yes, but only for Server Actions. Next.js automatically generates a CSRF token and validates it for each Server Action request.
- For other endpoints (API routes, route handlers), you need to implement your own CSRF protection.

---

### Question cc2c0056-367a-45fa-a5f2-2f6e82ee2a6f

- How CSRF works?

### Answer

- 🔑 The Golden Rule of Browsers: Whenever a browser sends a request to bank.com, it automatically attaches your bank.com login cookies — even if the request was triggered by another website!

```
[ Your Browser ]
├── Tab 1: Logged into bank.com (has active session cookie)
│
└── Tab 2: Opens evil-website.com
      │
      ▼ (Hidden JS automatically submits POST to bank.com)
      │
      └───► POST https://bank.com/api/transfer
            └─► Browser automatically attaches your bank.com cookie!
                  │
                  ▼
         [ bank.com Server ]
         "Valid cookie attached! Executing transfer..." ➔ 💰 Money lost!
```

- How to stop:
  - check origin header: When evil-website.com sends the request, the browser includes a header saying Origin: https://evil-website.com. The bank server looks at it and says: "Wait, this didn't come from bank.com! REJECT!"
  - Double-Submit Token (CSRF token in cookie + hidden form field)
  - SameSite cookies: Set your session cookie with SameSite=Lax or SameSite=Strict to prevent it from being sent on cross-origin requests.

---

### Question a2448947-393e-42b4-a627-a602cb4c0e8f

### Answer

---
