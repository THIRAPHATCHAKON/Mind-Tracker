import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import { transport }  from  "../service/mail" ;



const prisma = new PrismaClient();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      return res.status(400).json({ error: "Email or username already exists" });
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { username: data.username, email: data.email, password: hashedPassword, verified: false, verifyToken: crypto.randomBytes(32).toString("hex"), verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    const verifyurl = `http://localhost:5000/api/auth/verify/${user.verifyToken}`;
    await transport.sendMail({
      from: user.email,
      to:user.email,
      subject: "Verify Your Email",
      html: `
          <h2>Welcome!</h2>

          <p>
            Click the button below to verify your email.
          </p>

          <a href="${verifyurl}">
            Verify Email
          </a>
      `,
    });
    res.status(201).json({
      message: "Verification email sent",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: "Internal server error" })
    console.error(err) ;
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback", {
      expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
    });
    const verified = user.verified;
    if (!verified) {
      return res.status(403).json({ error: "Email not verified" });
    }
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function getMe(req: Request, res: Response) {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, avatar: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}

export async function verifyEmail(
  req: Request,
  res: Response
) {
  try {

    // 1. รับ token
  const token = req.params.token as string;
  if (typeof token !== "string") {
    return res.status(400).json({
      error: "Invalid token",
    });
  }

  const user = await prisma.user.findFirst({
  where: {
      verifyToken: token,
    },
  });
  if (!user) {
    return res.status(400).json({
      error: "Invalid token",
    });
  }
    // 4. update verified
    await prisma.user.update({
      where:{
        id: user.id,
      },
      data:{
        verified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      }
    }) ;
    // 5. redirect success
    res.redirect(`${process.env.CLIENT_URL}/login`) ;
  } catch {
    res.status(500).json({ error: "Internal server error" })
  }
}