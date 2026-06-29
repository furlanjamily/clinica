import * as z from "zod"
import { USER_ROLES } from "@/types/auth"

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES).default("ADMIN"),
  image: z.string().url().nullable().optional(),
})

export const UpdateUserSchema = z.object({
  id: z.string().min(1),
  role: z.enum(USER_ROLES).optional(),
  password: z.string().min(8).optional(),
  active: z.boolean().optional(),
  image: z.string().url().nullable().optional(),
})

export const DeleteUserSchema = z.object({
  id: z.string().min(1),
})

export const UserAvatarUploadSchema = z.object({
  userId: z.string().min(1).optional(),
})
