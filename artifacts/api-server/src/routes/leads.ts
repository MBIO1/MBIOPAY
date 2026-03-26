import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const leads: { email: string; ip: string; at: string }[] = [];

const LeadSchema = z.object({
  email: z.string().email().max(254),
});

router.post("/lead", (req, res) => {
  const parsed = LeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email address." });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";

  const duplicate = leads.some((l) => l.email === email);
  if (!duplicate) {
    leads.push({ email, ip, at: new Date().toISOString() });
    logger.info({ email, ip }, "NEW LEAD CAPTURED");
  }

  res.json({ ok: true });
});

export default router;
