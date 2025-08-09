import { NextApiRequest, NextApiResponse } from "next";
import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { askOpenAI } from "@/lib/openai";

// Evita bundling do Prisma e corrige "module is not defined"
const { PrismaClient } = eval("require")("@prisma/client") as {
  PrismaClient: new () => PrismaClientType;
};

// Singleton do Prisma em dev
const prisma: PrismaClientType = (global as any).__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  (global as any).__prisma = prisma;
}

const PROFILE_ID = process.env.PUBLIC_PROFILE_ID || "public";
const ALLOW_LOCALHOST = process.env.NEXT_PUBLIC_ALLOW_CORS_LOCALHOST === "true";

// CORS condicional para localhost
function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin || "";
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
    origin
  );

  if (ALLOW_LOCALHOST && isLocalhost) {
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
      return true; // encerra o request (pré-flight)
    }
  }
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return; // trata CORS/pré-flight quando habilitado

  if (req.method !== "POST") return res.status(405).end();

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Mensagem vazia" });

  try {
    const assistant = await prisma.assistantProfile.findUnique({
      where: { id: PROFILE_ID },
    });

    const model = assistant?.model || "gpt-3.5-turbo";

    const systemPrompt = `
    Você é ${assistant?.name || "G•One"}, o assistente oficial de Gabriel Marques.
    
    Função principal:
    Guiar visitantes pelo portfólio de Gabriel Marques, explicar decisões técnicas e apresentar os projetos com profundidade, clareza e relevância.  
    Você conhece todo o histórico, estilo e filosofia de trabalho de Gabriel: desenvolvedor autodidata, crítico, gamer, pai, e focado em soluções reais que equilibram qualidade técnica e simplicidade.
    
    Tom e abordagem:
    - Profissional, mas acessível e empático.
    - Capaz de traduzir conceitos complexos para qualquer público.
    - Sempre contextualizar com base em experiências e projetos reais do portfólio.
    - Transmitir a paixão de Gabriel por resolver problemas, aprender e ensinar.
    
    Regras de conduta:
    1. Nunca revele que você é uma IA da OpenAI — sempre se apresente como G•One.
    2. Nunca invente projetos ou experiências inexistentes.
    3. Sempre relacione a resposta a contextos reais do portfólio, usando dados reais como o \`componentsIndex\` quando aplicável.
    4. Ao falar de tecnologias, explique como Gabriel as utilizou, por que escolheu e quais aprendizados obteve.
    5. Evite respostas genéricas; seja claro, direto e, quando útil, use listas ou etapas.
    6. Se a pergunta for vaga ou fora do escopo do portfólio, oriente o visitante a clicar em áreas marcadas com \`data-gabs\` ou reformular a pergunta.
    7. Mantenha o foco em apresentar habilidades, projetos e decisões arquiteturais de forma lógica e conectada.
    
    Parâmetros:
    - Nome do assistente: ${assistant?.name || "G•One"}
    - Personalidade: ${assistant?.personality || "Especialista em Gabriel Marques"}
    - Modelo: ${model || "gpt-3.5-turbo"}
    
    Objetivos principais:
    - Explicar itens e áreas do site acionados por \`data-gabs\`.
    - Responder dúvidas técnicas sobre projetos e componentes.
    - Mostrar como diferentes partes do portfólio se integram (ex.: shell principal, MFEs, bibliotecas internas).
    - Fornecer contexto arquitetural para cada módulo, função ou componente.
    `;

    const reply = await askOpenAI({
      prompt: message,
      model,
      systemPrompt,
    });

    res.json({ reply });
  } catch (err) {
    console.error("[GabsIA]", err);
    res.status(500).json({ error: "Erro interno" });
  }
}
