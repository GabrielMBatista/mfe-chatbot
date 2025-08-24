import { NextApiRequest, NextApiResponse } from "next";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

const PrismaPkg = eval("require")("@prisma/client") as any;
const prisma: PrismaClientType =
  (global as any).__prisma || new PrismaPkg.PrismaClient();
if (process.env.NODE_ENV !== "production") {
  (global as any).__prisma = prisma;
}

const PROFILE_ID = process.env.PUBLIC_PROFILE_ID || "public";
const ALLOW_LOCALHOST = process.env.NEXT_PUBLIC_ALLOW_CORS_LOCALHOST === "true";
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/([a-zA-Z0-9-]+\.)*gabrielmarquesbatista\.com$/,
  /^https?:\/\/([a-zA-Z0-9-]+\.)*shell-frontend-beta\.vercel\.app$/,
  /^https?:\/\/mfe-chatbot\.vercel\.app$/,
];

function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin || "";
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
    origin
  );
  const isAllowedOrigin = ALLOWED_ORIGIN_PATTERNS.some((pattern) =>
    pattern.test(origin)
  );

  if ((ALLOW_LOCALHOST && isLocalhost) || isAllowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return true;
    }
  }
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return;

  const { method } = req;

  if (method === "GET") {
    const profile = await prisma.assistantProfile.findUnique({
      where: { id: PROFILE_ID },
    });
    return res.status(200).json(profile || null);
  }

  if (method === "POST") {
    const exists = await prisma.assistantProfile.findUnique({
      where: { id: PROFILE_ID },
    });
    if (exists)
      return res.status(409).json({ error: "Profile already exists" });

    const { name, personality, avatarUrl, avatarBase64, model } = req.body;

    const profile = await prisma.assistantProfile.create({
      data: {
        id: PROFILE_ID,
        name,
        personality,
        avatarUrl,
        avatarBase64,
        model,
      },
    });

    return res.status(201).json(profile);
  }

  if (method === "PUT") {
    const { name, personality, avatarUrl, avatarBase64, model } = req.body;

    const updated = await prisma.assistantProfile.upsert({
      where: { id: PROFILE_ID },
      update: { name, personality, avatarUrl, avatarBase64, model },
      create: {
        id: PROFILE_ID,
        name,
        personality,
        avatarUrl,
        avatarBase64,
        model,
      },
    });

    return res.status(200).json(updated);
  }

  return res.status(405).end();
}
