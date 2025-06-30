import bcrypt from "bcryptjs"
import { sanityAdminClient } from "@/sanity/lib/client"
import { AFFILIATE_DISCOUNT, FIRST_ORDER_DISCOUNT, REFER_FRIEND_DISCOUNT_BUS, REFER_FRIEND_DISCOUNT_IND } from "@/utils/discountValue.js"

// 📧 WELCOME EMAIL FUNCTION - EXISTING CODE UNCHANGED
const sendWelcomeEmail = async (userData) => {
    try {
        console.log('📧 Sending welcome email to:', userData.email);
        
        if (!process.env.BREVO_API_KEY) {
            throw new Error('BREVO_API_KEY environment variable is not set');
        }
        
        // Extract first name from full name or email
        const firstName = userData.name 
            ? userData.name.split(' ')[0] 
            : userData.email.split('@')[0];
        
        // Determine template ID and email parameters based on account type
        let templateId, emailParams;
        
        if (userData.accountType === 'user') {
            // Individual account - Template ID #4
            templateId = 4;
            emailParams = {
                FIRSTNAME: firstName,
                shopUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://mrkt.id'
            };
        } else {
            // Business account - Template ID #85  
            templateId = 85;
            emailParams = {
                FIRSTNAME: firstName,
                approvalStatus: userData.approved 
                    ? "Selamat! Anda telah disetujui oleh mrkt." 
                    : "Terima kasih telah mendaftar!",
                statusMessage: userData.approved
                    ? "Aplikasi bisnis Anda telah disetujui dan Anda dapat mengakses harga grosir."
                    : "Aplikasi bisnis Anda sedang dalam proses review. Kami akan menghubungi Anda segera.",
                dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard` || 'https://mrkt.id/dashboard'
            };
        }
        
        const requestBody = {
            to: [
                {
                    email: userData.email,
                    name: firstName
                }
            ],
            templateId: templateId,
            params: emailParams
        };
        
        console.log('📧 Sending welcome email with template ID:', templateId);
        console.log('📧 Email params:', emailParams);
        
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!brevoResponse.ok) {
            const errorText = await brevoResponse.text();
            console.error('❌ Brevo API Error Response:', errorText);
            throw new Error(`Brevo API Error: ${brevoResponse.status} - ${errorText}`);
        }
        
        const result = await brevoResponse.json();
        console.log('✅ Welcome email sent successfully:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        // Don't throw error - continue with registration even if email fails
        return { error: error.message };
    }
};

// 📧 NEW: FIRST ORDER DISCOUNT EMAIL FUNCTION - TEMPLATE ID 10
const sendFirstOrderDiscountEmail = async (userData) => {
    try {
        console.log('📧 === FIRST ORDER DISCOUNT EMAIL DEBUG START ===');
        console.log('📧 Sending first order discount email to:', userData.email);
        console.log('📧 User data:', JSON.stringify(userData, null, 2));
        
        if (!process.env.BREVO_API_KEY) {
            throw new Error('BREVO_API_KEY environment variable is not set');
        }
        
        // Extract first name from full name or email
        const firstName = userData.name 
            ? userData.name.split(' ')[0] 
            : userData.email.split('@')[0];
        
        console.log('📧 Extracted first name:', firstName);
        
        // Use Template ID 10 for first order discount
        const templateId = 10;
        
        // Prepare email parameters for template ID 10
        const emailParams = {
            FIRSTNAME: firstName,
            NAME: userData.name || firstName,
            EMAIL: userData.email,
            DISCOUNT_PERCENTAGE: "15",
            DISCOUNT_MESSAGE: "Selamat! Anda mendapat diskon 15% untuk pembelian pertama Anda!",
            ACCOUNT_TYPE: userData.accountType === 'user' ? 'Individual' : 'Business',
            SHOP_URL: `${process.env.NEXT_PUBLIC_BASE_URL}/ejuice` || 'https://mrkt.id/ejuice',
            HOME_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://mrkt.id',
            CHECKOUT_URL: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout` || 'https://mrkt.id/checkout'
        };
        
        // Add conditional message based on account type
        if (userData.accountType === 'business') {
            emailParams.SPECIAL_MESSAGE = userData.approved
                ? "Sebagai anggota bisnis yang telah disetujui, Anda juga memiliki akses ke harga grosir!"
                : "Setelah akun bisnis Anda disetujui, Anda akan memiliki akses ke harga grosir!";
        } else {
            emailParams.SPECIAL_MESSAGE = "Gunakan diskon ini untuk merasakan kualitas premium produk mrkt.";
        }
        
        const requestBody = {
            to: [
                {
                    email: userData.email,
                    name: firstName
                }
            ],
            templateId: templateId,
            params: emailParams
        };
        
        console.log('📧 Using template ID:', templateId);
        console.log('📧 === FINAL EMAIL PARAMS ===');
        console.log(JSON.stringify(emailParams, null, 2));
        console.log('📧 === REQUEST BODY TO BREVO ===');
        console.log(JSON.stringify(requestBody, null, 2));
        
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
        console.log('✅ First order discount email sent successfully:', result);
        console.log('📧 === FIRST ORDER DISCOUNT EMAIL DEBUG END ===');
        
        return {
            success: true,
            messageId: result.messageId,
            templateId: templateId
        };
        
    } catch (error) {
        console.error('❌ Failed to send first order discount email:', error);
        console.error('❌ Error stack:', error.stack);
        // Don't throw error - continue with registration even if email fails
        return { error: error.message };
    }
};

export async function POST(request) {
    try {
        const body = await request.json()
        const { email, password, whatsapp, accountType, code } = body
        
        // Check if user already exists
        const existingUser = await sanityAdminClient.fetch(`*[_type == 'user' && email == $email][0]`, { email })

        if (existingUser) {
            return Response.json({
                status: "error",
                message: 'An account already exists with this email.'
            }, { status: 400 })
        }
        
        const hashedPassword = await bcrypt.hash(password, 10)

        let discountValid = false
        let discount = null
        let referalUserEmail
        let referalUser

        // Check referral code if provided
        if (code) {
            discount = await sanityAdminClient.fetch(`*[_type == 'referral' && referredEmail == $email && referralCode == $code && referAvailed == false]`, { email, code })
            
            if (discount?.length) {
                referalUserEmail = discount[0].referralEmail
                referalUser = await sanityAdminClient.fetch(`*[_type == 'user' && email == $referalUserEmail]{..., discountAvailable}[0]`, { referalUserEmail })
                
                if (accountType === referalUser?.accountType) {
                    discountValid = true
                }
            }
        }
        
        let registeredUser;
        
        if (accountType === 'user') {
            const { name, dob } = body

            registeredUser = await sanityAdminClient.create({
                _type: 'user',
                name,
                email,
                password: hashedPassword,
                authType: 'email',
                createdAt: new Date().toISOString(),
                accountType,
                approved: true,
                whatsapp,
                dob,
                balance: 0,
                discountsAvailable: discountValid ? 
                [{
                    _key: Math.random().toString(36).substring(7),
                    name: "Refer Friend Discount",
                    code: code,
                    type: 'refer',
                    percentage: REFER_FRIEND_DISCOUNT_IND,
                }] :
                [{
                    _key: Math.random().toString(36).substring(7),
                    name: "First Order Discount",
                    code: code,
                    type: 'first',
                    percentage: FIRST_ORDER_DISCOUNT,
                }]
            })

            // Create affiliate discount code for individual users
            const affiliateDiscount = await sanityAdminClient.create({
                _type: 'discount',
                name: `Affiliate Discount Code for ${email}`,
                email,
                code: Array.from({length: Math.floor(Math.random() * 2) + 5}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join(''),
                type: 'affiliate',
                percentage: AFFILIATE_DISCOUNT
            })
            
        } else if (accountType === 'business') {
            const { businessType } = body
            
            if (businessType === 'online') {
                const { onlineShops } = body
                registeredUser = await sanityAdminClient.create({
                    _type: 'user',
                    email,
                    password: hashedPassword,
                    authType: 'email',
                    createdAt: new Date().toISOString(),
                    accountType,
                    businessType,
                    approved: false, // Business accounts need approval
                    whatsapp,
                    onlineShops: onlineShops.map(shop => {
                        return {
                            _key: Math.random().toString(36).substring(7),
                            name: shop.name,
                            accountId: shop.accountId
                        }
                    }),
                    discountsAvailable: discountValid ?
                    [{
                        _key: Math.random().toString(36).substring(7),
                        name: "Refer Friend Discount",
                        code: code,
                        type: 'refer',
                        percentage: REFER_FRIEND_DISCOUNT_BUS,
                    }] :
                    []
                })
            } else {
                const { businessName, toko, store, url, address } = body
                registeredUser = await sanityAdminClient.create({
                    _type: 'user',
                    email,
                    password: hashedPassword,
                    authType: 'email',
                    createdAt: new Date().toISOString(),
                    accountType,
                    businessType,
                    approved: false, // Business accounts need approval
                    whatsapp,
                    businessName,
                    toko,
                    storeType: store,
                    businessUrl: url || '',
                    businessAddress: address || '',
                    discountsAvailable: discountValid ?
                    [{
                        _key: Math.random().toString(36).substring(7),
                        name: "Refer Friend Discount",
                        code: code,
                        type: 'refer',
                        percentage: REFER_FRIEND_DISCOUNT_BUS,
                    }] :
                    []
                })
            }
        }

        // Handle referral rewards if discount was valid
        if (discountValid && referalUser && discount?.length) {
            try {
                // Add discount to referring user
                await sanityAdminClient.patch(referalUser._id).set({ 
                    discountsAvailable: [
                        ...(referalUser.discountsAvailable || []),
                        {
                            _key: Math.random().toString(36).substring(7),
                            name: "Refer Friend Discount",
                            code: code,
                            type: 'refer',
                            percentage: REFER_FRIEND_DISCOUNT_IND,
                        }
                    ] 
                }).commit()

                // Mark referral as used
                await sanityAdminClient.patch(discount[0]._id).set({ 
                    referAvailed: true 
                }).commit()
                
                console.log('✅ Referral rewards processed successfully');
            } catch (referralError) {
                console.error('❌ Error processing referral rewards:', referralError);
                // Continue with registration even if referral processing fails
            }
        }

        // 🎯 SEND WELCOME EMAIL AFTER SUCCESSFUL REGISTRATION (EXISTING)
        console.log('📧 Attempting to send welcome email...');
        const emailResult = await sendWelcomeEmail({
            email: registeredUser.email,
            name: registeredUser.name || registeredUser.businessName,
            accountType: registeredUser.accountType,
            approved: registeredUser.approved
        });

        // 🎯 NEW: SEND FIRST ORDER DISCOUNT EMAIL (TEMPLATE ID 10)
        console.log('📧 Attempting to send first order discount email...');
        const discountEmailResult = await sendFirstOrderDiscountEmail({
            email: registeredUser.email,
            name: registeredUser.name || registeredUser.businessName || '',
            accountType: registeredUser.accountType,
            approved: registeredUser.approved
        });

        // Update user record with both email statuses
        try {
            await sanityAdminClient.patch(registeredUser._id).set({
                welcomeEmailSent: !emailResult.error,
                welcomeEmailSentAt: new Date().toISOString(),
                welcomeEmailError: emailResult.error || null,
                firstOrderDiscountEmailSent: !discountEmailResult.error,
                firstOrderDiscountEmailSentAt: new Date().toISOString(),
                firstOrderDiscountEmailError: discountEmailResult.error || null,
                firstOrderDiscountTemplateId: 10
            }).commit();
        } catch (updateError) {
            console.error('❌ Error updating email status:', updateError);
        }

        const successMessage = accountType === 'user' 
            ? `Individual account registered successfully! Welcome email and first order discount email sent to ${email}.`
            : `Business account registered successfully! ${registeredUser.approved ? 'You have been approved and can access wholesale prices.' : 'Your application is under review.'} Welcome email and first order discount email sent to ${email}.`;

        return Response.json({
            status: "success",
            message: successMessage,
            emailSent: !emailResult.error,
            discountEmailSent: !discountEmailResult.error,
            user: {
                id: registeredUser._id,
                email: registeredUser.email,
                accountType: registeredUser.accountType,
                approved: registeredUser.approved
            }
        }, { status: 200 })

    } catch (err) {
        console.error('❌ Registration error:', err)
        return Response.json({
            status: "error",
            message: "Error registering user. Please try again."
        }, { status: 500 })
    }
}