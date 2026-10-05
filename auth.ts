/* =====================================================================
 * AUTENTICAÇÃO (Auth.js v5)
 * Login por e-mail e senha (senha guardada com hash bcrypt).
 * A sessão é um token JWT que carrega id e perfil (role) do usuário.
 * Estrutura pronta para adicionar o provedor Google no futuro.
 * ===================================================================== */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'E-mail e senha',
      credentials: { email: { label: 'E-mail', type: 'email' }, password: { label: 'Senha', type: 'password' } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? 'CLIENT';
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token?.id ?? '';
        session.user.role = token?.role ?? 'CLIENT';
      }
      return session;
    },
  },
});
