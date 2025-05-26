// schemas/device.js
export default {
    name: 'device',
    title: 'Device',
    type: 'document',
    fields: [
      {
        name: 'name',
        title: 'Device Name',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'name',
          maxLength: 96,
        },
        validation: Rule => Rule.required()
      },
      {
        name: 'tagline',
        title: 'Tagline',
        type: 'string',
        description: 'Short catchy description for hero section'
      },
      {
        name: 'mainImage',
        title: 'Main Image',
        type: 'image',
        options: {
          hotspot: true,
        },
      },
      {
        name: 'gallery',
        title: 'Image Gallery',
        type: 'array',
        of: [
          {
            type: 'image',
            options: {
              hotspot: true,
            },
          },
        ],
        description: 'Multiple images for the product showcase'
      },
      {
        name: 'videos',
        title: 'Product Videos',
        type: 'array',
        of: [
          {
            type: 'object',
            fields: [
              {
                name: 'title',
                title: 'Video Title',
                type: 'string',
              },
              {
                name: 'thumbnail',
                title: 'Video Thumbnail',
                type: 'image',
                options: {
                  hotspot: true,
                },
              },
              {
                name: 'videoUrl',
                title: 'Video URL',
                type: 'url',
                description: 'YouTube, Vimeo, or direct video URL'
              },
              {
                name: 'videoFile',
                title: 'Video File',
                type: 'file',
                options: {
                  accept: 'video/*'
                },
                description: 'Alternative to video URL - upload video file directly'
              }
            ]
          }
        ]
      },
      {
        name: 'features',
        title: 'Device Features',
        type: 'array',
        of: [
          {
            type: 'object',
            fields: [
              {
                name: 'icon',
                title: 'Feature Icon',
                type: 'string',
                description: 'Emoji or icon code (e.g., 🔋, 💨, 🎨)'
              },
              {
                name: 'title',
                title: 'Feature Title',
                type: 'string',
              },
              {
                name: 'description',
                title: 'Feature Description',
                type: 'text',
              },
            ]
          }
        ]
      },
      {
        name: 'specifications',
        title: 'Technical Specifications',
        type: 'array',
        of: [
          {
            type: 'object',
            fields: [
              {
                name: 'label',
                title: 'Specification Label',
                type: 'string',
                description: 'e.g., Battery Capacity, Pod Capacity, etc.'
              },
              {
                name: 'value',
                title: 'Specification Value',
                type: 'string',
                description: 'e.g., 1000mAh, 2ml, etc.'
              },
            ]
          }
        ]
      },
      {
        name: 'colors',
        title: 'Available Colors',
        type: 'array',
        of: [
          {
            type: 'object',
            fields: [
              {
                name: 'name',
                title: 'Color Name',
                type: 'string',
              },
              {
                name: 'color',
                title: 'Color Code',
                type: 'string',
                description: 'Hex color code (e.g., #000000, #FF5733)',
                validation: Rule => Rule.regex(/^#[0-9A-F]{6}$/i, {
                  name: 'hex color',
                  invert: false
                }).error('Must be a valid hex color code like #000000')
              },
              {
                name: 'image',
                title: 'Color Image',
                type: 'image',
                options: {
                  hotspot: true,
                },
                description: 'Product image in this color'
              },
            ]
          }
        ]
      },
      {
        name: 'price',
        title: 'Current Price',
        type: 'number',
        validation: Rule => Rule.required().min(0)
      },
      {
        name: 'originalPrice',
        title: 'Original Price',
        type: 'number',
        description: 'If device is on sale, show crossed out price'
      },
      {
        name: 'rating',
        title: 'Average Rating',
        type: 'number',
        validation: Rule => Rule.min(0).max(5),
        initialValue: 4.5,
        description: 'This will be auto-calculated from reviews, but can be manually set'
      },
      {
        name: 'reviews',
        title: 'Customer Reviews',
        type: 'array',
        of: [
          {
            type: 'object',
            title: 'Review',
            fields: [
              {
                name: 'customerName',
                title: 'Customer Name',
                type: 'string',
                validation: Rule => Rule.required(),
                description: 'Customer name or initials (e.g., "John D.", "Sarah M.")'
              },
              {
                name: 'rating',
                title: 'Rating',
                type: 'number',
                validation: Rule => Rule.required().min(1).max(5),
                description: 'Rating from 1 to 5 stars'
              },
              {
                name: 'title',
                title: 'Review Title',
                type: 'string',
                description: 'Optional title for the review'
              },
              {
                name: 'comment',
                title: 'Review Comment',
                type: 'text',
                validation: Rule => Rule.required(),
                description: 'The customer review text'
              },
              {
                name: 'reviewDate',
                title: 'Review Date',
                type: 'datetime',
                validation: Rule => Rule.required(),
                initialValue: () => new Date().toISOString(),
                description: 'When the review was written'
              },
              {
                name: 'verified',
                title: 'Verified Purchase',
                type: 'boolean',
                initialValue: true,
                description: 'Whether this is a verified purchase'
              },
              {
                name: 'helpful',
                title: 'Helpful Count',
                type: 'number',
                initialValue: 0,
                description: 'Number of people who found this review helpful'
              },
              {
                name: 'reviewImages',
                title: 'Review Images',
                type: 'array',
                of: [
                  {
                    type: 'image',
                    options: {
                      hotspot: true,
                    }
                  }
                ],
                description: 'Optional images from the customer'
              },
              {
                name: 'pros',
                title: 'Pros',
                type: 'array',
                of: [{ type: 'string' }],
                description: 'What the customer liked'
              },
              {
                name: 'cons',
                title: 'Cons',
                type: 'array',
                of: [{ type: 'string' }],
                description: 'What the customer didn\'t like'
              },
              {
                name: 'wouldRecommend',
                title: 'Would Recommend',
                type: 'boolean',
                description: 'Whether the customer would recommend this product'
              }
            ],
            preview: {
              select: {
                title: 'customerName',
                subtitle: 'comment',
                rating: 'rating',
                date: 'reviewDate'
              },
              prepare({ title, subtitle, rating, date }) {
                const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                const reviewDate = new Date(date).toLocaleDateString();
                return {
                  title: `${title} - ${stars}`,
                  subtitle: `${reviewDate}: ${subtitle?.substring(0, 60)}${subtitle?.length > 60 ? '...' : ''}`
                };
              }
            }
          }
        ],
        description: 'Customer reviews for this device'
      },
      {
        name: 'totalReviews',
        title: 'Total Number of Reviews',
        type: 'number',
        validation: Rule => Rule.min(0),
        initialValue: 0,
        description: 'This will be auto-calculated from the reviews array, but can be manually overridden'
      },
      {
        name: 'inStock',
        title: 'In Stock',
        type: 'boolean',
        initialValue: true
      },
      {
        name: 'description',
        title: 'Short Description',
        type: 'text',
        description: 'Brief device description for hero section'
      },
      {
        name: 'detailedDescription',
        title: 'Detailed Description',
        type: 'text',
        description: 'Full device description'
      },
      {
        name: 'safetyInfo',
        title: 'Safety Information',
        type: 'text',
        description: 'Important safety warnings and information'
      },
      {
        name: 'whatsIncluded',
        title: "What's Included",
        type: 'array',
        of: [
          {
            type: 'string'
          }
        ],
        description: 'List items included in the box'
      },
      {
        name: 'compatibility',
        title: 'Compatibility Info',
        type: 'array',
        of: [
          {
            type: 'string'
          }
        ],
        description: 'What the device is compatible with'
      },
      {
        name: 'deviceType',
        title: 'Device Type',
        type: 'string',
        options: {
          list: [
            {title: 'Pod System', value: 'pod'},
            {title: 'Mod', value: 'mod'},
            {title: 'Disposable', value: 'disposable'},
            {title: 'Kit', value: 'kit'}
          ]
        },
        validation: Rule => Rule.required()
      },
      {
        name: 'brand',
        title: 'Brand',
        type: 'string'
      },
      {
        name: 'relatedProducts',
        title: 'Related Products',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [
              {type: 'product'}
            ]
          }
        ]
      },
      {
        name: 'seo',
        title: 'SEO Settings',
        type: 'object',
        fields: [
          {
            name: 'metaTitle',
            title: 'Meta Title',
            type: 'string',
          },
          {
            name: 'metaDescription',
            title: 'Meta Description',
            type: 'text',
          },
          {
            name: 'keywords',
            title: 'Keywords',
            type: 'array',
            of: [{ type: 'string' }],
          },
        ]
      }
    ],
    preview: {
      select: {
        title: 'name',
        media: 'mainImage',
        subtitle: 'price',
        deviceType: 'deviceType',
        reviewCount: 'totalReviews',
        rating: 'rating'
      },
      prepare({ title, media, subtitle, deviceType, reviewCount, rating }) {
        const stars = rating ? `${rating}★` : 'No rating';
        const reviews = reviewCount ? `${reviewCount} reviews` : 'No reviews';
        return {
          title,
          media,
          subtitle: `${deviceType ? deviceType.toUpperCase() : ''} - $${subtitle || 'No price'} | ${stars} (${reviews})`
        }
      }
    }
  }