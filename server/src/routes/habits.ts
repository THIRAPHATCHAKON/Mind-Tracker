import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate as any);

router.get("/", async (req: any, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(habits);
});

router.post("/", async (req: any, res) => {
  const { name, category, color } = req.body;
  const habit = await prisma.habit.create({
    data: { userId: req.userId, name, category: category || "general", color: color || "#6366f1" },
  });
  res.status(201).json(habit);
});

router.put("/:id", async (req: any, res) => {
  const { name, category, color } = req.body;
  const habit = await prisma.habit.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { name, category, color },
  });
  res.json(habit);
});

router.delete("/:id", async (req: any, res) => {
  await prisma.habit.deleteMany({
    where: { id: req.params.id, userId: req.userId },
  });
  res.json({ success: true });
});

export default router;
