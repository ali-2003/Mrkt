import { NextResponse } from "next/server";
import * as SibApiV3Sdk from "@sendinblue/client";
import { sanityAdminClient } from "@/sanity/lib/client";

const saveInSanity = async (referralEmail, referredEmail, code) => {
  try {
    const res = await sanityAdminClient.create({
      _type: "referral",
      referralEmail: referralEmail,
      referredEmail: referredEmail,
      referralCode: code,
      referAvailed: false,
      dateOfReferral: new Date(),
    });
    return res;
  } catch (error) {
    console.error("Error saving to Sanity:", error);
    throw new Error("Failed to save referral data");
  }
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { referralEmail, referredEmail, firstName, lastName, url } = body;
    
    // Debug log to see what we're getting
    console.log("Received referral request:", { referralEmail, referredEmail, firstName, lastName });
    
    // Validate required fields
    if (!referralEmail || !referredEmail || !firstName || !url) {
      console.log("Missing required fields:", { referralEmail, referredEmail, firstName, url });
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique code for referral
    const CODE =
      Math.random().toString(36).substring(2, 6) +
      Math.floor(Math.random() * 10);

    // Setup Brevo contacts API
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    
    // Check if API key exists
    if (!process.env.BREVO_API_KEY) {
      console.error("Missing Brevo API key in environment");
      return NextResponse.json(
        { success: false, message: "API configuration error" },
        { status: 500 }
      );
    }
    
    apiInstance.setApiKey(
      SibApiV3Sdk.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    // Create contact in Brevo (only if it doesn't exist yet)
    try {
      let createContact = new SibApiV3Sdk.CreateContact();
      createContact.email = referredEmail;
      createContact.attributes = {
        FIRSTNAME: firstName,
        LASTNAME: lastName || "",
      };
      createContact.listIds = [2];
      
      await apiInstance.createContact(createContact);
      console.log("Contact created or already exists in Brevo");
    } catch (error) {
      // If error is that contact already exists, we can continue
      if (error.status !== 400) {
        console.error("Error creating contact:", error);
        return NextResponse.json(
          { success: false, message: "Failed to create contact" },
          { status: 500 }
        );
      }
    }

    // Setup email sending
    var apiInstance2 = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance2.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    // Create email payload
    var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail = {
      to: [
        {
          email: referredEmail,
        },
      ],
      templateId: 1,
      params: {
        firstName: firstName,
        lastName: lastName || "",
        signin_url: `${url}?code=${CODE}`,
      },
    };

    // Send the email
    try {
      console.log("Attempting to send email via Brevo...");
      await apiInstance2.sendTransacEmail(sendSmtpEmail);
      console.log("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { success: false, message: "Failed to send email" },
        { status: 500 }
      );
    }

    // Save referral data to Sanity
    try {
      await saveInSanity(referralEmail, referredEmail, CODE);
    } catch (error) {
      console.error("Failed to save to Sanity:", error);
      // Still return success since email was sent
      return NextResponse.json({ 
        success: true, 
        message: "Email sent but failed to save referral data",
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email sent successfully" 
    });
  } catch (e) {
    console.error("Unexpected error in referral API:", e);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}