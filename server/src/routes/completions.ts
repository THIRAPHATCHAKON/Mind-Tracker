import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate as any);

router.get("/", async (req: any, res) => {
  const { startDate, endDate } = req.query;
  const where: any = { userId: req.userId };
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
  }
  const completions = await prisma.completion.findMany({
    where,
    include: { habit: true },
    orderBy: { date: "desc" },
  });
  res.json(completions);
});

router.post("/", async (req: any, res) => {
  const { habitId, date, completed } = req.body;
  const existing = await prisma.completion.findFirst({
    where: {
      userId: req.userId,
      habitId,
      date: new Date(date),
    },
  });
  if (existing) {
    const updated = await prisma.completion.update({
      where: { id: existing.id },
      data: { completed: completed ?? true },
    });
    return res.json(updated);
  }
  const completion = await prisma.completion.create({
    data: {
      userId: req.userId,
      habitId,
      date: new Date(date),
      completed: completed ?? true,
    },
  });
  res.status(201).json(completion);
});

router.delete("/:id", async (req: any, res) => {
  await prisma.completion.deleteMany({
    where: { id: req.params.id, userId: req.userId },
  });
  res.json({ success: true });
});

export default router;
