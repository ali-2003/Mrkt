// utils/brevoEmail.js - UPDATED VERSION WITH FIXES

export const sendOrderConfirmationEmail = async (orderData) => {
    try {
      console.log('📧 === EMAIL DEBUG START ===');
      console.log('📧 Raw order data received:', JSON.stringify(orderData, null, 2));
      
      // Check if API key exists
      if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY environment variable is not set');
      }
      
      // Helper function to format Indonesian currency
      const formatIDR = (amount) => {
        if (!amount || amount === 0) return 'Rp.0';
        return `Rp.${Math.round(amount).toLocaleString('id-ID')}`;
      };
      
      // Helper function to format date/time in Indonesian
      const formatDateTime = (dateString) => {
        try {
          const date = new Date(dateString);
          return date.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        } catch (error) {
          console.error('Error formatting date:', error);
          return new Date().toLocaleString('id-ID');
        }
      };
      
      // Extract customer first name
      const customerFirstName = (orderData.name || orderData.shippingInfo?.fullName || 'Customer')
        .split(' ')[0] || 'Customer';
      
      console.log('📧 Extracted customer first name:', customerFirstName);
      
      // 🎯 CALCULATE DISCOUNT PROPERLY
      let discountDisplay = 'Rp.0';
      let discountAmount = 0;
      
      if (orderData.discount?.amount && orderData.discount.amount > 0) {
        discountAmount = orderData.discount.amount;
        discountDisplay = `-${formatIDR(discountAmount)}`;
      }
      
      console.log('📧 Discount calculation:', {
        hasDiscount: !!orderData.discount,
        discountAmount: discountAmount,
        discountDisplay: discountDisplay,
        originalSubtotal: orderData.subTotal
      });
      
      // Prepare email parameters
      const emailParams = {
        // Basic customer info
        FIRSTNAME: customerFirstName,
        
        // Order details
        orderNumber: orderData.orderId || 'TEST-ORDER-123',
        purchaseTime: formatDateTime(orderData.paidAt || orderData.createdAt) || 'Test Date',
        paymentMethod: 'Xendit Payment Gateway',
        
        // Shipping address
        shippingAddress: {
          fullName: orderData.shippingInfo?.fullName || orderData.name || 'Test Customer',
          streetAddress: orderData.shippingInfo?.streetAddress || 'Test Street 123',
          district: orderData.shippingInfo?.district || 'Test District',
          city: orderData.shippingInfo?.city || 'Test City', 
          province: orderData.shippingInfo?.province || 'Test Province',
          postalCode: orderData.shippingInfo?.postalCode || '12345',
          country: orderData.shippingInfo?.country || 'Indonesia',
          phone: orderData.shippingInfo?.phone || orderData.contact || '+62123456789'
        },
        
        // Billing info
        billingInfo: {
          fullName: orderData.shippingInfo?.fullName || orderData.name || 'Test Customer',
          email: orderData.email || 'test@example.com',
          phone: orderData.shippingInfo?.phone || orderData.contact || '+62123456789'
        },
        
        // 🎯 FIXED: Products array with actual images and correct SKU info
        products: (orderData.products || []).map((item, index) => {
          console.log(`📧 Processing product ${index + 1}:`, item);
          
          const product = {
            name: item.name || `Product ${index + 1}`,
            category: item.category || item.productType || 'Product',
            skuNo: item.skuNo || item.colorShippingSku || item.shippingSku || `SKU-${index + 1}`,
            quantity: item.quantity || item.qty || 1,
            price: item.price || formatIDR(item.totalPrice || item.sum || 50000),
            imageUrl: item.imageUrl || 'https://img.mailinblue.com/2670624/images/rnb/original/5fd092a3becf5f229e6014c2.png' // Fallback image
          };
          
          console.log(`📧 Mapped product ${index + 1}:`, product);
          return product;
        }),
        
        // 🎯 FIXED: Financial breakdown with proper discount and shipping
        discount: discountDisplay,
        subtotal: formatIDR(orderData.subTotal || 100000),
        shippingCost: formatIDR(orderData.shippingPrice || 10000),
        total: formatIDR(orderData.totalPrice || 110000)
      };
      
      console.log('📧 === FINAL EMAIL PARAMS ===');
      console.log(JSON.stringify(emailParams, null, 2));
      
      // Prepare the complete request body for Brevo
      const requestBody = {
        to: [
          {
            email: orderData.email,
            name: customerFirstName
          }
        ],
        templateId: 111, // Your template ID
        params: emailParams
      };
      
      console.log('📧 === REQUEST BODY TO BREVO ===');
      console.log(JSON.stringify(requestBody, null, 2));
      
      // Send email via Brevo API
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
  
      console.log('📧 Brevo response status:', brevoResponse.status);
      console.log('📧 Brevo response headers:', Object.fromEntries(brevoResponse.headers.entries()));
  
      if (!brevoResponse.ok) {
        const errorText = await brevoResponse.text();
        console.error('❌ Brevo API Error Response:', errorText);
        throw new Error(`Brevo API Error: ${brevoResponse.status} - ${errorText}`);
      }
  
      const result = await brevoResponse.json();
      console.log('✅ Brevo success response:', result);
      console.log('📧 === EMAIL DEBUG END ===');
      
      return result;
  
    } catch (error) {
      console.error('❌ sendOrderConfirmationEmail Error:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  };