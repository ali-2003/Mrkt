export const order = {
  name: "order",
  title: "Ecom - Order",
  type: "document",
  fields: [
    {
      name: "orderId",
      title: "Order ID",
      type: "string",
      description: "Auto-generated order ID"
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
      title: "Customer Name",
      type: "string",
    },
    {
      name: "paid",
      title: "Paid?",
      type: "boolean",
      initialValue: false
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
      initialValue: 0
    },
    {
      name: "discount",
      title: "Discount",
      type: "object",
      fields: [
        {
          name: "name",
          title: "Discount Name",
          type: "string",
        },
        {
          name: "code",
          title: "Discount Code",
          type: "string",
        },
        {
          name: "percentage",
          title: "Discount Percentage",
          type: "number",
        },
        {
          name: "amount",
          title: "Discount Amount",
          type: "number",
        },
        {
          name: "email",
          title: "Referrer Email",
          description: "Email ID of User (only applicable if it is a referral code)",
          type: "string",
        },
        {
          name: "type",
          title: "Discount Type",
          type: 'string',
          options: {
            list: [
              { title: 'First Order', value: 'first' },
              { title: 'Referral', value: 'referral' },
              { title: 'Bundle Discount', value: 'bundle' },
              { title: 'Volume Discount', value: 'volume' },
              { title: 'Test Discount', value: 'test' },
              { title: 'Custom Code', value: 'custom' },
            ],
          },
        },
        {
          name: "message",
          title: "Discount Message",
          type: "string",
        }
      ],
      validation: Rule => Rule.optional()
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
              title: "Product Name",
              type: "string",
            },
            {
              name: "slug",
              title: "Product Slug",
              type: "string",
            },
            {
              name: "cartId",
              title: "Cart ID",
              type: "string",
            },
            {
              name: "productType",
              title: "Product Type",
              type: "string",
            },
            // NEW: Add shipping SKUs for warehouse fulfillment
            {
              name: "shippingSku",
              title: "Shipping SKU",
              type: "string",
              description: "Main SKU for warehouse picking (e.g., BTL-001, POD-002)"
            },
            {
              name: "colorShippingSku",
              title: "Color Variant SKU",
              type: "string",
              description: "Specific SKU for color variant (e.g., POD-002-RED)"
            },
            {
              name: "quantity",
              title: "Quantity",
              type: "number",
            },
            {
              name: "price",
              title: "Unit Price",
              type: "number",
            },
            {
              name: "totalPrice",
              title: "Total Price",
              type: "number",
            },
            {
              name: "selectedColor",
              title: "Selected Color",
              type: "object",
              fields: [
                {
                  name: "colorName",
                  title: "Color Name",
                  type: "string",
                },
                {
                  name: "colorCode",
                  title: "Color Code",
                  type: "string",
                }
              ],
              validation: Rule => Rule.optional()
            }
            // REMOVED: image field (was causing issues)
          ],
        },
      ],
    },
    {
      name: "shippingInfo",
      title: "Shipping Information",
      type: "object",
      fields: [
        {
          name: "fullName",
          title: "Full Name",
          type: "string"
        },
        {
          name: "email",
          title: "Email",
          type: "string"
        },
        {
          name: "phone",
          title: "Phone Number",
          type: "string"
        },
        {
          name: "streetAddress",
          title: "Street Address",
          type: "string"
        },
        {
          name: "district",
          title: "District/Subdistrict",
          type: "string"
        },
        {
          name: "city",
          title: "City",
          type: "string"
        },
        {
          name: "postalCode",
          title: "Postal Code",
          type: "string"
        },
        {
          name: "province",
          title: "Province",
          type: "string"
        },
        {
          name: "country",
          title: "Country",
          type: "string",
          initialValue: "Indonesia"
        },
        {
          name: "notes",
          title: "Order Notes",
          type: "text"
        }
      ]
    },
    // NEW: Warehouse fulfillment section
    {
      name: "warehouseFulfillment",
      title: "Warehouse Fulfillment",
      type: "object",
      fields: [
        {
          name: "status",
          title: "Fulfillment Status",
          type: "string",
          options: {
            list: [
              { title: 'Pending', value: 'pending' },
              { title: 'Processing', value: 'processing' },
              { title: 'Packed', value: 'packed' },
              { title: 'Shipped', value: 'shipped' },
              { title: 'Delivered', value: 'delivered' }
            ]
          },
          initialValue: 'pending'
        },
        {
          name: "pickedBy",
          title: "Picked By",
          type: "string",
          description: "Warehouse staff who picked the items"
        },
        {
          name: "packedBy",
          title: "Packed By", 
          type: "string",
          description: "Warehouse staff who packed the order"
        },
        {
          name: "pickingNotes",
          title: "Picking Notes",
          type: "text",
          description: "Notes from warehouse staff during picking"
        },
        {
          name: "shippingProvider",
          title: "Shipping Provider",
          type: "string"
        },
        {
          name: "trackingNumber",
          title: "Tracking Number",
          type: "string"
        }
      ]
    },
    // Order Status
    {
      name: "status",
      title: "Order Status",
      type: "string",
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Confirmed', value: 'confirmed' },
          { title: 'Processing', value: 'processing' },
          { title: 'Shipped', value: 'shipped' },
          { title: 'Delivered', value: 'delivered' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Failed', value: 'failed' },
          { title: 'Expired', value: 'expired' },
        ]
      },
      initialValue: 'pending'
    },
    // Payment Status
    {
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Paid', value: 'paid' },
          { title: 'Failed', value: 'failed' },
          { title: 'Expired', value: 'expired' },
          { title: 'Refunded', value: 'refunded' },
        ]
      },
      initialValue: 'pending'
    },
    // Xendit Integration Fields
    {
      name: "xenditInvoiceId",
      title: "Xendit Invoice ID",
      type: "string",
      description: "Invoice ID from Xendit"
    },
    {
      name: "xenditInvoiceUrl",
      title: "Xendit Invoice URL",
      type: "url",
      description: "Payment URL from Xendit"
    },
    {
      name: "xenditPaymentData",
      title: "Xendit Payment Data",
      type: "object",
      fields: [
        {
          name: "paymentId",
          title: "Payment ID",
          type: "string"
        },
        {
          name: "paymentMethod",
          title: "Payment Method",
          type: "string"
        },
        {
          name: "paidAmount",
          title: "Paid Amount",
          type: "number"
        },
        {
          name: "paymentChannel",
          title: "Payment Channel",
          type: "string"
        },
        {
          name: "paymentDestination",
          title: "Payment Destination",
          type: "string"
        }
      ],
      validation: Rule => Rule.optional()
    },
    // Email Status
    {
      name: "emailStatus",
      title: "Email Status",
      type: "object",
      fields: [
        {
          name: "orderConfirmationSent",
          title: "Order Confirmation Sent",
          type: "boolean",
          initialValue: false
        },
        {
          name: "paymentSuccessSent",
          title: "Payment Success Email Sent",
          type: "boolean",
          initialValue: false
        },
        {
          name: "shippingNotificationSent",
          title: "Shipping Notification Sent",
          type: "boolean",
          initialValue: false
        }
      ]
    },
    // Timestamps
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    },
    {
      name: "paidAt",
      title: "Paid At",
      type: "datetime"
    },
    {
      name: "expiredAt",
      title: "Expired At",
      type: "datetime"
    },
    {
      name: "failedAt",
      title: "Failed At",
      type: "datetime"
    },
    {
      name: "failureReason",
      title: "Failure Reason",
      type: "string"
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'totalPrice',
      status: 'status',
      paymentStatus: 'paymentStatus',
      email: 'email',
      orderId: 'orderId'
    },
    prepare(selection) {
      const { title, subtitle, status, paymentStatus, email, orderId } = selection;
      return {
        title: `${orderId || 'Order'} - ${title || email}`,
        subtitle: `Rp ${subtitle?.toLocaleString('id-ID') || 0} | ${status} | Payment: ${paymentStatus}`
      };
    }
  },
  orderings: [
    {
      title: 'Created Date (Newest First)',
      name: 'createdDesc',
      by: [{ field: 'createdAt', direction: 'desc' }]
    },
    {
      title: 'Total Price (Highest First)',
      name: 'totalDesc',
      by: [{ field: 'totalPrice', direction: 'desc' }]
    },
    {
      title: 'Status',
      name: 'status',
      by: [{ field: 'status', direction: 'asc' }]
    }
  ]
};