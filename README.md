# KW Spa Website Demo

This is a portfolio-ready local website concept for KW Spa in Jersey City. It includes a public website, editable services/prices, booking request capture, contact lead capture, generated spa visuals, and a simple admin dashboard.

It also includes Luna, a playful demo spa concierge that can answer common questions, suggest a service, and save callback requests into the same lead list used by the contact form.

## Run it

```bash
npm install
npm start
```

Open:

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin.html

The default admin token is:

```text
demo-admin
```

For a live version, set a better token:

```bash
ADMIN_TOKEN="your-secret-token" npm start
```

## What is real vs demo

Public details used in the demo:

- KW Spa
- 206 Washington Street, Jersey City, NJ
- (201) 322-5888
- Open daily, 10:00 AM - 10:00 PM
- Services include back massage, deep tissue massage, reflexology, and foot massage

Items to confirm before publishing:

- Exact prices
- Current booking provider URL
- Owner approval
- Real photos, logo, policies, and promotions
- Whether payments should use Square, Stripe, Fresha, Acuity, or another system

## How the backend works

The local backend stores editable content and form submissions in the `data` folder:

- `data/site.json`: business details, services, reviews, FAQ, promos
- `data/leads.json`: contact form submissions
- `data/bookings.json`: booking requests

This is perfect for a portfolio demo and early client pitch. For a real business launch, connect these forms and Luna to email, SMS, Google Sheets, Airtable, a production database, or a real AI provider.

## Suggested live setup

1. Buy or connect the domain.
2. Confirm all business details with KW Spa.
3. Replace demo visuals with approved owner photos or licensed visuals.
4. Connect booking to their real booking provider.
5. Connect contact form to the owner's email and phone notifications.
6. Host on Render, Railway, Vercel, or a small VPS.
7. Add Google Business Profile links, analytics, and search indexing.
