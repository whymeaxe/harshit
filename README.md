# Ferrum Precise — Master Wirecraft & Bespoke Metalwork

A static, multi-page marketing/e-commerce front-end for **Ferrum Precise**, a
premium wirecraft and bespoke metalwork studio. Originally designed in
[Stitch](https://stitch.withgoogle.com/) and converted here into a clean,
ready-to-host static site.

**Founder & CEO:** Harshit Mandowra

## ✨ Preview

| Page | Screenshot |
|---|---|
| Home | `assets/screenshots/home.png` |
| About | `assets/screenshots/about.png` |
| Bespoke Orders | `assets/screenshots/bespoke-orders.png` |
| Contact | `assets/screenshots/contact.png` |
| Checkout | `assets/screenshots/checkout.png` |

## 🔧 Interactivity

All pages are now fully wired up with real client-side functionality (see
`assets/js/site.js`):

- **Cart** — persistent (localStorage-backed) shopping cart with a slide-over
  drawer, quantity controls, and a live badge count on every page's cart icon.
- **Catalog (index.html)** — working Filter (by material) and Sort (price/name)
  controls, live search, tap-to-quick-view on any product card, working
  "Add to Cart" buttons, and a "View Entire Collection" toggle that reveals
  additional pieces.
- **Checkout** — the order summary renders your actual cart contents (not
  static placeholder items), calculates subtotal/shipping/tax/total live, and
  "Complete Order" validates the form, confirms the order, and clears the cart.
- **About / Bespoke Orders / Contact** — all CTAs (View Our Facility, Request
  Quote, View Full Archive, Book Session, etc.) now navigate, scroll, or reveal
  content instead of being dead links, and every footer link points to a real
  page (including new `privacy-policy.html`, `terms-of-service.html`, and
  `shipping-returns.html`).

## 📁 Project Structure

```
.
├── index.html              # Home / catalog landing page
├── about.html              # About Us / founder story
├── bespoke-orders.html     # Custom / bespoke order request page
├── contact.html            # Contact & inquiries page
├── checkout.html           # Secure checkout page (reads live cart data)
├── privacy-policy.html     # Privacy policy
├── terms-of-service.html   # Terms of service
├── shipping-returns.html   # Shipping & returns policy
└── assets/
    ├── js/
    │   └── site.js         # Shared cart, drawer, filter/sort, and modal logic
    └── screenshots/        # Design reference screenshots
```

## 🎨 Design System

- **Style:** Technical Minimalism — wireframe aesthetic, monochrome palette,
  1px hairline borders, generous whitespace.
- **Typography:** [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk)
  for headings/body, [Geist Mono](https://fonts.google.com/specimen/Geist+Mono)
  for technical/mono labels.
- **Framework:** [Tailwind CSS](https://tailwindcss.com/) (via CDN, configured
  inline per page) + [Material Symbols](https://fonts.google.com/icons).
- **Layout:** 12-column responsive grid, 4px spacing baseline, 1440px max
  content width.

All pages are self-contained static HTML files (no build step required) and
share a consistent navigation, footer, and Tailwind design-token
configuration.

## 🚀 Getting Started

No build tools or dependencies are required — this is a plain static site.

### Option 1: Open directly
Just open `index.html` in your browser.

### Option 2: Serve locally
```bash
# Using Python
python3 -m http.server 8000

# Using Node
npx serve .
```
Then visit `http://localhost:8000`.

### Option 3: Deploy with GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set the source branch to `main` and folder to `/ (root)`.
4. Your site will be published at `https://<username>.github.io/<repo-name>/`.

## 🧭 Site Navigation

| Route | Description |
|---|---|
| `index.html` | Catalog / home page with hero, featured pieces, and founder intro |
| `about.html` | Brand story and founder profile |
| `bespoke-orders.html` | Custom commission inquiry form |
| `contact.html` | Press, careers, and general contact details |
| `checkout.html` | Order summary and secure checkout flow |

## 📝 Notes

- Product and profile imagery is currently sourced from placeholder CDN
  URLs generated during the design phase — swap these for your own hosted
  assets before going to production.
- Footer links such as *Terms of Service*, *Privacy Policy*, and social
  icons are placeholders (`#`) and should be wired up to real pages/policies.

## 📄 License

Released under the [MIT License](LICENSE).
