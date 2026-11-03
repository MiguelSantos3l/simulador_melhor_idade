# 💬 Simulador de Mensagens – Treino para a Melhor Idade

Aplicação web educativa feita para um **projeto de extensão universitário de inclusão digital**.
O objetivo é ensinar pessoas idosas a usar aplicativos de mensagens (como o WhatsApp) **com segurança**,
treinando num ambiente falso, parecido com o aplicativo de verdade, onde **não existe risco de errar**:
nenhuma mensagem, áudio, foto ou chamada é enviada de verdade.

> ⚠️ Este projeto **não tem ligação** com o WhatsApp nem com a Meta. Ele só imita o visual para fins de
> ensino e **não usa o logotipo oficial**: todos os ícones são genéricos.

---

## ✨ O que a aplicação faz

### Telas parecidas com o aplicativo real
- **Lista de conversas** com topo verde, abas *Conversas / Status / Chamadas*, foto redonda (iniciais coloridas),
  prévia da última mensagem, horário e bolinha verde de mensagens não lidas.
- **Conversa** com seta de voltar, foto, nome, "online", botões de chamada de vídeo e de voz, balões com horário
  e os tiques (✓ enviado, ✓✓ cinza entregue, ✓✓ azul lido).
- Barra de digitação com emoji, campo "Mensagem", clipe, câmera e botão verde que vira **microfone**
  (campo vazio) ou **enviar** (com texto).
- Faixa fixa no topo: **"MODO TREINO – nada aqui é enviado de verdade"**.

### Funções simuladas
| Função | Como funciona |
|---|---|
| Enviar texto | O balão aparece, os tiques vão de ✓ a ✓✓ azul em 2 segundos, aparece "digitando..." e o contato responde. |
| Gravar áudio | Segurar o botão do microfone (mouse ou dedo) mostra "Gravando... 0:03". Ao soltar, aparece um balão de áudio com play e onda animada. |
| Enviar foto | O clipe abre "Câmera / Galeria"; ao escolher, aparece uma foto de exemplo. |
| Chamadas | Tela cheia com foto do contato, "Chamando...", cronômetro depois que atendem e botão vermelho de desligar. |
| Emojis | Painel com 20 emojis comuns. |
| Contatos fictícios | Filha Ana, Neto Pedro, Grupo da Família, Posto de Saúde e Número desconhecido. |

### Missões guiadas
1. Mande um "Bom dia" para sua filha Ana
2. Envie um áudio para o Neto Pedro
3. Envie uma foto para o Grupo da Família
4. Faça uma chamada de vídeo para a Filha Ana
5. Descubra o golpe

Durante a missão aparece um **balão de dica** no rodapé com o próximo passo e um **contorno amarelo pulsante**
no botão que a pessoa deve tocar. A dica se adapta: se a pessoa entrar na conversa errada, a dica explica como voltar.
Ao concluir, aparece uma tela de **parabéns com confete**.

### Modo "É golpe?"
O "Número desconhecido" manda mensagens típicas de golpe (falso filho pedindo Pix, link de prêmio, falso
funcionário do banco). Ao **tocar e segurar** uma mensagem aparecem as opções *Responder*, *Bloquear* e *Denunciar*.
- **Bloquear/Denunciar:** mensagem de parabéns explicando os sinais do golpe.
- **Responder ou tocar no link:** aviso amigável (sem assustar) explicando o golpe e o que fazer na vida real.

### Quiz final e resultados
- 8 perguntas de múltipla escolha com resposta na hora (verde/vermelho, ✔/✘ e explicação curta).
- Placar "Você acertou X de 8!" e botão "Fazer de novo".
- Campo opcional para o primeiro nome.
- Tela **"Resultados da oficina"** (botão discreto no rodapé da tela inicial) com nome, acertos e horário de
  quem fez o quiz naquela sessão, para o aplicador anotar.

### Acessibilidade
- Letra de no mínimo 18px e botões de no mínimo 48px, com alto contraste.
- Botões **A+ / A-** para aumentar e diminuir a letra (a escolha fica salva no aparelho).
- Botão **🔊 Ouvir** nas dicas, avisos e quiz, que lê o texto em voz alta (Web Speech API, voz pt-BR).
- Linguagem simples e frases curtas.
- Nenhuma ação tem tempo limite: a pessoa pode demorar o quanto quiser.
- Respeita a opção do sistema "reduzir movimento".

---

## 🛠️ Tecnologias usadas

