// Thin auth wrapper for middleware (Edge-compatible, no Prisma/Node deps)
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middlewareAuth } = NextAuth(authConfig);
