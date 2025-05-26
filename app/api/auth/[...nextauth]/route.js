// app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { sanityAdminClient } from "@/sanity/lib/client"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          console.log("Google sign in attempt for:", user.email);
          
          // Check if user already exists
          const existingUser = await sanityAdminClient.fetch(
            `*[_type == 'user' && email == $email][0]`, 
            { email: user.email }
          )

          console.log("Existing user found:", existingUser);

          if (existingUser) {
            // User exists, update the user object with existing data
            user.id = existingUser._id
            user.profileCompleted = existingUser.profileCompleted
            user.accountType = existingUser.accountType
            user.approved = existingUser.approved
            console.log("Updated user object:", { id: user.id, profileCompleted: user.profileCompleted });
            return true
          } else {
            // Create new incomplete user
            const newUser = await sanityAdminClient.create({
              _type: 'user',
              name: user.name,
              email: user.email,
              authType: 'google',
              createdAt: new Date().toISOString(),
              accountType: 'user', // Default to user, can be changed later
              approved: true,
              profileCompleted: false
            })

            console.log("Created new user:", newUser);

            user.id = newUser._id
            user.profileCompleted = false
            user.accountType = 'user'
            user.approved = true
            return true
          }
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },

    async jwt({ token, user, account }) {
      // Persist user data to token
      if (user) {
        console.log("JWT callback - user data:", { id: user.id, profileCompleted: user.profileCompleted });
        token.id = user.id
        token.profileCompleted = user.profileCompleted
        token.accountType = user.accountType
        token.approved = user.approved
      }
      console.log("JWT token:", { id: token.id, profileCompleted: token.profileCompleted });
      return token
    },

    async session({ session, token }) {
      // Send properties to the client
      console.log("Session callback - token data:", { id: token.id, profileCompleted: token.profileCompleted });
      session.user.id = token.id
      session.user.profileCompleted = token.profileCompleted
      session.user.accountType = token.accountType
      session.user.approved = token.approved
      console.log("Final session:", { id: session.user.id, profileCompleted: session.user.profileCompleted });
      return session
    },

    async redirect({ url, baseUrl }) {
      // If user has incomplete profile, redirect to complete profile
      if (url.includes('profileCompleted=false')) {
        return `${baseUrl}/auth/complete-profile`
      }
      
      // Handle redirects after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  // pages: {
  //   signIn: '/auth/masuk', // Removing this to avoid redirect conflicts
  //   error: '/auth/error',
  // },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)

// Export named exports for App Router
export { handler as GET, handler as POST }