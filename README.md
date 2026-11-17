# FOODIE

**Good food deserves another chance.**

FOODIE is a community surplus-food discovery and sharing experience. It helps neighbours, community kitchens and local businesses make surplus edible food visible to people who may be able to collect it.

> This repository currently contains a frontend demo. Listings are illustrative sample data, and actions are stored in the current browser only. It is not a food-delivery marketplace, and it does not confirm reservations, contact donors, verify users or provide live availability.

## What is included

- Responsive home and food discovery experience
- Search and category filters
- Listing details, quantity selection and demo requests
- Saved listings, request history and donor listing management
- Surplus-food donation form with food-safety declaration
- Local demo profile
- Manual location selection and browser geolocation permission
- LocalStorage persistence
- Mobile bottom navigation and accessible labels
- Vercel SPA rewrite configuration

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Demo data and limitations

The initial listings are sample content for Chennai neighbourhoods. They are not verified offers and must not be treated as real food availability. User-created listings, saved items and requests are stored in browser LocalStorage and do not sync to another device. The current geolocation control reads browser coordinates but does not calculate road distance or proximity ranking.

No backend, authentication, donor messaging, reservation service, moderation, food-safety verification or live map provider is connected yet. Do not enter sensitive personal information into this demo.

## Deploy to Vercel

Import this repository into Vercel. The Vite defaults are:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

The included `vercel.json` routes client-side paths back to the app entry point.

## Tech

React · TypeScript · Vite · React Router · Tailwind CSS · Lucide
