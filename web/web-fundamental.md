# Web fundamental

### Question
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

### Question
- pure cookie vs hybrid cookie pattern
### Answer


- Bottom Line:
    - If your frontend and backend share the exact same domain (e.g. Next.js / monolith), using Pure HttpOnly Cookies for everything is great and very easy!
    - If your frontend and backend are on different domains/ports or you have a mobile app, the Hybrid Pattern is safer and much less headache with browser cookie restrictions.
---
### Question
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
### Question
- when using pure cookie pattern, how to protect from csrf?
### Answer
1. Use the SameSite Cookie Attribute (Most Important)
    When setting your HttpOnly cookie on the backend, set SameSite=Lax or SameSite=Strict:
2. Restrict APIs to Content-Type: application/json
Standard HTML forms (form) can only send application/x-www-form-urlencoded, multipart/form-data, or text/plain. They cannot send application/json.
---
### Question
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
### Question
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
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---
### Question

### Answer

---