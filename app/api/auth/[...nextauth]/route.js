// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sanityAdminClient } from "@/sanity/lib/client";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        type: { label: "Type", type: "text" }
      },
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
            return {
              id: existingUser._id,
              email: existingUser.email,
              name: existingUser.fullName || existingUser.businessName,
              profileCompleted: existingUser.profileCompleted,
              accountType: existingUser.accountType,
              approved: existingUser.approved,
              authType: 'credentials'
            };
          } else {
            throw new Error("Password is incorrect");
          }
        } catch (err) {
          console.log("Credentials auth error:", err);
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
          
          const existingUser = await sanityAdminClient.fetch(
            `*[_type == 'user' && email == $email][0]`, 
            { email: user.email }
          );

          if (!existingUser) {
            console.log("User not found in system, rejecting Google sign in");
            return false;
          }

          if (existingUser.accountType === 'business') {
            console.log("Business user tried to login with Google - not allowed");
            return false;
          }

          if (existingUser.accountType === 'business' && !existingUser.approved) {
            console.log("Business account not approved");
            return false;
          }

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
      console.log("Redirect callback:", { url, baseUrl });
      
      // Handle signout
      if (url.includes('/api/auth/signout') || url.includes('signout')) {
        console.log("Signout detected, redirecting to home");
        return baseUrl;
      }
      
      // For Google sign in
      if (url.includes('/api/auth/callback/google')) {
        return `${baseUrl}/auth/complete-profile-check`;
      }
      
      // Handle callback URLs
      if (url.includes('callbackUrl=')) {
        const callbackUrl = new URL(url).searchParams.get('callbackUrl');
        if (callbackUrl && callbackUrl.startsWith('/')) {
          return `${baseUrl}${callbackUrl}`;
        }
      }
      
      // Default redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  
  pages: {
    signIn: "/auth/masuk",
    signOut: "/",
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("SignIn event:", { 
        provider: account.provider,
        userId: user.id,
        email: user.email
      });
    },
    
    async signOut({ session, token }) {
      console.log("SignOut event:", { 
        userId: token?.id || session?.user?.id,
        email: token?.email || session?.user?.email 
      });
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Export for App Router (Next.js 13+)
export { handler as GET, handler as POST };