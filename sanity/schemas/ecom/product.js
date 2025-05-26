export const product = {
  name: "product",
  title: "Ecom - Product",
  type: "document",
  fields: [
    {
      name: "id",
      title: "ID",
      type: "number",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "skuId",
      title: "Paykings SKU ID",
      type: "string",
      // validation: (Rule) => Rule.required(),
    },
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    // ADD NEW PRODUCT TYPE FIELD HERE
    {
      name: "productType",
      title: "Product Type",
      type: "string",
      options: {
        list: [
          { title: "Bottle", value: "bottle" },
          { title: "Pod", value: "pod" },
          { title: "Accessory", value: "accessory" }
        ],
        layout: 'radio'
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "short_desc",
      title: "Short Description",
      type: "string",
    },
    {
      name: "price",
      title: "Price",
      type: "number",
      // validation: (Rule) => Rule.required(),
    },
    {
      name: "sale_price",
      title: "Sale Price",
      description: "Only if there's a sale on this product",
      type: "number",
    },
    {
      name: "business_price",
      title: "Business Price",
      description: "Price for business accounts",
      type: "number",
    },
    {
      name: "ratings",
      title: "Ratings",
      description: "Average review score 1-5",
      type: "number",
      validation: (Rule) => Rule.min(1).max(5),
    },
    {
      name: "until",
      title: "Until",
      type: "datetime",
      options: {
        dateFormat: "YYYY-MM-DD",
        timeFormat: "HH:mm",
        calendarTodayLabel: "Today",
      },
    },
    {
      name: "stock",
      title: "Stock",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    },
    {
      name: "hot",
      title: "Hot",
      type: "boolean",
    },
    {
      name: "featured",
      title: "Featured",
      type: "boolean",
    },
    {
      name: "showInTrendy",
      title: "Show In Best Seller?",
      type: "boolean",
    },
    {
      name: "pictures",
      title: "Pictures",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule) =>
        Rule.min(1).error("At least one picture must be added"),
      hidden: ({ document }) => document?.productType === 'pod', // Hide for pods since they use color-specific images
    },
    // NEW: Pod Colors Configuration
    {
      name: "podColors",
      title: "Pod Colors",
      type: "array",
      of: [
        {
          type: "object",
          title: "Color Variant",
          fields: [
            {
              name: "colorName",
              title: "Color Name",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "colorCode",
              title: "Color Code",
              type: "string",
              description: "Hex color code (e.g., #FF5733)",
              validation: (Rule) => Rule.required().regex(/^#[0-9A-Fa-f]{6}$/, {
                name: "hex color",
                invert: false
              }),
            },
            {
              name: "stock",
              title: "Stock for this color",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: "pictures",
              title: "Pictures for this color",
              type: "array",
              of: [{ type: "image" }],
              validation: (Rule) =>
                Rule.min(1).error("At least one picture must be added for each color"),
            },
            {
              name: "isAvailable",
              title: "Is Available",
              type: "boolean",
              initialValue: true,
            },
          ],
          preview: {
            select: {
              title: "colorName",
              subtitle: "stock",
              media: "pictures.0",
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || "Unnamed Color",
                subtitle: `Stock: ${subtitle || 0}`,
                media: media,
              };
            },
          },
        },
      ],
      hidden: ({ document }) => document?.productType !== 'pod', // Only show for pod products
      validation: (Rule) => 
        Rule.custom((podColors, context) => {
          if (context.document?.productType === 'pod') {
            if (!podColors || podColors.length === 0) {
              return 'Pod products must have at least one color variant';
            }
          }
          return true;
        }),
    },
    {
      name: "description",
      title: "Description",
      type: "blockContent",
    },
    {
      name: "additionalInfo",
      title: "Additional Info",
      type: "blockContent",
    },
    {
      name: "shippingDetails",
      title: "Shipping Details",
      type: "blockContent",
    },
    {
      name: "reviews",
      title: "Reviews",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "name",
              title: "Name",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "description",
              title: "Description",
              type: "text",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "stars",
              title: "Stars",
              type: "number",
              validation: (Rule) => Rule.min(1).max(5),
            },
            {
              name: "reviewImages",
              title: "Review Images",
              type: "array",
              of: [{ type: "image" }],
              description: "Optional images for this review",
            },
            {
              name: "createdAt",
              title: "Created At",
              type: "datetime",
              options: {
                dateFormat: "YYYY-MM-DD",
                timeFormat: "HH:mm",
                calendarTodayLabel: "Today",
              },
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    },
    {
      name: "relatedProducts",
      title: "Related Products",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "productType",
      media: "pictures.0.img",
      podColors: "podColors",
    },
    prepare({ title, subtitle, media, podColors }) {
      // For pod products, use the first color's first image as preview
      const previewMedia = subtitle === 'pod' && podColors?.[0]?.pictures?.[0] 
        ? podColors[0].pictures[0] 
        : media;
      
      return {
        title: title || "Unnamed Product",
        subtitle: subtitle || "Unknown Type",
        media: previewMedia,
      };
    },
  },
};