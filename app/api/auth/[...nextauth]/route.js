// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sanityAdminClient } from "@/sanity/lib/client";

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          const existingUser = await sanityAdminClient.fetch(
            `*[_type == 'user' && email == $email][0]`, 
            { email: credentials.identifier }
          );
          
          if (!existingUser) {
            throw new Error(`No ${credentials.type} account found with this email`);
          }

          // Check user type
          if (credentials.type === 'user' && existingUser.accountType === 'business') {
            throw new Error("No user account found with this email");
          }

          if (credentials.type === 'business' && existingUser.accountType === 'user') {
            throw new Error("No business account found with this email");
          }

          // Check if business account is approved
          if (existingUser.accountType === 'business' && !existingUser.approved) {
            throw new Error("Your business account is pending approval. Please wait for admin approval.");
          }
          
          // Check password
          const isPasswordCorrect = await bcrypt.compare(credentials.password, existingUser.password);
          if (isPasswordCorrect) {
            return existingUser;
          } else {
            throw new Error("Password is incorrect");
          }
        } catch (err) {
          console.log(err);
          throw new Error(err.message || "Failed to authenticate");
        }
      },
    }),
    
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          authType: 'google',
        };
      }
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          console.log("Google sign in attempt for:", user.email);
          
          // Check if user already exists in the system
          const existingUser = await sanityAdminClient.fetch(
            `*[_type == 'user' && email == $email][0]`, 
            { email: user.email }
          );

          if (!existingUser) {
            // User doesn't exist in our system - reject the sign in
            console.log("User not found in system, rejecting Google sign in");
            return false;
          }

          // Check if it's a business account trying to use Google (not allowed)
          if (existingUser.accountType === 'business') {
            console.log("Business user tried to login with Google - not allowed");
            return false;
          }

          // Check if business account is approved (shouldn't happen for Google but just in case)
          if (existingUser.accountType === 'business' && !existingUser.approved) {
            console.log("Business account not approved");
            return false;
          }

          // User exists and is a personal account - allow sign in
          user.id = existingUser._id;
          user.profileCompleted = existingUser.profileCompleted;
          user.accountType = existingUser.accountType;
          user.approved = existingUser.approved;
          user.whatsapp = existingUser.whatsapp;
          user.balance = existingUser.balance;
          user.dob = existingUser.dob;
          
          console.log("Existing user found:", { 
            profileCompleted: user.profileCompleted,
            accountType: user.accountType 
          });
          
          return true;
        } catch (error) {
          console.error("Error in Google sign-in:", error);
          return false;
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        console.log("JWT callback - user data:", { 
          id: user.id, 
          profileCompleted: user.profileCompleted,
          accountType: user.accountType 
        });
        
        token.id = user.id;
        token.profileCompleted = user.profileCompleted;
        token.accountType = user.accountType;
        token.approved = user.approved;
        token.authType = user.authType;
        
        // Add user-specific fields
        if (user.accountType === 'user') {
          token.name = user.name;
          token.whatsapp = user.whatsapp;
          token.balance = user.balance;
          token.dob = user.dob;
        } else if (user.accountType === 'business') {
          token.businessName = user.businessName;
          token.businessType = user.businessType;
          token.whatsapp = user.whatsapp;
          token.businessAddress = user.businessAddress;
          token.onlineShops = user.onlineShops;
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      console.log("Session callback - token data:", { 
        id: token.id, 
        profileCompleted: token.profileCompleted,
        authType: token.authType 
      });
      
      session.user.id = token.id;
      session.user.profileCompleted = token.profileCompleted;
      session.user.accountType = token.accountType;
      session.user.approved = token.approved;
      session.user.authType = token.authType;
      
      if (token.accountType === 'user') {
        session.user.name = token.name;
        session.user.whatsapp = token.whatsapp;
        session.user.balance = token.balance;
        session.user.dob = token.dob;
      } else if (token.accountType === 'business') {
        session.user.businessName = token.businessName;
        session.user.businessType = token.businessType;
        session.user.whatsapp = token.whatsapp;
        session.user.businessAddress = token.businessAddress;
        session.user.onlineShops = token.onlineShops;
      }
      
      return session;
    },

    async redirect({ url, baseUrl }) {
      // For Google sign in, check if profile is complete
      if (url.includes('/api/auth/callback/google')) {
        return `${baseUrl}/auth/complete-profile-check`;
      }
      
      // Default redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  
  pages: {
    signIn: "/auth/masuk",
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (account.provider === 'google') {
        console.log("Google sign in event:", { 
          profileCompleted: user.profileCompleted,
          isNewUser,
          userId: user.id 
        });
      }
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET || "mQ46qpFwfE1BHuqMC+qlm19qBAD9fVPgh28werwe3ASFlAfnKjM=",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };