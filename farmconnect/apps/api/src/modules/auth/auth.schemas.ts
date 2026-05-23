import { z } from 'zod';

function isAtLeast18(date: Date): boolean {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 18;
}

// ── Register ──────────────────────────────────────────────────────────────────

export const RegisterSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    birthDate: z.coerce.date(),
    password: z
      .string()
      .trim()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100)
      .regex(/^[\p{L}\s'-]+$/u, 'Full name must contain only letters'),
    role: z.enum(['BUYER', 'PRODUCER']).default('BUYER'),
    // PRODUCER-only fields
    businessName: z.string().trim().min(2).max(100).optional(),
    wilaya: z.string().trim().min(1).max(50).optional(),
    commune: z.string().trim().min(1).max(50).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.birthDate > new Date()) {
      ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'Birth date cannot be in the future' });
    } else if (!isAtLeast18(data.birthDate)) {
      ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'You must be at least 18 years old' });
    }

    if (data.role === 'PRODUCER') {
      if (!data.businessName) {
        ctx.addIssue({ code: 'custom', path: ['businessName'], message: 'Required for producers' });
      }
      if (!data.wilaya) {
        ctx.addIssue({ code: 'custom', path: ['wilaya'], message: 'Required for producers' });
      }
      if (!data.commune) {
        ctx.addIssue({ code: 'custom', path: ['commune'], message: 'Required for producers' });
      }
    }
  });

export type RegisterDto = z.infer<typeof RegisterSchema>;

// ── Login ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().trim().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

// ── Token payload (stored inside JWTs) ───────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;    // userId
  email: string;
  role: string;
}
