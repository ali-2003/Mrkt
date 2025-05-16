export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
            }
        ],
        sitemap: `https://mrkt.co.id/sitemap.xml`
    }
}