// Firebase web app settings for cloud sync (Firebase console → Project settings → Your apps → Config).
// These values only identify the project and are meant to be public; access is controlled by Firebase
// Authentication and the rules in firestore.rules. Set this to null to keep the app local-only.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCg-S2QyL9gIWXjl2ljlIk1S-GVYGV2Qys',
  authDomain: 'sat-prep-website-118b8.firebaseapp.com',
  projectId: 'sat-prep-website-118b8',
  storageBucket: 'sat-prep-website-118b8.firebasestorage.app',
  messagingSenderId: '1072588919531',
  appId: '1:1072588919531:web:9ba02f3ca05bc0d008a4ae',
};

// App Check proves that a request really comes from this site, not from somebody who copied the config above.
// Firebase now enforces it for AI Logic, so without a key here Gemini answers nothing: the request is refused
// with "Firebase App Check token is invalid".
//
// To fill this in: Google Cloud console -> Security -> reCAPTCHA, enable the reCAPTCHA Enterprise API, create
// a *Website* key with "Use checkbox challenge" left UNCHECKED (App Check needs a score-based key), and list
// the domain just-rice.github.io. Paste the key below. Like the config above it is not a secret.
//
// Set to null to leave App Check unregistered, in which case the app says so plainly rather than failing
// with a network error.
export const RECAPTCHA_SITE_KEY = '6Leb1cQtAAAAANgYPyrZPKf18MYlbdnShKt68nk1';
