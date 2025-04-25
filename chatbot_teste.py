import os
import pandas as pd
from dotenv import load_dotenv
import requests

# Configurações iniciais
load_dotenv()

# Carrega dados do CSV
faq_data = pd.read_csv(r'C:\Users\Ghxstyzim\Desktop\CHATBOT_UNECT\perguntas_chatbot - Sheet1.csv')
faq_dict = dict(zip(faq_data['Pergunta'], faq_data['Resposta']))

# Cria contexto do FAQ
faq_context = "\n".join([f"P: {q}\nR: {r}" for q, r in faq_dict.items()])

# Configuração do sistema
system_message = {
    "role": "user",  # Gemini usa 'user' para contexto do sistema
    "parts": [{
        "text": (
            "Você é o assistente oficial da Unect Jr. (empresa júnior de TI da UTFPR).\n"
            "Sua missão é entender o que o cliente precisa e recomendar a melhor solução entre as oferecidas pela Unect:\n"
            "- Sites (ex: apresentação de empresa, vendas online, e-commerce)\n"
            "- Aplicativos (ex: apps Android/iOS para facilitar processos ou interação com clientes)\n"
            "- Sistemas personalizados (ex: controle de estoque, gestão de clientes, automações internas)\n\n"
            "Contexto Unect:\n"
            "- Empresa júnior de TI fundada em 2016\n"
            "- Desenvolve sites, apps e sistemas personalizados para pessoas e empresas\n"
            "- Contato: @unectjr | contato@unect.com.br\n\n"
            f"FAQ:\n{faq_context}\n\n"
            "Regras:\n"
            "1. Seja objetivo (máximo 6 frases)\n"
            "2. Sempre recomende uma das soluções da Unect com base no que o cliente deseja\n"
            "3. Se o cliente estiver confuso, ajude a entender melhor sua própria necessidade\n"
            "4. Não diga para entrar em contato — você deve ajudar diretamente com sugestões\n"
            "5. Use emojis moderadamente para tornar a conversa amigável"
        )
    }]
}

# Configuração da API
API_KEY = os.getenv('GEMINI_API_KEY') # DECLARANDO A CHAVE DA API NO .ENV

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"
headers = {"Content-Type": "application/json"}

def gerar_resposta(prompt):
    try:
        data = {
            "contents": [
                system_message,
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ]
        }
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    
    except Exception as e:
        return f"Erro: {str(e)}"

def main():
    print("\n" + "="*50)
    print("  🤖 Olá! Sou o assistente virtual da Unect Jr.")
    print("  Posso ajudar com informações sobre projetos, contato e serviços!")
    print("  Digite 'sair' a qualquer momento para encerrar.")
    print("="*50 + "\n")

    while True:
        user_input = input("Você: ").strip()
        
        if user_input.lower() in ["sair", "exit", "tchau", "até mais"]:
            print("\nAté mais! 👋 Qualquer dúvida, nos siga no @unectjr!")
            break

        resposta = gerar_resposta(user_input)
        print(f"\nAssistente: {resposta}\n")

if __name__ == "__main__":
    main()