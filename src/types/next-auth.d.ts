import NextAuth, { DefaultSession } from "next-auth"

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}