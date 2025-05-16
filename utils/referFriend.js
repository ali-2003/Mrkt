/**
 * Sends a referral email to a friend
 * 
 * @param {string} referralEmail - Email of the user sending the referral
 * @param {string} referredEmail - Email of the friend being referred
 * @param {string} firstName - First name of the user sending the referral
 * @param {string} lastName - Last name of the user sending the referral
 * @param {string} url - Base URL of the website
 * @returns {Promise<Object>} - Response object with success status and message
 */
export const sendReferFriendEmail = async (
  referralEmail,
  referredEmail,
  firstName,
  lastName,
  url
) => {
  try {
    // Validate inputs
    if (!referralEmail || !referredEmail || !firstName || !url) {
      return {
        success: false,
        message: "Missing required information for referral"
      };
    }

    // Updated to use /api/refer endpoint based on the error message
    const response = await fetch("/api/refer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referralEmail,
        referredEmail,
        firstName,
        lastName,
        url,
      }),
    });

    const data = await response.json();
    
    // Handle both successful and error responses
    if (!response.ok) {
      console.error("Error sending referral:", data);
      return {
        success: false,
        message: data.message || "Failed to send referral"
      };
    }

    return {
      success: true,
      message: data.message || "Referral sent successfully"
    };
  } catch (error) {
    console.error("Error in sendReferFriendEmail:", error);
    return {
      success: false,
      message: "Something went wrong with your referral request"
    };
  }
};