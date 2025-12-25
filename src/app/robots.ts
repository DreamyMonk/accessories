import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://fitmyphone.in';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/profile/', '/settings/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
