import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "./auth.config";

const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(
    // Lazy import to avoid Edge bundling prisma in middleware
    await import("./prisma").then((m) => m.prisma)
  ),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "TOTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { prisma } = await import("./prisma");
        const { compare } = await import("bcryptjs");

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        if (user.totpEnabled) {
          if (!credentials.totp) return null;
          const speakeasy = await import("speakeasy");
          const verified = speakeasy.totp.verify({
            secret: user.totpSecret!,
            encoding: "base32",
            token: credentials.totp as string,
            window: 1,
          });
          if (!verified) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});

export { handlers, auth, signIn, signOut };
