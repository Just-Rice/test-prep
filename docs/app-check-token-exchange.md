# App Check token exchange returns 400 FAILED_PRECONDITION with every documented precondition satisfied

## Summary

`initializeAppCheck` with `ReCaptchaEnterpriseProvider` cannot obtain a token. The exchange endpoint returns
HTTP 400 `FAILED_PRECONDITION`, naming two possible causes. Both have been verified as satisfied. The failure
is byte-identical across two different reCAPTCHA Enterprise site keys, several fresh page loads, and separate
browser sessions.

Because App Check enforcement is active for Firebase AI Logic, this blocks every `generateContent` call.

## Environment

| | |
|---|---|
| Project ID | `sat-prep-website-118b8` |
| Web app ID | `1:1072588919531:web:9ba02f3ca05bc0d008a4ae` |
| Firebase JS SDK | 12.19.0 (loaded from `https://www.gstatic.com/firebasejs/12.19.0`) |
| Provider | `ReCaptchaEnterpriseProvider` |
| Site key | `6Ldu3sQtAAAAAMd6mK79epaNgwaZTeTEiwBI710t` |
| Serving origin | `https://just-rice.github.io` (GitHub Pages, HTTPS) |
| Pricing plan | Spark (no Cloud Billing account linked) |
| Browser | Chrome, desktop |

## The error

Captured by wrapping `window.fetch` before calling `getToken(appCheck, true)`:

```
POST https://content-firebaseappcheck.googleapis.com/v1/projects/sat-prep-website-118b8
     /apps/1:1072588919531:web:9ba02f3ca05bc0d008a4ae:exchangeRecaptchaEnterpriseToken
-> 400

{
  "error": {
    "code": 400,
    "message": "Unable to call the reCAPTCHA Enterprise CreateAssessment method; ensure that the
                reCAPTCHA Enterprise API is enabled and that the site key is from the same project
                as the one containing this app.",
    "status": "FAILED_PRECONDITION"
  }
}
```

The SDK surfaces this as `appCheck/initial-throttle`, which hides the underlying response.

## Both named preconditions verified satisfied

**1. "ensure that the reCAPTCHA Enterprise API is enabled"**

Google Cloud console, API library for `recaptchaenterprise.googleapis.com` with
`?project=sat-prep-website-118b8`, reads **"API Enabled"**.

**2. "ensure that the site key is from the same project as the one containing this app"**

The key is listed in the reCAPTCHA keys page for that same project:

```
Fraud Defense -> Keys -> "SAT prep"
  ID:     6Ldu3sQtAAAAAMd6mK79epaNgwaZTeTEiwBI710t
  Domain: just-rice.github.io
  Status: Incomplete
```

## Additional evidence

**The site key itself works.** Loading `https://www.google.com/recaptcha/enterprise.js?render=<key>` on
`https://just-rice.github.io` and calling `grecaptcha.enterprise.execute(key, { action: 'probe' })` returns a
valid token of 2,425 characters. So the key is score-based, active, and correctly scoped to the domain.
The failure is specifically in Firebase's server-side assessment call, not in obtaining the reCAPTCHA token.

**Assessment count is zero.** The Fraud Defense dashboard reports 0 assessments for the current month, and
the key's status panel states: *"Your key is requesting tokens (executes), but isn't requesting scores
(assessments)."* This is consistent with `CreateAssessment` never being reached.

**A second key behaves identically.** An earlier key (`6Leb1cQt...`) produced the same 400. That key was
additionally invalid for the domain; the current key is not, and the error did not change.

**The app is registered.** Firebase console -> App Check -> Apps shows the web app registered with the
reCAPTCHA Enterprise provider and this site key, TTL 1 hour, app risk 0.5.

## Reproduction

1. Spark-plan project, reCAPTCHA Enterprise API enabled, score-based Website key scoped to the serving domain.
2. Register the web app in App Check with that key; enable enforcement for Firebase AI Logic.
3. From the serving origin:

```js
const app = initializeApp(firebaseConfig);
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(SITE_KEY),
  isTokenAutoRefreshEnabled: false,
});
await getToken(appCheck, true);   // 400 FAILED_PRECONDITION
```

## Not a duplicate of firebase-js-sdk#10385

That issue reports a superficially similar `ReCaptchaEnterpriseProvider` failure, but the failure point is
different and the distinction matters:

| | #10385 | This report |
|---|---|---|
| Where it fails | `POST https://www.google.com/recaptcha/enterprise/clr` -> 400 | Firebase `exchangeRecaptchaEnterpriseToken` -> 400 |
| Firebase backend reached | No, never contacted | Yes |
| reCAPTCHA token obtained | No | Yes, 2,425 characters |
| SDK error surfaced | `appCheck/recaptcha-error` | `appCheck/initial-throttle` masking `FAILED_PRECONDITION` |

In other words, #10385 fails while acquiring the reCAPTCHA token. Here the token is acquired successfully and
the failure is in Firebase's server-side assessment of it.

## Question

Per the reCAPTCHA billing documentation, a Cloud Billing account is not required to call `CreateAssessment`;
projects without billing operate on the Essentials tier until 10,000 assessments per organisation per month,
and this project has used 0.

Is a linked Cloud Billing account nevertheless required for the App Check
`exchangeRecaptchaEnterpriseToken` path? If not, what third precondition is failing that the error message
does not name?

## Where this stands, 22 September 2026

**Still unresolved.** Two ways round it were tried and neither is open:

- **Classic reCAPTCHA v3.** Firebase checks a v3 key by a different route, so it should have side-stepped the
  Enterprise exchange. A v3 key was registered for `just-rice.github.io` and `localhost`, but App Check will no
  longer accept one: under App Check → Apps → this web app → reCAPTCHA, the secret key field is disabled and
  the panel says "reCAPTCHA is deprecated, please use reCAPTCHA Enterprise instead". The key is unused.
- **Not enforcing App Check for AI Logic.** Done, in App Check → APIs → Firebase AI Logic → Set up →
  Unenforced. Gemini now answers. The console warns that **from 2 November 2026 App Check enforcement will be
  required for Firebase AI Logic and cannot be turned off**, so this buys about six weeks.

The app still sends an App Check token with every request, using the Enterprise key registered for it, so the
App Check page will show verified requests the moment the exchange starts working.

If it is not fixed by mid-October, the app should stop calling Firebase AI Logic from the browser and call
Gemini through a small relay of its own instead, which App Check does not govern.
