import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword, isValidEmail, isValidPassword, isValidNickname } from "./auth";
import { createUser, getUserByEmail, updateUserProfile } from "./db";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    signup: publicProcedure
      .input(
        z.object({
          email: z.string().email("E-mail inválido"),
          password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
          nickname: z.string().min(3, "Apelido deve ter no mínimo 3 caracteres").max(30, "Apelido deve ter no máximo 30 caracteres"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidEmail(input.email)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "E-mail inválido",
          });
        }

        if (!isValidPassword(input.password)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Senha deve conter pelo menos 8 caracteres, 1 maiúscula, 1 minúscula e 1 número",
          });
        }

        if (!isValidNickname(input.nickname)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Apelido deve conter apenas letras, números e underscore",
          });
        }

        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este e-mail já está registrado",
          });
        }

        const passwordHash = hashPassword(input.password);
        const user = await createUser(input.email, passwordHash, input.nickname);

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar usuário",
          });
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const secretKey = new TextEncoder().encode(ENV.cookieSecret);
        const sessionCookie = await new SignJWT({
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          profilePictureUrl: user.profilePictureUrl,
          role: user.role,
        })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime(Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000))
          .sign(secretKey);

        const cookieString = `${COOKIE_NAME}=${sessionCookie}; ${Object.entries(cookieOptions)
          .map(([key, value]) => {
            if (key === "maxAge") return `Max-Age=${value}`;
            if (key === "httpOnly") return "HttpOnly";
            if (key === "secure") return "Secure";
            if (key === "sameSite") return `SameSite=${value}`;
            if (key === "path") return `Path=${value}`;
            return "";
          })
          .filter(Boolean)
          .join("; ")}`;

        ctx.res.setHeader("Set-Cookie", cookieString);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            profilePictureUrl: user.profilePictureUrl,
            role: user.role,
            createdAt: user.createdAt,
          },
        };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("E-mail inválido"),
          password: z.string().min(1, "Senha é obrigatória"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);

        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "E-mail ou senha incorretos",
          });
        }

        if (!verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "E-mail ou senha incorretos",
          });
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const secretKey = new TextEncoder().encode(ENV.cookieSecret);
        const sessionCookie = await new SignJWT({
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          profilePictureUrl: user.profilePictureUrl,
          role: user.role,
        })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime(Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000))
          .sign(secretKey);

        const cookieString = `${COOKIE_NAME}=${sessionCookie}; ${Object.entries(cookieOptions)
          .map(([key, value]) => {
            if (key === "maxAge") return `Max-Age=${value}`;
            if (key === "httpOnly") return "HttpOnly";
            if (key === "secure") return "Secure";
            if (key === "sameSite") return `SameSite=${value}`;
            if (key === "path") return `Path=${value}`;
            return "";
          })
          .filter(Boolean)
          .join("; ")}`;

        ctx.res.setHeader("Set-Cookie", cookieString);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            profilePictureUrl: user.profilePictureUrl,
            role: user.role,
            createdAt: user.createdAt,
          },
        };
      }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          nickname: z.string().min(3).max(30).optional(),
          profilePictureUrl: z.string().url().optional(),
          profilePictureKey: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await updateUserProfile(
          ctx.user.id,
          input.nickname,
          input.profilePictureUrl,
          input.profilePictureKey
        );

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao atualizar perfil",
          });
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            profilePictureUrl: user.profilePictureUrl,
            role: user.role,
            createdAt: user.createdAt,
          },
        };
      }),
    uploadProfilePicture: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const bytes = Buffer.from(input.base64, "base64");
        const maxSize = 5 * 1024 * 1024;
        if (bytes.length > maxSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Arquivo muito grande. Maximo 5MB.",
          });
        }

        const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedMimes.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tipo de arquivo nao permitido. Use JPEG, PNG, WebP ou GIF.",
          });
        }

        try {
          const { storagePut } = await import("./storage");
          const timestamp = Date.now();
          const ext = input.mimeType.split("/")[1];
          const fileKey = `profile-pictures/${ctx.user.id}-${timestamp}.${ext}`;
          const { url } = await storagePut(fileKey, bytes, input.mimeType);
          const user = await updateUserProfile(
            ctx.user.id,
            undefined,
            url,
            fileKey
          );

          if (!user) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Erro ao atualizar foto de perfil",
            });
          }

          return {
            success: true,
            url,
            user: {
              id: user.id,
              email: user.email,
              nickname: user.nickname,
              profilePictureUrl: user.profilePictureUrl,
              role: user.role,
              createdAt: user.createdAt,
            },
          };
        } catch (error) {
          console.error("[Upload] Error uploading profile picture:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao fazer upload da foto. Tente novamente.",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
