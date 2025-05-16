const path = require('path')
 
module.exports = {
  sassOptions: {
    includePaths: [path?.join(__dirname, 'styles')],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ]
  }
}
