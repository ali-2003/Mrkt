export const order = {
    name: "order",
    title: "Ecom - Order",
    type: "document",
    fields: [
      {
        name: "orderId",
        title: "Order ID",
        type: "string",
      },
      {
        name: "userId",
        title: "User ID",
        type: "string",
      },
      {
        name: "email",
        title: "Email",
        type: "string",
      },
      {
        name: "name",
        title: "Name",
        type: "string",
      },
      {
        name: "paid",
        title: "Paid?",
        type: "boolean", 
      },
      {
        name: "contact",
        title: "Phone",
        type: "string",
      },
      {
        name: "subTotal",
        title: "Sub Total",
        type: "number",
      },
      {
        name: "shippingPrice",
        title: "Shipping Price",
        type: "number",
      },
      {
        name: "discount",
        title: "Discount",
        type: "object",
        fields: [
          {
            name: "name",
            title: "Name",
            type: "string",
          },
          {
            name: "code",
            title: "Code",
            type: "string",
          },
          {
            name: "percentage",
            title: "Percentage",
            type: "number",
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
            defaultValue: 'simple',
          },
        ],
      },
      {
        name: "totalPrice",
        title: "Total Price",
        type: "number",
      },
      {
        name: "products",
        title: "Products",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              {
                name: "name",
                title: "Name",
                type: "string",
              },
              {
                name: "quantity",
                title: "Quantity",
                type: "string",
              },
              {
                name: "price",
                title: "Price",
                type: "number",
              },
            ],
          },
        ],
      },
      {
        name: "createdAt",
        title: "Created At",
        type: "datetime",
      },
    ],
  };