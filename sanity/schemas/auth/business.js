export const business = {
    name: "business",
    title: "Auth - Business",
    type: "document",
    fields: [
      {
        name: "name",
        title: "Name",
        type: "string",
      },
      {
        name: "email",
        title: "Email",
        type: "string",
      },
      {
        name: "password",
        title: "Password",
        type: "string",
      },
      {
        name: "approved",
        title: "Approved",
        type: "boolean",
        defaultValue: false,
      },
      {
        name: "discountsAvailable",
        title: "Discounts Available",
        type: "array",
        // initialValue: [{
        //   _ref: "1de00e92-4f59-44ca-be10-c7b3bc3dea2e"
        // }],
        // of: [{ type: "reference", to: [{ type: "discount" }] }],
        of: [
          {
            type: "object",
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
                name: "percentage",
                title: "Discount Percentage",
                description:
                  "enter any 1 from amount & percentage. Leave blank if not applicable",
                type: "number",
              },
            ],
          },
        ],
        // initialValue: [
        //   {
        //     name: "First Order Discount",
        //     code: "",
        //     percentage: 10,
        //   },
        // ],
      },
      {
        name: 'createdAt',
        title: 'Created At',
        type: 'datetime',
        readOnly: true,
      }
    ],
  };
  