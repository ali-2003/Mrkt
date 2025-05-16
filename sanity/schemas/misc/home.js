export const home = {
  name: "home",
  title: "Misc - Home Page",
  type: "document",
  fields: [
    {
      name: "hero",
      title: "Hero Slider Content",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "photo",
              title: "Photo",
              type: "image",
            },
            {
              name: "tagline",
              title: "Tagline",
              type: "string",
            },
            {
              name: "heading",
              title: "Heading",
              type: "string",
            },
            {
              name: "subtext",
              title: "Subtext",
              type: "string",
            },
          ],
        },
      ],
    },
    {
      name: "benefits",
      title: "Benefits Logos",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "logo",
              title: "Logo",
              type: "image",
            },
          ],
        },
      ],
    },
    {
      name: "benefitImage1",
      title: "Benefit Section - Image 1",
      type: "image",
    },
    {
      name: "benefitText1",
      title: "Benefit Section - Heading 1",
      type: "string",
    },
    {
      name: "benefitSubText1",
      title: "Benefit Section - Subtext 1",
      type: "string",
    },
    {
      name: "benefitImage2",
      title: "Benefit Section - Image 2",
      type: "image",
    },
    {
      name: "benefitText2",
      title: "Benefit Section - Heading 2",
      type: "string",
    },
    {
      name: "blogSectionHeading",
      title: "Blog Section - Heading",
      type: "string",
    },
    {
      name: "blogSectionSubText",
      title: "Blog Section - Subtext",
      type: "string",
    },
    {
      name: "blogs",
      title: "Related Blogs",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "post" }],
        },
      ],
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
              name: "heading",
              title: "Heading",
              type: "string",
            },
            {
              name: "text",
              title: "Review Text",
              type: "string",
            },
            {
              name: "reviewerName",
              title: "Name of Reviewer",
              type: "string",
            },
            {
              name: "country",
              title: "City, Country",
              type: "string",
            },
            {
              name: "stars",
              title: "Number Stars",
              type: "number",
            },
          ],
        },
      ],
    },
  ],
};
