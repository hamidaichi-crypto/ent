declare module 'tailwindcss-logical'

// next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      accessToken?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username?: string | null;
    token?: string | null; // This is the token from your external API
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    username?: string | null;
    accessToken?: string | null; // This is the token from your external API
  }
}
