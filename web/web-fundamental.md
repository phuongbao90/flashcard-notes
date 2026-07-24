# Web fundamental

### Question d6cab4d1-ba51-4487-973c-c13168863148
- explaim credential option in fetch api
### Answer
- controls whether browsers automatically send and store user credentials (such as HTTP cookies including HttpOnly cookies, HTTP Basic Auth headers, and TLS client certificates) when making HTTP requests
- variants:
    - "include":
        - behavior: Tells the browser to always attach cookies (including HttpOnly cookies) and authentication headers to requests, whether the request is same-origin or cross-origin.
        - when to use: When your frontend web app (e.g. http://localhost:3000) communicates with a backend API on a different domain or port (e.g., http://localhost:4000), and authentication is managed via cookies
        - CORS Security Requirements: For cross-origin requests with credentials: "include", the backend server must respond with:        
            1. Access-Control-Allow-Credentials: true                        
            2. Access-Control-Allow-Origin: http://localhost:3000 (must specify the exact origin, cannot be wildcard *).
    - same-origin: (default)
        - Behavior: The browser sends cookies and credential headers only if the request origin matches the page origin (same protocol, domain, and port).                                                           
        - Cross-origin behavior: If the request goes to a different domain or port, the browser strips all cookies and ignores any Set-Cookie headers returned by the server.                                      
        - When to use: Standard same-domain Next.js apps or monolithic setups where API routes share the exact same origin as the frontend.
    - omit: 
        - Behavior: Instructs the browser to never attach cookies or authentication headers to the request, even if the request is same-origin. Any Set-Cookie headers in the server's response will be ignored and discarded by the browser.                                
        - When to use:                                                       
            - Fetching public static assets (images, public JSON, CDN files).
            - Preventing user session cookies from leaking or cluttering requests where cookies are unnecessary.                          
            - Improving cacheability on CDNs (since requests without Cookie headers are easier to cache).
---

### Question a86c53bf-4bf0-4a01-a482-354990f6f574
- pure cookie vs hybrid cookie pattern
### Answer


- Bottom Line:
    - If your frontend and backend share the exact same domain (e.g. Next.js / monolith), using Pure HttpOnly Cookies for everything is great and very easy!
    - If your frontend and backend are on different domains/ports or you have a mobile app, the Hybrid Pattern is safer and much less headache with browser cookie restrictions.
---
### Question b5e973bc-93fc-4640-a50e-a81f59deb1b2
- what are problems of pure cookie patterns?
### Answer
- Reason 1: Protection Against CSRF (Cross-Site Request Forgery) Attacks
    - If Access Token is in a Cookie (credentials: "include" on every request): Because the browser automatically attaches cookies to every request, a malicious website (e.g. evil-website.com) can trick a logged-in user into making a hidden request to your backend:
        ```javascript
        <!-- On evil-website.com -->
        <form action="http://your-bank.com/api/transfer" method="POST">
            <input type="hidden" name="amount" value="1000" />
        </form>
        <script>document.forms[0].submit();</script>
        ```
- Reason 2: Third-Party Cookie Blocking in Modern Browsers
    - If your frontend is hosted at https://myapp.com
    - And your backend API is at https://api.myapp-backend.com
- Reason 3: Support for Mobile Apps & Microservices


---
### Question 7a6dcb21-940c-4e45-84a0-647374f03878
- when using pure cookie pattern, how to protect from csrf?
### Answer
1. Use the SameSite Cookie Attribute (Most Important)
    When setting your HttpOnly cookie on the backend, set SameSite=Lax or SameSite=Strict:
2. Restrict APIs to Content-Type: application/json
Standard HTML forms (form) can only send application/x-www-form-urlencoded, multipart/form-data, or text/plain. They cannot send application/json.
---
### Question 45a9dffe-c276-43c2-9671-93adfcf6dbc7
- explain httpOnly
### Answer
- HttpOnly is a security flag added to an HTTP response header when setting a cookie (Set-Cookie: cookie_name=value; HttpOnly).
- key points:
    - Blocks Client-Side Access: Prevents client-side JavaScript (e.g., document.cookie) from reading or modifying the cookie.
    - Mitigates XSS Attacks: If a malicious script is injected into your website (Cross-Site Scripting), the attacker cannot steal session identifiers or JWTs stored in HttpOnly cookies.
    - Automatic Transmission: The browser automatically attaches HttpOnly cookies to subsequent HTTP requests sent to the server.

- What HttpOnly Does NOT Do
    - Does not prevent CSRF: The browser will still send HttpOnly cookies automatically on cross-site requests (use SameSite attribute and anti-CSRF tokens for CSRF protection).
    - Does not encrypt data: It does not protect against network interception (use the Secure flag to mandate HTTPS).


---
### Question 619e5bcf-3a62-474c-a3c6-0f0c3f7239fc
- given the backend strictly require Authorization: Bearer token + backend return cookie including jwt + refresh_token
    - how do you handle it in nextjs project
### Answer
- For client side:
    - API Gateway Proxy Pattern (use Next.js Route Handler as a Proxy:)
        - Step 1: Create a Route Handler (app/api/proxy/route.ts) or catch all route: app/api/proxy/[...path]/route.ts
        - Step 2: Call /api/proxy from your Client Component
- For server side
    - simple, use cookies() from 'next/headers'

---
### Question 7a94bb92-c1b2-4dc1-98e1-069ea2c508b9

### Answer

---
### Question 36ec264a-e143-43b2-98e3-a1d216ebea9f

### Answer

---
### Question ed65b32a-95a5-44cf-b5c6-cb41a84ffffd

### Answer

---
### Question e962a731-8240-4fc8-a27e-b100b8fb4146

### Answer

---
### Question 90b55d22-e940-4acf-9bb9-7393353c06f6

### Answer

---
### Question 029142e1-74c4-44fe-9233-626b7dd11066

### Answer

---
### Question 3ddc5fc8-cea1-437e-b5a2-74259443b4b2

### Answer

---
### Question 6ae786c4-f3d1-401a-b564-af17f370f1b8

### Answer

---
### Question cf365dbf-2458-4bab-9464-87e5fbad7d4c

### Answer

---
### Question 4cac218d-b517-4b22-8b63-35104dfa2a96

### Answer

---
### Question fc125c60-94a8-441e-a909-b3ab3768e999

### Answer

---
### Question 24a3b318-847b-4021-9dcb-ab5fa811dc53

### Answer

---
### Question b589e3ec-3ae2-421d-b7ca-0295feffbd49

### Answer

---