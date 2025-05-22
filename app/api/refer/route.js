import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { generateReferralCode } from "@/utils/discountValue";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Invalid request: Email is required" },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await sanityAdminClient.fetch(
      `*[_type == 'user' && email == $email][0]`,
      { email }
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user already has a referral code
    if (user.referralCode) {
      return NextResponse.json({
        success: true,
        message: "User already has a referral code",
        referralCode: user.referralCode
      });
    }
    
    // Generate a unique referral code
    const referralCode = generateReferralCode();
    
    // Update the user with the new referral code
    await sanityAdminClient
      .patch(user._id)
      .set({ referralCode })
      .commit();
    
    return NextResponse.json({
      success: true,
      message: "Referral code generated successfully",
      referralCode
    });
  } catch (error) {
    console.error("Error generating referral code:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while generating referral code" },
      { status: 500 }
    );
  }
}