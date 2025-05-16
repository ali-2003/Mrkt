import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sanityAdminClient } from "@/sanity/lib/client";
import { SanityAdapter } from 'next-auth-sanity';

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          const existingUser = await sanityAdminClient.fetch(`*[_type == 'user' && email == $email][0]`, { email: credentials.identifier });
          
          if (!existingUser) {
            throw new Error(`No ${credentials.type} account found with this email`);
          }

          // checking user type
          if (credentials.type === 'user' && existingUser.accountType === 'business') {
            throw new Error("No user account found with this email");
          }

          if (credentials.type === 'business' && existingUser.accountType === 'user') {
            throw new Error("No business account found with this email");
          }

          if (existingUser.accountType === 'business' && !existingUser.approved) {
            throw new Error("Your account is not approved yet");
          }
          
          // checking password
          const isPasswordCorrect = await bcrypt.compare(credentials.password, existingUser.password);
          if (isPasswordCorrect) {
            if (existingUser.accountType === 'business' && !existingUser.approved) {
              throw new Error("Account not approved yet");
            }

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
      // Only allow Google for personal accounts
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
  
  adapter: SanityAdapter(sanityAdminClient),
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google sign-ins, we need extra checks
      if (account.provider === 'google') {
        try {
          // Check if this email already exists
          const existingUser = await sanityAdminClient.fetch(
            `*[_type == 'user' && email == $email][0]`, 
            { email: profile.email }
          );

          if (existingUser) {
            // If the user exists but is a business account, reject the Google login
            if (existingUser.accountType === 'business') {
              return '/auth/google-business-error'; // Redirect to error page
            }
            
            // If it's a personal account already registered, allow login
            return true;
          } else {
            // If new user, redirect to complete profile page
            // Store the Google profile data in a session so it can be used later
            return '/auth/complete-profile?email=' + encodeURIComponent(profile.email) + 
                  '&name=' + encodeURIComponent(profile.name) +
                  '&authType=google';
          }
        } catch (error) {
          console.error("Error in Google sign-in:", error);
          return '/auth/error'; // Redirect to general error page
        }
      }
      
      return true; // Default allow sign in for non-Google providers
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.email = token.email;
        session.user.authType = token.authType;

        if (token.type === 'user') {
          session.user.name = token.name;
          session.user.whatsapp = token.whatsapp;
          session.user.balance = token.balance;
        } else {
          session.user.approved = token.approved;
          session.user.storeType = token.storeType;
          session.user.businessUrl = token.businessUrl;
          session.user.toko = token.toko;
          session.user.createdAt = token.createdAt;
          session.user.businessName = token.businessName;
          session.user.businessType = token.businessType;
          session.user.whatsapp = token.whatsapp;
          session.user.businessAddress = token.businessAddress;
          session.user.onlineShops = token.onlineShops;
        }
      }
      return session;
    },
    
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user._id || user.id;
        token.email = user.email;
        token.authType = user.authType;
        
        // For Sanity users (from credentials login or already created Google users)
        if (user._id) {
          token.type = user.accountType;
          
          if (user.accountType === 'user') {
            token.name = user.name;
            token.whatsapp = user.whatsapp;
            token.balance = user.balance;
          } else {
            token.approved = user.approved;
            token.storeType = user.storeType;
            token.businessUrl = user.businessUrl;
            token.toko = user.toko;
            token.createdAt = user.createdAt;
            token.businessName = user.businessName;
            token.businessType = user.businessType;
            token.whatsapp = user.whatsapp;
            token.businessAddress = user.businessAddress;
            token.onlineShops = user.onlineShops;
          }
        } 
        // For new Google users who haven't been created in Sanity yet
        else if (account && account.provider === 'google') {
          token.name = user.name;
          // These will be filled in during the complete-profile step
          token.type = 'user'; // Default for Google signup is personal account
        }
      }
      return token;
    },
  },
  
  pages: {
    signIn: "/auth/masuk",
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
  },
  
  secret: process.env.NEXTAUTH_SECRET || "mQ46qpFwfE1BHuqMC+qlm19qBAD9fVPgh28werwe3ASFlAfnKjM=",
};

export default NextAuth(authOptions);