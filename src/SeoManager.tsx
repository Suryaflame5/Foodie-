import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const siteName = 'Everkind';
const siteOrigin = 'https://everkindhub.netlify.app';
const socialImage = `${siteOrigin}/everkind-social.svg`;
const pages: Record<string, { title: string; description: string; index: boolean }> = {
  '/': { title: 'Share surplus food. Spread kindness.', description: 'Find and share surplus food nearby. Everkind connects neighbours, community kitchens and local businesses so good food reaches people instead of going to waste.', index: true },
  '/explore': { title: 'Explore surplus food near you', description: 'Discover available surplus food shared by neighbours, community kitchens and local businesses. Check collection details and request what you can use.', index: true },
  '/donate': { title: 'Share surplus food with your community', description: 'List extra food, add collection details and help neighbours find food that can be shared safely.', index: true },
  '/how': { title: 'How community food sharing works', description: 'See how Everkind helps people discover, request and collect surplus food from their local community.', index: true },
  '/signin': { title: 'Sign in', description: 'Sign in to your Everkind community account.', index: false },
  '/signup': { title: 'Join the Everkind community', description: 'Create an account and help good food find another home.', index: false },
  '/saved': { title: 'Your saved food', description: 'View the community food listings you have saved.', index: false },
  '/requests': { title: 'Your food requests', description: 'Track your community food requests and collection updates.', index: false },
  '/donations': { title: 'Your shared food listings', description: 'Manage your shared food listings and incoming requests.', index: false },
  '/account': { title: 'Your Everkind account', description: 'Manage your Everkind profile and preferences.', index: false }
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
      ? { title: 'Community food listing', description: 'View food details, availability and collection information shared by the Everkind community.', index: false }
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
    setMeta('property', 'og:image:alt', 'Everkind — Good food. Good people. Good things ahead.');
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
