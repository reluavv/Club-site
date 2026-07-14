import { MetadataRoute } from 'next';
import { APP_METADATA } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/admin/',
        },
        sitemap: `${APP_METADATA.SITE_URL}/sitemap.xml`,
    };
}