- **HTML5** – estrutura das telas
- **CSS3** – visual, layout responsivo (mobile-first), animações
- **JavaScript puro** (sem frameworks) – toda a lógica
- **Web Speech API** (`speechSynthesis`) – leitura em voz alta
- **Pointer Events** – "segurar o botão" funciona com mouse e com toque
- **sessionStorage / localStorage** – guardam o progresso, os resultados e o tamanho da letra no próprio navegador

Não há backend, banco de dados nem bibliotecas externas. Nenhum dado sai do aparelho.

---

## 📁 Estrutura de arquivos

```
simulador_whatsapp/
├── index.html      → estrutura de todas as telas
├── style.css       → aparência (cores, tamanhos, animações)
├── script.js       → lógica (mensagens, missões, golpe, quiz...)
├── README.md       → este arquivo
└── img/
    ├── icone.svg     → ícone da aba do navegador
    ├── paisagem.svg  → foto de exemplo (Câmera)
    └── flores.svg    → foto de exemplo (Galeria)
```

O `script.js` está dividido em seções numeradas e comentadas (utilitários, dados, estado, navegação, conversa,
áudio, chamadas, golpe, missões, quiz, acessibilidade...). Para mudar algo:
- **Contatos e mensagens iniciais:** função `criarConversasIniciais()`
- **Respostas automáticas:** constante `RESPOSTAS`
- **Missões e dicas:** constante `MISSOES`
- **Perguntas do quiz:** constante `PERGUNTAS`
- **Textos dos avisos de golpe:** constante `AVISOS`
- **Cores:** variáveis no começo do `style.css` (`:root`)

---

## ▶️ Como rodar

### Opção 1 – Abrir direto (mais fácil)
1. Baixe ou copie a pasta do projeto.
2. Dê dois cliques no arquivo **`index.html`**. Ele abre no navegador e já funciona.

### Opção 2 – Com um servidor local (opcional)
Útil para testar no celular pela mesma rede Wi-Fi.
- Com XAMPP: coloque a pasta em `htdocs` e acesse `http://localhost/simulador_whatsapp/`
- Com Python: na pasta do projeto, rode `python -m http.server 8000` e acesse `http://localhost:8000`
- Com VS Code: use a extensão **Live Server** e clique em "Go Live"

> 💡 A leitura em voz alta depende das vozes instaladas no aparelho. Chrome, Edge e a maioria dos celulares
> Android e iPhone têm voz em português. Se não houver, o aplicativo avisa.

---

## 🌐 Como publicar no GitHub Pages

1. Crie uma conta em [github.com](https://github.com) (se ainda não tiver).
2. Clique em **New repository**, dê um nome (ex.: `simulador-mensagens`), deixe como **Public** e crie.
3. Envie os arquivos:
   - Pelo site: clique em **Add file → Upload files**, arraste `index.html`, `style.css`, `script.js`,
     `README.md` e a pasta `img`, e clique em **Commit changes**.
   - Ou pelo terminal:
     ```bash
     git init
     git add .
     git commit -m "Simulador de Mensagens"
     git branch -M main
     git remote add origin https://github.com/SEU-USUARIO/simulador-mensagens.git
     git push -u origin main
     ```
4. No repositório, vá em **Settings → Pages**.
5. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
6. Em **Branch**, escolha `main` e a pasta `/ (root)`. Clique em **Save**.
7. Aguarde 1 ou 2 minutos. O endereço aparece no topo da página, algo como:
   `https://SEU-USUARIO.github.io/simulador-mensagens/`

Pronto! É só compartilhar o link (ou gerar um QR Code) com os participantes da oficina.

> Todos os caminhos do projeto são relativos (`img/...`, `style.css`), por isso funcionam tanto abrindo o arquivo
> no computador quanto no GitHub Pages.

---

## 👩‍🏫 Sugestão de uso na oficina

1. Mostre a faixa "MODO TREINO" e explique que nada é enviado de verdade.
2. Ensine a usar **A+** (letra maior) e **🔊 Ouvir**.
3. Deixe cada participante fazer as **missões 1 a 5** no seu ritmo.
4. Converse em grupo sobre os **sinais de golpe** depois da missão 5.
5. Aplique o **quiz final** (cada pessoa digita o primeiro nome).
6. Abra **"Resultados da oficina"** (rodapé da tela inicial) e anote as pontuações.
   Os resultados ficam guardados só enquanto a aba do navegador estiver aberta.

---

## 📄 Licença

Projeto educativo, de uso livre para fins de ensino e extensão universitária.
