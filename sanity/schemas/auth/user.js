export const user = {
  name: "user",
  title: "Auth - User",
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
      name: "authType",
      title: "Account Type",
      type: "string",
      defaultValue: "google",
    },
    {
      name: "whatsapp",
      title: "Whatsapp Number",
      type: "string",
    },
    {
      name: "image",
      title: "Image",
      type: "string"
    },
    {
      name: "balance",
      title: "Balance",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "approved",
      title: "Approved",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "accountType",
      title: "Account Type",
      type: 'string',
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Business', value: 'business' },
        ],
      },
      initialValue: "user"
    },
    {
      name: "businessType",
      title: "Business Type",
      type: 'string',
      description: 'If account is business',
      options: {
        list: [
          { title: 'Online', value: 'online' },
          { title: 'Physical', value: 'physical' },
        ],
      },
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
    },
    {
      name: "dob",
      title: "Date of Birth",
      description: 'If account is individual',
      type: "string",
    },
    {
      name: "onlineShops",
      title: "Online Store Link",
      description: 'If account is business online',
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "name",
              title: "Website Name",
              type: "string",
            },
            {
              name: "accountId",
              title: "Account ID",
              type: "string",
            },
          ],
        },
      ],
    },
    {
      name: "businessName",
      title: "Business Name",
      description: 'If account is business physical',
      type: "string",
    },
    {
      name: "toko",
      title: "Toko",
      description: 'If account is business physical',
      type: "string",
    },
    {
      name: "storeType",
      title: "Store Type",
      description: 'If account is business physical',
      type: 'string',
      options: {
        list: [
          { title: 'Online', value: 'online' },
          { title: 'Physical', value: 'physical' },
        ],
      },
    },
    {
      name: "businessUrl",
      title: "Business Account Link",
      description: 'If account is business physical',
      type: "string",
    },
    {
      name: "businessAddress",
      title: "Business Address",
      description: 'If account is business physical',
      type: "string",
    },
  ],
};
