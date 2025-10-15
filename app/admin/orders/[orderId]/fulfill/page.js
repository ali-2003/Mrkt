"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// FIXED: Correct way to set fonts
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts) {
  // Fallback for different export structure
  pdfMake.vfs = pdfFonts;
}

export default function FulfillOrderPage() {
  const params = useParams();
  const orderId = params.orderId;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!order) return;
    
    try {
      const docDefinition = createPDFDefinition(order);
      pdfMake.createPdf(docDefinition).download(`Order_${order.orderId}_Fulfillment.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  const createPDFDefinition = (order) => {
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
        { text: productName },
        { text: displaySKU, bold: true, color: '#2563eb' },
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

    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      
      header: {
        margin: [40, 20, 40, 10],
        columns: [
          { text: 'MRKT VAPE', fontSize: 18, bold: true },
          { text: 'WAREHOUSE FULFILLMENT', fontSize: 18, bold: true, alignment: 'right', color: '#666' }
        ]
      },
      
      footer: function(currentPage, pageCount) {
        return {
          margin: [40, 10],
          columns: [
            { text: `Generated: ${new Date().toLocaleString('id-ID')}`, fontSize: 8, color: '#666' },
            { text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, color: '#666', alignment: 'right' }
          ]
        };
      },
      
      content: [
        { text: 'ORDER INFORMATION', fontSize: 14, bold: true, decoration: 'underline', margin: [0, 0, 0, 10] },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Order ID:', fontSize: 9, color: '#666', bold: true },
                { text: order.orderId, fontSize: 10, margin: [0, 0, 0, 10] },
                { text: 'Order Date:', fontSize: 9, color: '#666', bold: true },
                { text: formatDate(order.createdAt), fontSize: 10, margin: [0, 0, 0, 10] },
                { text: 'Payment Status:', fontSize: 9, color: '#666', bold: true },
                { text: order.paymentStatus?.toUpperCase() || 'N/A', fontSize: 10, color: order.paymentStatus === 'paid' ? '#22c55e' : '#ef4444', bold: true, margin: [0, 0, 0, 10] },
              ]
            },
            {
              width: '50%',
              stack: [
                { text: 'Payment Date:', fontSize: 9, color: '#666', bold: true },
                { text: formatDate(order.paidAt), fontSize: 10, margin: [0, 0, 0, 10] },
                { text: 'Payment Method:', fontSize: 9, color: '#666', bold: true },
                { text: order.xenditPaymentData?.paymentMethod || 'Xendit', fontSize: 10, margin: [0, 0, 0, 10] },
              ]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        { text: 'CUSTOMER INFORMATION', fontSize: 14, bold: true, decoration: 'underline', margin: [0, 0, 0, 10] },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Name:', fontSize: 9, color: '#666', bold: true },
                { text: order.shippingInfo?.fullName || order.name, fontSize: 10, margin: [0, 0, 0, 10] },
                { text: 'Email:', fontSize: 9, color: '#666', bold: true },
                { text: order.email, fontSize: 10, margin: [0, 0, 0, 10] },
                { text: 'Phone:', fontSize: 9, color: '#666', bold: true },
                { text: order.shippingInfo?.phone || order.contact, fontSize: 10, margin: [0, 0, 0, 10] },
              ]
            },
            {
              width: '50%',
              stack: [
                { text: 'Shipping Address:', fontSize: 9, color: '#666', bold: true },
                { 
                  text: [
                    order.shippingInfo?.streetAddress || '',
                    order.shippingInfo?.district ? `\n${order.shippingInfo.district}` : '',
                    order.shippingInfo?.city ? `\n${order.shippingInfo.city}` : '',
                    order.shippingInfo?.province ? `\n${order.shippingInfo.province}` : '',
                    order.shippingInfo?.postalCode ? ` ${order.shippingInfo.postalCode}` : '',
                  ].join(''),
                  fontSize: 10,
                  margin: [0, 0, 0, 10]
                },
              ]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        { text: 'PRODUCTS TO PICK', fontSize: 14, bold: true, decoration: 'underline', margin: [0, 0, 0, 10] },
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
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
          },
          margin: [0, 0, 0, 20]
        },

        { text: 'PRICING SUMMARY', fontSize: 14, bold: true, decoration: 'underline', margin: [0, 0, 0, 10] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              table: {
                widths: ['*', 80],
                body: [
                  [{ text: 'Subtotal:', fontSize: 9, color: '#666', bold: true }, { text: formatIDR(subtotal), alignment: 'right' }],
                  ...(discount > 0 ? [[
                    { text: 'Discount:', fontSize: 9, color: '#22c55e', bold: true },
                    { text: `-${formatIDR(discount)}`, alignment: 'right', color: '#22c55e' }
                  ]] : []),
                  [{ text: 'Shipping:', fontSize: 9, color: '#666', bold: true }, { text: formatIDR(shipping), alignment: 'right' }],
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

        { text: 'WAREHOUSE CHECKLIST', fontSize: 14, bold: true, decoration: 'underline', margin: [0, 20, 0, 10] },
        {
          ul: [
            '☐ All products picked and verified',
            '☐ Products packed securely',
            '☐ Shipping label attached',
            '☐ Order marked as shipped in system',
          ],
          margin: [0, 0, 0, 20]
        },

        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Picked By:', fontSize: 9, color: '#666', bold: true, margin: [0, 0, 0, 30] },
                { text: '_________________________', alignment: 'center' },
                { text: 'Signature & Date', alignment: 'center', fontSize: 9, color: '#666', margin: [0, 5, 0, 0] }
              ]
            },
            {
              width: '50%',
              stack: [
                { text: 'Packed By:', fontSize: 9, color: '#666', bold: true, margin: [0, 0, 0, 30] },
                { text: '_________________________', alignment: 'center' },
                { text: 'Signature & Date', alignment: 'center', fontSize: 9, color: '#666', margin: [0, 5, 0, 0] }
              ]
            }
          ],
          margin: [0, 20, 0, 0]
        },

        ...(order.shippingInfo?.notes ? [
          { text: 'CUSTOMER NOTES', fontSize: 14, bold: true, decoration: 'underline', margin: [0, 20, 0, 10] },
          { text: order.shippingInfo.notes, fontSize: 10, italics: true, margin: [0, 0, 0, 20] }
        ] : [])
      ],
      
      defaultStyle: { font: 'Roboto' }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.href = '/admin/orders'}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Fulfillment</h1>
              <p className="text-gray-600 mt-2">Order ID: {order.orderId}</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {order.paymentStatus?.toUpperCase()}
            </div>
          </div>

          {!isPaid && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-700">
                ⚠️ This order is not paid yet. PDF generation is available for all orders.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Customer</h3>
              <p className="text-gray-900">{order.shippingInfo?.fullName || order.name}</p>
              <p className="text-gray-600">{order.email}</p>
              <p className="text-gray-600">{order.shippingInfo?.phone || order.contact}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Shipping Address</h3>
              <p className="text-gray-900">{order.shippingInfo?.streetAddress}</p>
              <p className="text-gray-600">{order.shippingInfo?.district}</p>
              <p className="text-gray-600">{order.shippingInfo?.city}, {order.shippingInfo?.province}</p>
              <p className="text-gray-600">{order.shippingInfo?.postalCode}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">Products</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.products?.map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {product.name}
                        {product.selectedColor?.colorName && (
                          <span className="text-gray-500"> - {product.selectedColor.colorName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">
                        {product.colorShippingSku || product.shippingSku || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">{product.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        Rp {product.totalPrice?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8 space-y-2 text-right">
            <p className="text-gray-600">Subtotal: Rp {order.subTotal?.toLocaleString('id-ID')}</p>
            {order.discount?.amount > 0 && (
              <p className="text-green-600">Discount: -Rp {order.discount.amount.toLocaleString('id-ID')}</p>
            )}
            <p className="text-gray-600">Shipping: Rp {order.shippingPrice?.toLocaleString('id-ID')}</p>
            <p className="text-xl font-bold text-gray-900">
              Total: Rp {order.totalPrice?.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF Fulfillment Sheet
            </button>
            <button
              onClick={() => window.location.href = '/admin/orders'}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}