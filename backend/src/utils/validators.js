import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required'),
  description: z.string().trim().optional(),
  icon: z.string().optional(),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().trim().min(1, 'Invite code is required'),
});

export const baseExpenseSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  title: z.string().trim().min(1, 'Expense title is required'),
  emoji: z.string().optional(),
  amount: z.number().positive('Amount must be positive').finite('Amount must be a valid number'),
  paidBy: z.string().min(1, 'Payer ID is required'),
  splitAmong: z.array(z.string()).min(1, 'At least one participant is required').optional(),
  participants: z.array(z.string()).optional(),
  splitType: z.string().optional(),
  shares: z.record(z.number()).optional(),
  date: z.string().optional(),
});

export const expenseSchema = baseExpenseSchema.refine(
  (data) => {
    const list = data.participants || data.splitAmong || [];
    const unique = new Set(list);
    return list.length === unique.size;
  },
  { message: 'Participant list must not contain duplicate users' }
);
