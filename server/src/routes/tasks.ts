import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate as any);

router.get("/", async (req: any, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(tasks);
});

router.post("/", async (req: any, res) => {
  const { name, category, color } = req.body;
  const task = await prisma.task.create({
    data: { userId: req.userId, name, category: category || "general", color: color || "#f59e0b" },
  });
  res.status(201).json(task);
});

router.put("/:id", async (req: any, res) => {
  const { name, category, color } = req.body;
  const task = await prisma.task.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { name, category, color },
  });
  res.json(task);
});

router.delete("/:id", async (req: any, res) => {
  await prisma.task.deleteMany({
    where: { id: req.params.id, userId: req.userId },
  });
  res.json({ success: true });
});

export default router;
