import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const siteName = 'FOODIE';
const siteOrigin = 'https://foodie-liart-one.vercel.app';
const pages: Record<string, { title: string; description: string; index: boolean }> = {
  '/': { title: 'Share more. Waste less.', description: 'Discover and share surplus food in your neighbourhood. Connect with neighbours, community kitchens and local businesses to give good food another chance.', index: true },
  '/explore': { title: 'Explore surplus food near you', description: 'Find available surplus food shared by neighbours, community kitchens and local businesses. Check collection details and request what you can use.', index: true },
  '/donate': { title: 'Share surplus food with your community', description: 'Create a food listing, add a real photograph and collection details, and help neighbours find food that can be shared safely.', index: true },
  '/how': { title: 'How community food sharing works', description: 'Discover how FOODIE helps people find, request and collect surplus food from their local community.', index: true },
  '/signin': { title: 'Sign in', description: 'Sign in to your FOODIE community account.', index: false },
  '/signup': { title: 'Create an account', description: 'Join FOODIE and help good food find another home.', index: false },
  '/saved': { title: 'Saved food', description: 'Your saved community food listings.', index: false },
  '/requests': { title: 'My food requests', description: 'Track your community food requests.', index: false },
  '/donations': { title: 'My donations', description: 'Manage your shared food listings and incoming requests.', index: false },
  '/account': { title: 'Your account', description: 'Manage your FOODIE profile and preferences.', index: false }
};

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function SeoManager() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '') || '/';
    const page = pages[path] || (path.startsWith('/food/')
      ? { title: 'Community food listing', description: 'View food details, availability and collection information shared by the FOODIE community.', index: true }
      : { title: 'Page not found', description: 'The page you are looking for could not be found.', index: false });
    const title = `${page.title} | ${siteName}`;
    const canonical = `${siteOrigin}${path}`;
    const isPreviewHost = window.location.hostname !== new URL(siteOrigin).hostname;
    document.title = title;
    document.documentElement.lang = localStorage.getItem('foodie-language') || 'en';
    setMeta('name', 'description', page.description);
    const crawlPolicy = page.index && !isPreviewHost ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
    setMeta('name', 'robots', crawlPolicy);
    setMeta('name', 'googlebot', crawlPolicy);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', siteName);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', page.description);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
  }, [location.pathname]);
  return null;
}
