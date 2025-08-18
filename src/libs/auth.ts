// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  // ** Configure one or more authentication providers
  // ** Please refer to https://next-auth.js.org/configuration/options#providers for more `providers` options
  providers: [
    CredentialProvider({
      // ** The name to display on the sign in form (e.g. 'Sign in with...')
      // ** For more details on Credentials Provider, visit https://next-auth.js.org/providers/credentials
      name: 'Credentials',
      type: 'credentials',

      /*
       * As we are using our own Sign-in page, we do not need to change
       * username or password attributes manually in following credentials object.
       */
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const externalLoginApiUrl = 'https://xpi.machibo.com/api/auth/login';

          const response = await fetch(externalLoginApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ username: credentials?.username, password: credentials?.password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.status === 1 && result.data && result.data.user) {
            // NextAuth expects a user object with at least an 'id'
            // The 'token' can be added to the user object if needed in the session/JWT
            return {
              id: result.data.user.id.toString(), // ID must be a string
              name: result.data.user.name || result.data.user.username,
              email: result.data.user.email || `${result.data.user.username}@example.com`, // Provide an email if available or a placeholder
              token: result.data.token, // Store the token in the user object
              ...result.data.user // Spread other user properties
            };
          } else {
            return null; // Authentication failed or no user data
          }
        } catch (error: any) {
          console.error('Error during external login in NextAuth authorize:', error);
          throw new Error(error.message || 'Failed to authenticate with external API');
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })

    // ** ...add more providers here
  ],

  // ** Please refer to https://next-auth.js.org/configuration/options#session for more `session` options
  session: {
    /*
     * Choose how you want to save the user session.
     * The default is `jwt`, an encrypted JWT (JWE) stored in the session cookie.
     * If you use an `adapter` however, NextAuth default it to `database` instead.
     * You can still force a JWT session by explicitly defining `jwt`.
     * When using `database`, the session cookie will only contain a `sessionToken` value,
     * which is used to look up the session in the database.
     * If you use a custom credentials provider, user accounts will not be persisted in a database by NextAuth.js (even if one is configured).
     * The option to use JSON Web Tokens for session tokens must be enabled to use a custom credentials provider.
     */
    strategy: 'jwt',

    // ** Seconds - How long until an idle session expires and is no longer valid
    maxAge: 30 * 24 * 60 * 60 // ** 30 days
  },

  // ** Please refer to https://next-auth.js.org/configuration/options#pages for more `pages` options
  pages: {
    signIn: '/login'
  },

  // ** Please refer to https://next-auth.js.org/configuration/options#callbacks for more `callbacks` options
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          // Add custom parameters to the token from the user object returned by authorize
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.username = (user as any).username; // Cast to any to access custom properties
          token.accessToken = (user as any).token; // Store the token from the external API
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          // Add custom parameters to the session user object from the token
          session.user.id = token.id;
          session.user.name = token.name;
          session.user.email = token.email;
          (session.user as any).username = token.username; // Cast to any to add custom properties
          (session.user as any).accessToken = token.accessToken; // Add the token to the session
        }
        return session;
      }
    }
  }
