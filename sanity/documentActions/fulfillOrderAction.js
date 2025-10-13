// sanity/documentActions/fulfillOrderAction.js
import { DownloadIcon } from '@sanity/icons';

// Dynamic import for pdfmake
let pdfMake = null;

const loadPdfMake = async () => {
  if (pdfMake) return pdfMake;
  
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  
  pdfMake = pdfMakeModule.default;
  pdfMake.vfs = pdfFontsModule.default.pdfMake.vfs;
  
  return pdfMake;
};

export default function fulfillOrderAction(props) {
  const { id, type, draft, published } = props;

  // Only show for published orders
  if (type !== 'order' || !published) {
    return null;
  }

  const order = published;

  // ⚠️ CRITICAL: Only show for paid orders
  if (order.paymentStatus !== 'paid') {
    return null;
  }

  return {
    label: 'Fulfill Order (PDF)',
    icon: DownloadIcon,
    onHandle: async () => {
      try {
        const pdfMakeLib = await loadPdfMake();
        await generateOrderPDF(order, pdfMakeLib);
      } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Failed to generate PDF. Check console for details.');
      }
    },
  };
}

async function generateOrderPDF(order, pdfMake) {
  console.log('📄 Generating PDF for order:', order.orderId);

  const formatIDR = (amount) => {
    if (!amount || amount === 0) return 'Rp 0';
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Build product table
  const productTableBody = [
    [
      { text: 'No', style: 'tableHeader', alignment: 'center' },
      { text: 'Product Name', style: 'tableHeader' },
      { text: 'SKU', style: 'tableHeader' },
      { text: 'Qty', style: 'tableHeader', alignment: 'center' },
      { text: 'Price', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' },
      { text: '☐ Picked', style: 'tableHeader', alignment: 'center' }
    ]
  ];

  (order.products || []).forEach((product, index) => {
    const productName = product.name + (product.selectedColor?.colorName ? ` - ${product.selectedColor.colorName}` : '');
    const displaySKU = product.colorShippingSku || product.shippingSku || 'N/A';
    
    productTableBody.push([
      { text: (index + 1).toString(), alignment: 'center' },
      { text: productName, style: 'productName' },
      { text: displaySKU, style: 'sku', bold: true },
      { text: product.quantity.toString(), alignment: 'center' },
      { text: formatIDR(product.price), alignment: 'right' },
      { text: formatIDR(product.totalPrice), alignment: 'right' },
      { text: '☐', fontSize: 16, alignment: 'center' }
    ]);
  });

  const subtotal = order.subTotal || 0;
  const discount = order.discount?.amount || 0;
  const shipping = order.shippingPrice || 0;
  const total = order.totalPrice || 0;

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    header: {
      margin: [40, 20, 40, 10],
      columns: [
        { text: 'MRKT VAPE', style: 'header', alignment: 'left' },
        { text: 'WAREHOUSE FULFILLMENT', style: 'header', alignment: 'right', color: '#666' }
      ]
    },
    
    footer: function(currentPage, pageCount) {
      return {
        margin: [40, 10],
        columns: [
          { text: `Generated: ${new Date().toLocaleString('id-ID')}`, fontSize: 8, color: '#666', alignment: 'left' },
          { text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, color: '#666', alignment: 'right' }
        ]
      };
    },
    
    content: [
      // Order Information
      { text: 'ORDER INFORMATION', style: 'sectionHeader', margin: [0, 0, 0, 10] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Order ID:', style: 'label' },
              { text: order.orderId, style: 'value', margin: [0, 0, 0, 10] },
              { text: 'Order Date:', style: 'label' },
              { text: formatDate(order.createdAt), style: 'value', margin: [0, 0, 0, 10] },
              { text: 'Payment Status:', style: 'label' },
              { 
                text: order.paymentStatus?.toUpperCase() || 'N/A', 
                style: 'value',
                color: order.paymentStatus === 'paid' ? '#22c55e' : '#ef4444',
                bold: true,
                margin: [0, 0, 0, 10]
              },
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'Payment Date:', style: 'label' },
              { text: formatDate(order.paidAt), style: 'value', margin: [0, 0, 0, 10] },
              { text: 'Payment Method:', style: 'label' },
              { text: order.xenditPaymentData?.paymentMethod || 'Xendit', style: 'value', margin: [0, 0, 0, 10] },
              { text: 'Xendit Invoice ID:', style: 'label' },
              { text: order.xenditInvoiceId || 'N/A', style: 'value', fontSize: 8, margin: [0, 0, 0, 10] },
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Customer Information
      { text: 'CUSTOMER INFORMATION', style: 'sectionHeader', margin: [0, 0, 0, 10] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Name:', style: 'label' },
              { text: order.shippingInfo?.fullName || order.name, style: 'value', margin: [0, 0, 0, 10] },
              { text: 'Email:', style: 'label' },
              { text: order.email, style: 'value', margin: [0, 0, 0, 10] },
              { text: 'Phone:', style: 'label' },
              { text: order.shippingInfo?.phone || order.contact, style: 'value', margin: [0, 0, 0, 10] },
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'Shipping Address:', style: 'label' },
              { 
                text: [
                  order.shippingInfo?.streetAddress || '',
                  order.shippingInfo?.district ? `\n${order.shippingInfo.district}` : '',
                  order.shippingInfo?.city ? `\n${order.shippingInfo.city}` : '',
                  order.shippingInfo?.province ? `\n${order.shippingInfo.province}` : '',
                  order.shippingInfo?.postalCode ? ` ${order.shippingInfo.postalCode}` : '',
                ].join(''),
                style: 'value',
                margin: [0, 0, 0, 10]
              },
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Products
      { text: 'PRODUCTS TO PICK', style: 'sectionHeader', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: [25, '*', 80, 30, 60, 60, 45],
          body: productTableBody
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex === 0 ? '#f3f4f6' : (rowIndex % 2 === 0 ? '#fafafa' : null);
          },
          hLineWidth: function (i, node) {
            return (i === 0 || i === 1 || i === node.table.body.length) ? 2 : 1;
          },
          vLineWidth: function () { return 1; },
          hLineColor: function (i) { return i === 0 || i === 1 ? '#000' : '#e5e7eb'; },
          vLineColor: function () { return '#e5e7eb'; },
          paddingLeft: function () { return 8; },
          paddingRight: function () { return 8; },
          paddingTop: function () { return 6; },
          paddingBottom: function () { return 6; }
        },
        margin: [0, 0, 0, 20]
      },

      // Pricing Summary
      { text: 'PRICING SUMMARY', style: 'sectionHeader', margin: [0, 0, 0, 10] },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', 80],
              body: [
                [{ text: 'Subtotal:', style: 'label' }, { text: formatIDR(subtotal), alignment: 'right' }],
                ...(discount > 0 ? [[
                  { text: 'Discount:', style: 'label', color: '#22c55e' },
                  { text: `-${formatIDR(discount)}`, alignment: 'right', color: '#22c55e' }
                ]] : []),
                [{ text: 'Shipping:', style: 'label' }, { text: formatIDR(shipping), alignment: 'right' }],
                [
                  { text: 'TOTAL:', bold: true, fontSize: 12 },
                  { text: formatIDR(total), alignment: 'right', bold: true, fontSize: 12 }
                ]
              ]
            },
            layout: 'noBorders'
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Warehouse Checklist
      { text: 'WAREHOUSE CHECKLIST', style: 'sectionHeader', margin: [0, 20, 0, 10] },
      {
        ul: [
          { text: '☐ All products picked and verified', margin: [0, 5, 0, 5] },
          { text: '☐ Products packed securely', margin: [0, 5, 0, 5] },
          { text: '☐ Shipping label attached', margin: [0, 5, 0, 5] },
          { text: '☐ Order marked as shipped in system', margin: [0, 5, 0, 5] },
        ],
        fontSize: 11,
        margin: [0, 0, 0, 20]
      },

      // Signatures
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Picked By:', style: 'label', margin: [0, 0, 0, 30] },
              { text: '_________________________', alignment: 'center' },
              { text: 'Signature & Date', alignment: 'center', fontSize: 9, color: '#666', margin: [0, 5, 0, 0] }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'Packed By:', style: 'label', margin: [0, 0, 0, 30] },
              { text: '_________________________', alignment: 'center' },
              { text: 'Signature & Date', alignment: 'center', fontSize: 9, color: '#666', margin: [0, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 20, 0, 0]
      },

      // Customer Notes
      ...(order.shippingInfo?.notes ? [
        { text: 'CUSTOMER NOTES', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        {
          text: order.shippingInfo.notes,
          style: 'notes',
          margin: [0, 0, 0, 20]
        }
      ] : [])
    ],
    
    styles: {
      header: { fontSize: 18, bold: true, color: '#1f2937' },
      sectionHeader: { fontSize: 14, bold: true, color: '#1f2937', decoration: 'underline' },
      tableHeader: { fontSize: 10, bold: true, fillColor: '#f3f4f6', color: '#1f2937' },
      productName: { fontSize: 10 },
      sku: { fontSize: 9, color: '#2563eb' },
      label: { fontSize: 9, color: '#6b7280', bold: true },
      value: { fontSize: 10, color: '#1f2937' },
      notes: { fontSize: 10, italics: true, color: '#374151', background: '#fef3c7', padding: 10 }
    },
    
    defaultStyle: { font: 'Roboto' }
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  pdfDocGenerator.download(`Order_${order.orderId}_Fulfillment.pdf`);
  
  console.log('✅ PDF generated and downloaded successfully');
}