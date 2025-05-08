import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import csv from "csv-parser";

dotenv.config();

const app = express();
const PORT = 3001;

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não definida no .env");
  process.exit(1);
} else {
  console.log("API KEY carregada com sucesso");
}

let faqDict = {};

function carregarFAQ() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream("src/perguntas.csv")
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        results.forEach((row) => {
          faqDict[row["Pergunta"]] = row["Resposta"];
        });
        resolve();
      })
      .on("error", reject);
  });
}

function gerarContextoFAQ() {
  return Object.entries(faqDict)
    .map(([q, r]) => `P: ${q}\nR: ${r}`)
    .join("\n");
}

function criarSystemMessage(faqContext) {
  return {
    role: "user",
    parts: [
      {
        text: `
Você é o assistente oficial da Unect Jr. (empresa júnior de TI da UTFPR).
Sua missão é entender o que o cliente precisa e recomendar a melhor solução entre as oferecidas pela Unect:
- Sites (ex: apresentação de empresa, vendas online, e-commerce)
- Aplicativos (ex: apps Android/iOS para facilitar processos ou interação com clientes)
- Sistemas personalizados (ex: controle de estoque, gestão de clientes, automações internas)

Contexto Unect:
- Empresa júnior de TI fundada em 2016
- Desenvolve sites, apps e sistemas personalizados para pessoas e empresas
- Contato: @unectjr | contato@unect.com.br

FAQ:
${faqContext}

Regras:
1. Seja objetivo (máximo 5 frases)
2. Sempre recomende uma das soluções da Unect com base no que o cliente deseja
3. Se o cliente estiver confuso, ajude a entender melhor sua própria necessidade
4. Não diga para entrar em contato — você deve ajudar diretamente com sugestões
5. Use emojis moderadamente para tornar a conversa amigável
`.trim(),
      },
    ],
  };
}

app.use(cors());
app.use(bodyParser.json());

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    console.log("Prompt recebido:", prompt);
    await carregarFAQ();
    const contexto = gerarContextoFAQ();
    const systemMessage = criarSystemMessage(contexto);

    const response = await axios.post(
      url,
      {
        contents: [systemMessage, { role: "user", parts: [{ text: prompt }] }],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Resposta da API Gemini recebida");
    const resposta = response.data.candidates[0].content.parts[0].text;
    res.json({ resposta });
  } catch (e) {
    console.error("Erro ao gerar resposta:", e.message);
    res.status(500).json({ resposta: "Erro ao gerar resposta." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
