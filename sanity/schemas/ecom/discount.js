export const discount = {
    name: "discount",
    title: "Ecom - Discount Codes",
    type: "document",
    fields: [
      {
        name: "name",
        title: "Discount Code Name",
        type: "string",
        validation: (Rule) => Rule.required(),
      },
      {
        name: "code",
        title: "Discount Code",
        description: "Any code of your choice (optional)",
        type: "string",
      },
      {
        name: "email",
        title: "Email",
        description: "Email ID of User (only applicable if it is an affiliate code)",
        type: "string",
      },
      {
        name: "type",
        title: "Code Type",
        type: 'string',
        options: {
          list: [
            { title: 'First Order', value: 'first' },
            { title: 'Refer Friend', value: 'refer' },
            { title: 'Affiliate', value: 'affiliate' },
          ],
        },
        defaultValue: 'first',
      },
      // {
      //   name: "amount",
      //   title: "Discount Amount",
      //   description:
      //     "enter any 1 from amount & percentage. Leave blank if not applicable",
      //   type: "number",
      // },
      {
        name: "percentage",
        title: "Discount Percentage",
        description:
          "enter any 1 from amount & percentage. Leave blank if not applicable",
        type: "number",
      },
      // {
      //   name: "products",
      //   title: "Products Included",
      //   type: "array",
      //   of: [
      //     {
      //       type: "reference",
      //       to: [{ type: "product" }],
      //     },
      //   ],
      // },
    ],
    preview: {
      select: {
        title: "name",
        perc: "percentage",
        // media: "mainImage",
      },
      prepare(selection) {
        const { perc } = selection;
        return { ...selection, subtitle: `${perc}%` };
      },
    },
  };