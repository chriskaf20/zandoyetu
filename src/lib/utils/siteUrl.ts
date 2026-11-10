/**
 * URL publique du site (déploiement Vercel de production).
 * Définir NEXT_PUBLIC_SITE_URL pour passer à un domaine personnalisé.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://zandoyetu.vercel.app').replace(/\/+$/, '');
