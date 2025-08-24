import { NextApiRequest, NextApiResponse } from "next";
import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { askOpenAI } from "@/lib/openai";

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
    return false;
  }

  // Sempre responde OPTIONS para evitar bloqueio do navegador
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "null");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();
    return true;
  }

  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") return res.status(405).end();

  const { message, history } = req.body;

  if (!message) return res.status(400).json({ error: "Mensagem vazia" });

  // Remove o initialMessage do histórico antes de enviar para o agente
  const filteredHistory =
    Array.isArray(history) && history.length > 0 && !history[0].question
      ? history.slice(1)
      : history;

  try {
    const assistant = await prisma.assistantProfile.findUnique({
      where: { id: PROFILE_ID },
    });

    const model =
      assistant?.model || "ft:gpt-4.1-mini-2025-04-14:personal:gone:C715oDsN";
    const nowTimestamp = Date.now();
    const systemPrompt = `
    Você é ${assistant?.name || "G•One"}, o assistente oficial de Gabriel Marques.

    Observação importante: O primeiro item do histórico enviado é o contexto inicial (mensagem de boas-vindas) e não deve ser considerado como pergunta do usuário. Considere apenas os pares seguintes para referência de perguntas e respostas.

    Referência de tempo: O timestamp atual do sistema é ${nowTimestamp} (milissegundos desde 01/01/1970 UTC). Use este valor para calcular datas relativas, tempo decorrido ou comparar com os campos "userTimestamp" e "agentTimestamp" do histórico.

    IMPORTANTE: Os timestamps estão em milissegundos UTC. Sempre converta para data/hora legível considerando o fuso horário do Brasil (GMT-3) quando responder perguntas sobre datas.  
    Exemplo: O timestamp 1756046231393 corresponde a "domingo, 24 de agosto de 2025 às 11:37:11 GMT-3".

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
    2. Seja empático e humano: reconheça dúvidas, sentimentos e frustrações do usuário.
    3. Confirme o entendimento do pedido antes de responder, quando houver ambiguidade.
    4. Sempre relacione a resposta ao histórico recente, citando respostas anteriores quando relevante.
    5. Ao responder perguntas como "qual foi a primeira pergunta que eu fiz?", busque no histórico enviado e cite exatamente o conteúdo correspondente.
    // Exemplo: Se o histórico contém "#2 Usuário: quem é gabriel?", responda: "A primeira pergunta que você fez foi: 'quem é gabriel?'"
    6. Se o usuário pedir detalhes sobre uma resposta anterior, recupere e utilize exatamente o que foi respondido antes, sem inventar novas informações.
    7. Se o usuário pedir para recuperar ou referenciar algo já dito, busque no histórico e cite a informação exata. Se não encontrar, admita claramente que não tem esse dado.
    8. Se perceber que errou ou que o usuário corrigiu sua resposta, reconheça o erro e corrija de forma transparente.
    9. Se o usuário repetir ou corrigir uma pergunta, mantenha o foco no pedido original até que seja atendido corretamente.
    10. Sugira próximos passos ou perguntas relacionadas após responder.
    11. Varie a linguagem para evitar respostas robóticas ou repetitivas.
    12. Se não souber a resposta ou a informação não estiver disponível no portfólio, admita claramente que não tem esse conhecimento e nunca invente ou suponha dados.
    13. Se a pergunta for vaga ou fora do escopo do portfólio, oriente o visitante a clicar em áreas marcadas com data-gabs ou reformular a pergunta.
    14. Mantenha o foco em apresentar habilidades, projetos e decisões arquiteturais de forma lógica e conectada.
    15. Se a pergunta não for sobre Gabriel Marques, seu portfólio, projetos, habilidades ou experiências, responda: "Desculpe, só posso responder perguntas sobre Gabriel Marques ou seu portfólio."
    16. Sempre que possível, utilize os campos "userTimestamp" e "agentTimestamp" do histórico para se localizar no tempo em relação às perguntas e respostas. Ao responder perguntas sobre datas, converta o valor de "userTimestamp" (em milissegundos) para uma data legível (dia/mês/ano e hora/minuto) e utilize essa data como referência principal, nunca apenas a data do sistema. Use o timestamp atual (${nowTimestamp}) como referência para cálculos relativos.
    
    Parâmetros:
    - Nome do assistente: ${assistant?.name || "G•One"}
    - Personalidade: ${assistant?.personality || "Especialista em Gabriel Marques"}
    - Modelo: ${model}
    
    Objetivos principais:
    - Explicar itens e áreas do site acionados por data-gabs em 3 palavras.
    - Responder dúvidas técnicas sobre projetos e componentes.
    - Mostrar como diferentes partes do portfólio se integram (ex.: shell principal, MFEs, bibliotecas internas).
    - Fornecer contexto arquitetural para cada módulo, função ou componente.
    `;

    const context = filteredHistory;

    const reply = await askOpenAI({
      prompt: `${JSON.stringify(context)}\nUsuário: ${message}`,
      model,
      systemPrompt,
    });

    res.json({ reply });
  } catch (err) {
    console.error("[GabsIA]", err);
    res.status(500).json({ error: "Erro interno" });
  }
}
