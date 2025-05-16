export const about = {
  name: "about",
  title: "Misc - About",
  type: "document",
  fields: [
    {
      name: "bannerImage",
      title: "Banner Image",
      type: "image",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "heading1",
      title: "Heading 1",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "description1",
      title: "Description 1",
      type: "blockContent",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "heading2",
      title: "Heading 2",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "description2",
      title: "Description 2",
      type: "blockContent",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "heading3",
      title: "Heading 3",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "subHeading3",
      title: "Sub-Heading 3",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "description3",
      title: "Description 3",
      type: "blockContent",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "subImage1",
      title: "Sub Image 1",
      type: "image",
    },
    {
      name: "subImage2",
      title: "Sub Image 2",
      type: "image",
    },
    {
      name: "benefitsHeading",
      title: "Benefits Heading",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "benefitsDescription",
      title: "Benefits Description",
      type: "blockContent",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "benefitsLogos",
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
      name: "ourTeam",
      title: "Our Team Cards",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "image",
              title: "Image",
              type: "image",
            },
            {
              name: "name",
              title: "Name",
              type: "string",
            },
            {
              name: "role",
              title: "Role",
              type: "string",
            },
            {
              name: "description",
              title: "Description",
              type: "string",
            },
            {
              name: "socialLinks",
              title: "Social Links",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    {
                      name: "icon",
                      title: "Icon",
                      type: "string",
                    },
                    {
                      name: "link",
                      title: "Link",
                      type: "string",
                    },
                  ],
                },
              ],
            },
          ],
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
