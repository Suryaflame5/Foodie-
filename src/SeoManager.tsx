import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const siteName = 'EverkindHub';
const siteOrigin = 'https://everkindhub.netlify.app';
const socialImage = `${siteOrigin}/everkind-social.svg`;
const pages: Record<string, { title: string; description: string; index: boolean }> = {
  '/': { title: 'Community food sharing', description: 'EverkindHub connects neighbours, community kitchens and local businesses to share surplus food. Find food nearby, offer extra meals and help good food reach people instead of going to waste.', index: true },
  '/explore': { title: 'Find surplus food near you', description: 'Explore surplus food shared by neighbours, community kitchens and local businesses. Discover available meals and groceries, check collection details and request what you can use.', index: true },
  '/donate': { title: 'Donate and share extra food', description: 'Have safe, good food left over? Share surplus meals, groceries or bakery items with people in your community through EverkindHub.', index: true },
  '/how': { title: 'How community food sharing works', description: 'Learn how to discover surplus food, request a listing and arrange collection with a local donor through EverkindHub.', index: true },
  '/signin': { title: 'Sign in', description: 'Sign in to your EverkindHub community account.', index: false },
  '/signup': { title: 'Join the food-sharing community', description: 'Create an EverkindHub account and help surplus food reach people in your community.', index: false },
  '/saved': { title: 'Your saved food listings', description: 'View food listings you have saved in EverkindHub.', index: false },
  '/requests': { title: 'Your food requests', description: 'Track your community food requests and collection updates.', index: false },
  '/donations': { title: 'Manage your shared food', description: 'Manage your surplus food listings and incoming requests.', index: false },
  '/account': { title: 'Your account', description: 'Manage your EverkindHub profile and preferences.', index: false }
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
      ? { title: 'Surplus food listing', description: 'View food details, availability and collection information shared by the EverkindHub community.', index: false }
      : { title: 'Page not found', description: 'The page you are looking for could not be found.', index: false });
    const title = `${page.title} | ${siteName}`;
    const canonical = `${siteOrigin}${path === '/' ? '/' : path}`;
    const isProductionHost = window.location.hostname === new URL(siteOrigin).hostname;
    const crawlPolicy = page.index && isProductionHost ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';

    document.title = title;
    document.documentElement.lang = localStorage.getItem('foodie-language') || 'en';
    setMeta('name', 'description', page.description);
    setMeta('name', 'robots', crawlPolicy);
    setMeta('name', 'googlebot', crawlPolicy);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:locale', 'en_IN');
    setMeta('property', 'og:site_name', siteName);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', page.description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', socialImage);
    setMeta('property', 'og:image:alt', 'EverkindHub — Community Food Sharing');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', page.description);
    setMeta('name', 'twitter:image', socialImage);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
  }, [location.pathname]);
  return null;
}
