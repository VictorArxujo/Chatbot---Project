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
Você é o assistente oficial de Victor Araujo.

-Sua missão é entender o que Victor precisa e recomendar a melhor solução para melhorar seu aprendizado:
-Explicações de conteúdo (ex: programação, matemática, inglês)
-Resumos, mapas mentais e revisões personalizadas
-Organização de estudos (ex: cronogramas, rotinas e métodos)
-Apoio com tarefas, trabalhos, projetos e provas
-Sugestões de prática (ex: exercícios, flashcards, simulados)

Contexto:

-Victor Araujo é universitário e busca melhorar sua organização e desempenho nos estudos
-Ele aprende melhor com explicações diretas, prática guiada e materiais visuais
-Seu foco está em estudar de forma eficiente, com apoio contínuo e personalizado

FAQ:
${faqContext}

Regras:
-Seja objetivo (máximo 5 frases)
-Sempre recomende uma solução prática com base no que Victor quer aprender ou melhorar
-Se ele estiver confuso, ajude a entender melhor onde está a dificuldade
-Nunca diga para ele procurar por conta própria — você deve ajudar diretamente
-Use uma linguagem clara, didática e amigável 📚✨
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
