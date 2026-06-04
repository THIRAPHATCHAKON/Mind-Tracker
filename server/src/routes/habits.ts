import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate as any);

// ---- Habit Groups ----

router.get("/groups", async (req: any, res) => {
  const groups = await prisma.habitGroup.findMany({
    where: { userId: req.userId },
    orderBy: { order: "asc" },
    include: {
      habits: { orderBy: { order: "asc" } },
    },
  });
  res.json(groups);
});

router.post("/groups", async (req: any, res) => {
  const { name } = req.body;
  const lastGroup = await prisma.habitGroup.findFirst({
    where: { userId: req.userId },
    orderBy: { endDate: "desc" },
    select: { endDate: true, order: true },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let startDate: Date;
  let order: number;

  if (lastGroup) {
    startDate = new Date(lastGroup.endDate);
    startDate.setDate(startDate.getDate() + 1);
    order = lastGroup.order + 1;
  } else {
    startDate = now;
    order = 0;
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const group = await prisma.habitGroup.create({
    data: {
      userId: req.userId,
      name,
      order,
      startDate,
      endDate,
    },
    include: { habits: true },
  });
  res.status(201).json(group);
});

router.put("/groups/:id", async (req: any, res) => {
  const { name } = req.body;
  const group = await prisma.habitGroup.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { name },
  });
  res.json(group);
});

router.delete("/groups/:id", async (req: any, res) => {
  const group = await prisma.habitGroup.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { habits: true },
  });
  if (!group) return res.status(404).json({ error: "Group not found" });

  for (const habit of group.habits) {
    await prisma.completion.deleteMany({ where: { habitId: habit.id } });
  }
  await prisma.habit.deleteMany({ where: { groupId: req.params.id } });
  await prisma.habitGroup.deleteMany({ where: { id: req.params.id, userId: req.userId } });
  res.json({ success: true });
});

router.put("/groups/reorder", async (req: any, res) => {
  const { groupIds }: { groupIds: string[] } = req.body;
  await Promise.all(
    groupIds.map((id, index) =>
      prisma.habitGroup.updateMany({
        where: { id, userId: req.userId },
        data: { order: index },
      })
    )
  );
  res.json({ success: true });
});

// ---- Habits ----

router.get("/", async (req: any, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId },
    orderBy: { order: "asc" },
  });
  res.json(habits);
});

router.post("/", async (req: any, res) => {
  const { name, category, color, groupId } = req.body;
  const maxOrder = await prisma.habit.findFirst({
    where: { userId: req.userId, groupId: groupId || null },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const habit = await prisma.habit.create({
    data: {
      userId: req.userId,
      name,
      category: category || "general",
      color: color || "#6366f1",
      groupId: groupId || null,
      order: (maxOrder?.order ?? -1) + 1,
    },
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
  await prisma.completion.deleteMany({ where: { habitId: req.params.id } });
  await prisma.habit.deleteMany({
    where: { id: req.params.id, userId: req.userId },
  });
  res.json({ success: true });
});

router.put("/reorder/:groupId", async (req: any, res) => {
  const { habitIds }: { habitIds: string[] } = req.body;
  await Promise.all(
    habitIds.map((id, index) =>
      prisma.habit.updateMany({
        where: { id, userId: req.userId },
        data: { order: index },
      })
    )
  );
  res.json({ success: true });
});

export default router;
