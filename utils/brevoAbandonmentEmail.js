// utils/brevoAbandonmentEmail.js
export const sendAbandonmentEmail = async (abandonmentData) => {
    try {
      console.log('📧 === ABANDONMENT EMAIL DEBUG START ===');
      console.log('📧 Raw abandonment data received:', JSON.stringify(abandonmentData, null, 2));
      
      // Check if API key exists
      if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY environment variable is not set');
      }
      
      const { email, type, cartItems, sessionDuration, timestamp } = abandonmentData;
      
      // Extract customer first name from email (basic extraction)
      const customerFirstName = email.split('@')[0].split('.')[0] || 'Customer';
      
      console.log('📧 Extracted customer first name:', customerFirstName);
      console.log('📧 Email type:', type);
      
      // Determine template ID based on type
      let templateId;
      let emailParams = {};
      
      if (type === 'cart_abandonment') {
        // Template #113 for abandoned cart
        templateId = 113;
        
        // Helper function to format Indonesian currency
        const formatIDR = (amount) => {
          if (!amount || amount === 0) return 'Rp.0';
          return `Rp.${Math.round(amount).toLocaleString('id-ID')}`;
        };
        
        // Calculate cart total from items
        let cartTotal = 0;
        const formattedCartItems = (cartItems || []).map((item, index) => {
          const itemTotal = (item.sum || item.price * item.qty || 0);
          cartTotal += itemTotal;
          
          return {
            name: item.name || `Product ${index + 1}`,
            quantity: item.qty || 1,
            price: formatIDR(item.sum || item.price || 0),
            colorName: item.selectedColor?.colorName || '',
            imageUrl: item.cartImage || item.pictures?.[0] || 'https://img.mailinblue.com/2670624/images/rnb/original/5fd092a3becf5f229e6014c2.png'
          };
        });
        
        emailParams = {
          FIRSTNAME: customerFirstName,
          cartItems: formattedCartItems,
          cartTotal: formatIDR(cartTotal),
          cartItemCount: cartItems?.length || 0,
          sessionDuration: Math.round(sessionDuration / 1000 / 60) || 5, // in minutes
          checkoutUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/keranjang`,
          shopUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/ejuice`
        };
        
      } else {
        // Template #6 for website visit without purchase
        templateId = 6;
        
        emailParams = {
          FIRSTNAME: customerFirstName,
          sessionDuration: Math.round(sessionDuration / 1000 / 60) || 5, // in minutes
          shopUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/ejuice`,
          homeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/`
        };
      }
      
      console.log('📧 Using template ID:', templateId);
      console.log('📧 === FINAL EMAIL PARAMS ===');
      console.log(JSON.stringify(emailParams, null, 2));
      
      // Prepare the complete request body for Brevo
      const requestBody = {
        to: [
          {
            email: email,
            name: customerFirstName
          }
        ],
        templateId: templateId,
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
      console.log('📧 === ABANDONMENT EMAIL DEBUG END ===');
      
      return {
        success: true,
        messageId: result.messageId,
        templateId: templateId,
        emailType: type,
        recipient: email
      };
  
    } catch (error) {
      console.error('❌ sendAbandonmentEmail Error:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  };