export const sendOrderConfirmationEmail = async (orderData) => {
    try {
      console.log('📧 Sending order confirmation email for order:', orderData.orderId);
      
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          to: [
            {
              email: orderData.email,
              name: orderData.name || orderData.shippingInfo?.fullName
            }
          ],
          templateId: 111, // Your template ID for "Successful Purchase Individual"
          params: {
            // Customer info - Extract first name for the template
            FIRSTNAME: (orderData.name || orderData.shippingInfo?.fullName || '').split(' ')[0] || 'Customer',
            
            // Order details
            orderNumber: orderData.orderId,
            purchaseTime: new Date(orderData.paidAt || orderData.createdAt).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            paymentMethod: orderData.xenditPaymentData?.paymentMethod || 'Xendit Payment Gateway',
            
            // Shipping address
            shippingAddress: {
              fullName: orderData.shippingInfo?.fullName || orderData.name,
              streetAddress: orderData.shippingInfo?.streetAddress || '',
              district: orderData.shippingInfo?.district || '',
              city: orderData.shippingInfo?.city || '',
              province: orderData.shippingInfo?.province || '',
              postalCode: orderData.shippingInfo?.postalCode || '',
              country: orderData.shippingInfo?.country || 'Indonesia',
              phone: orderData.shippingInfo?.phone || orderData.contact
            },
            
            // Billing info (same as shipping)
            billingInfo: {
              fullName: orderData.shippingInfo?.fullName || orderData.name,
              email: orderData.email,
              phone: orderData.shippingInfo?.phone || orderData.contact
            },
            
            // Products array formatted for template
            products: orderData.products?.map(item => ({
              name: item.name || 'Product',
              category: item.productType || 'Product',
              idNo: item.shippingSku || item.cartId || '',
              skuNo: item.colorShippingSku || item.shippingSku || '',
              quantity: item.quantity || 1,
              price: `Rp.${(item.totalPrice || 0).toLocaleString('id-ID')}`,
              // Note: image removed as per your request
            })) || [],
            
            // Order totals
            discount: orderData.discount?.amount ? `-Rp.${orderData.discount.amount.toLocaleString('id-ID')}` : 'Rp.0',
            subtotal: `Rp.${(orderData.subTotal || 0).toLocaleString('id-ID')}`,
            tax: 'Rp.0', // You don't seem to have tax in your system
            shippingCost: `Rp.${(orderData.shippingPrice || 0).toLocaleString('id-ID')}`,
            total: `Rp.${(orderData.totalPrice || 0).toLocaleString('id-ID')}`
          }
        })
      });
  
      if (!brevoResponse.ok) {
        const errorText = await brevoResponse.text();
        throw new Error(`Brevo API Error: ${brevoResponse.status} - ${errorText}`);
      }
  
      const result = await brevoResponse.json();
      console.log('✅ Order confirmation email sent successfully:', result.messageId);
      return result;
  
    } catch (error) {
      console.error('❌ Failed to send order confirmation email:', error);
      throw error;
    }
  };
  
  // Helper function to format Indonesian currency
  export const formatIDR = (amount) => {
    return `Rp.${(amount || 0).toLocaleString('id-ID')}`;
  };