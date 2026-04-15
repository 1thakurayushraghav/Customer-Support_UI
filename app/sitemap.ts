import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://conversationalai-for-customer-support.netlify.app';
  
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/chat`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];
}