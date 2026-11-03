/* =========================================================
   Simulador de Mensagens – Treino para a Melhor Idade
   script.js – toda a lógica da aplicação

   Organização deste arquivo:
     1.  Utilitários (funções pequenas de apoio)
     2.  Dados: contatos, respostas automáticas, emojis
     3.  Estado da aplicação (o que está acontecendo agora)
     4.  Navegação entre telas
     5.  Lista de conversas e abas
     6.  Conversa: mostrar mensagens
     7.  Conversa: enviar texto, emojis, fotos
     8.  Gravação de áudio (segurar o botão)
     9.  Chamadas de voz e vídeo
     10. Modo "É golpe?"
     11. Missões guiadas e balão de dica
     12. Parabéns e confete
     13. Quiz final
     14. Resultados da oficina
     15. Acessibilidade: tamanho da letra e leitura em voz alta
     16. Avisos (janela e aviso rápido)
     17. Ligar os eventos (cliques, toques, teclado)
     18. Início da aplicação
   ========================================================= */

'use strict';

/* =========================================================
   1. UTILITÁRIOS
   ========================================================= */

// Atalho para buscar um elemento na página
const $ = (seletor) => document.querySelector(seletor);

// Evita que textos digitados virem código HTML (segurança)
function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Deixa o texto em minúsculas e sem acentos, para comparar (ex.: "Bom Dia!" -> "bom dia!")
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Hora no formato 09:41
function formatarHora(data) {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Segundos no formato 0:05
function formatarDuracao(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

// Escolhe um item qualquer de uma lista
function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Lê um dado salvo no navegador (sessionStorage ou localStorage).
// Se o navegador bloquear o armazenamento, devolve o valor padrão.
function lerDado(tipo, chave, padrao) {
  try {
    const bruto = window[tipo].getItem(chave);
    return bruto === null ? padrao : JSON.parse(bruto);
  } catch (erro) {
    return padrao;
  }
}

// Salva um dado no navegador. Se não der, a aplicação continua funcionando só na memória.
function salvarDado(tipo, chave, valor) {
  try {
    window[tipo].setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    /* sem armazenamento disponível: tudo bem */
  }
}

/* =========================================================
   2. DADOS
   ========================================================= */

// Contador para dar um número único a cada mensagem
let proximoIdMensagem = 1;

// Cria uma mensagem. "minutosAtras" serve para as mensagens antigas da conversa.
function novaMensagem(dados, minutosAtras = 0) {
  const quando = new Date(Date.now() - minutosAtras * 60000);
  return {
    id: proximoIdMensagem++,
    tipo: 'texto',
    hora: formatarHora(quando),
    momento: quando.getTime(),
    ...dados
  };
}

// Atualiza o "momento da última mensagem" do contato (usado para ordenar a lista)
function atualizarAtividade(contato) {
  const ultima = contato.mensagens[contato.mensagens.length - 1];
  contato.ultimaAtividade = ultima ? ultima.momento : 0;
}

// Cria os contatos fictícios com as conversas do começo
function criarConversasIniciais() {
  const conversas = {
    ana: {
      id: 'ana',
      nome: 'Filha Ana',
      iniciais: 'A',
      cor: '#C2185B',
      recado: 'online',
      naoLidas: 2,
      mensagens: [
        novaMensagem({ de: 'eu', texto: 'Oi, filha! Tudo bem?', status: 'lido' }, 65),
        novaMensagem({ de: 'contato', texto: 'Oi! Tudo ótimo por aqui 😊' }, 22),
        novaMensagem({ de: 'contato', texto: 'Quando puder, me manda uma mensagem! ❤️' }, 21)
      ]
    },
    pedro: {
      id: 'pedro',
      nome: 'Neto Pedro',
      iniciais: 'P',
      cor: '#3949AB',
      recado: 'online',
      naoLidas: 0,
      mensagens: [
        novaMensagem({ de: 'contato', texto: 'Oi! Domingo vou te visitar 😄' }, 95),
        novaMensagem({ de: 'eu', texto: 'Oba! Vou fazer aquele bolo 🎂', status: 'lido' }, 90)
      ]
    },
    familia: {
      id: 'familia',
      nome: 'Grupo da Família',
      iniciais: 'GF',
      cor: '#EF6C00',
      recado: 'Ana, Pedro, Tia Rosa e você',
      grupo: true,
      naoLidas: 2,
      mensagens: [
        novaMensagem({ de: 'contato', autor: 'Tia Rosa', texto: 'Bom dia, família! 🌻' }, 50),
        novaMensagem({ de: 'contato', autor: 'Pedro', texto: 'Bom dia, tia! ☀️' }, 45)
      ]
    },
    posto: {
      id: 'posto',
      nome: 'Posto de Saúde',
      iniciais: 'PS',
      cor: '#00897B',
      recado: 'conta comercial',
      naoLidas: 0,
      mensagens: [
        novaMensagem({ de: 'contato', texto: 'Olá! A campanha de vacinação contra a gripe começou. 💉 Traga seu cartão do SUS e um documento com foto.' }, 180)
      ]
    },
    desconhecido: {
      id: 'desconhecido',
      nome: 'Número desconhecido',
      iniciais: '?',
      cor: '#757575',
      recado: 'não está nos seus contatos',
      naoLidas: 4,
      mensagens: [
        // "golpe" marca as mensagens suspeitas (podem ser tocadas e seguradas)
        novaMensagem({ de: 'contato', golpe: 'numero', texto: 'Oi mãe, troquei de número! 😥 Salva esse aqui.' }, 9),
        novaMensagem({ de: 'contato', golpe: 'pix', texto: 'Mãe, preciso de um Pix URGENTE de R$ 800. Te devolvo amanhã. Não conta pra ninguém!' }, 8),
        novaMensagem({ de: 'contato', golpe: 'premio', texto: '🎁 PARABÉNS! Você ganhou um prêmio de R$ 5.000! Toque no link para receber hoje:', link: 'www.premio-facil-agora.xyz' }, 6),
        novaMensagem({ de: 'contato', golpe: 'banco', texto: 'Aqui é do seu banco. Sua conta foi BLOQUEADA. 🔒 Me mande o código que chegou por SMS para liberar.' }, 5)
      ]
    }
  };

  // Campos comuns a todos os contatos
  Object.values(conversas).forEach((contato) => {
    contato.digitando = 0;          // quantas respostas estão sendo "digitadas"
    contato.quemDigita = '';        // no grupo: quem está digitando
    contato.contadorRespostas = 0;  // para variar as respostas
    contato.bloqueado = false;
    atualizarAtividade(contato);
  });

  return conversas;
}

// Respostas automáticas dos contatos
const RESPOSTAS = {
  ana: {
    bomDia: ['Bom dia! ☀️ Que alegria receber sua mensagem logo cedo! Beijos ❤️'],
    texto: ['Que bom falar com você! 😊', 'Entendi! Mais tarde eu te ligo, tá bom? 😘', 'Você está ficando craque no celular! 👏'],
    audio: ['Ouvi seu áudio! Que bom ouvir sua voz 🥰'],
    foto: ['Que foto linda! 😍']
  },
  pedro: {
    bomDia: ['Bom dia! ☀️ Dormiu bem?'],
    texto: ['Oi! Tudo bem? 😄', 'Haha, adorei! 😂', 'Saudade! Domingo eu passo aí 🤗'],
    audio: ['Recebi seu áudio! Ficou ótimo! 👍 Você aprendeu rapidinho!'],
    foto: ['Que legal essa foto! 📸']
  },
  familia: {
    bomDia: [{ autor: 'Tia Rosa', texto: 'Bom dia! Que nosso dia seja abençoado 🌻' }],
    texto: [
      { autor: 'Ana', texto: 'Oi! ❤️' },
      { autor: 'Tia Rosa', texto: 'Que bom ver você por aqui! 🥰' },
      { autor: 'Pedro', texto: 'Haha 😂👍' }
    ],
    audio: [{ autor: 'Ana', texto: 'Que bom ouvir sua voz! 🥰' }],
    foto: [
      { autor: 'Tia Rosa', texto: 'Que foto linda! 😍 Manda mais!' },
      { autor: 'Pedro', texto: 'Que lugar bonito! 📸' }
    ]
  },
  posto: {
    padrao: ['Olá! Esta é uma mensagem automática do Posto de Saúde. 🏥 Atendimento de segunda a sexta, das 7h às 17h. Em caso de urgência, ligue 192.']
  }
};

// Cor do nome de cada pessoa dentro do grupo
const CORES_AUTORES = {
  'Tia Rosa': '#AD1457',
  'Ana': '#1565C0',
  'Pedro': '#6A1B9A'
};

// Os 20 emojis do painel
const EMOJIS = ['😀', '😂', '😊', '😍', '🥰', '😘', '😢', '😮', '🤗', '👋',
                '👍', '👏', '🙏', '❤️', '🌻', '🌹', '☀️', '☕', '🎂', '🎉'];

// Fotos de exemplo (ficam na pasta /img)
const FOTOS = {
  camera: { imagem: 'img/paisagem.svg', alt: 'Foto de exemplo: paisagem com montanhas, sol e um lago' },
  galeria: { imagem: 'img/flores.svg', alt: 'Foto de exemplo: jardim com flores coloridas' }
};

/* =========================================================
   3. ESTADO DA APLICAÇÃO
   ========================================================= */

const contatos = {}; // preenchido em iniciar()

const TAMANHOS_FONTE = [18, 20, 22, 24, 26];

const estado = {
  telaAtual: 'inicio',
  abaAtual: 'conversas',
  contatoAberto: null,       // id do contato da conversa aberta
  emojisAberto: false,
  anexosAberto: false,
  menuMensagemAberto: false,
  modalAberto: false,
  aoFecharModal: null,
  acaoParabens: null,

  missaoAtual: null,         // número da missão em andamento (0 a 4) ou null
  missaoFeita: false,        // a ação principal foi feita (esperando a resposta)
  missaoErrou: false,        // na missão do golpe: a pessoa respondeu ou tocou no link
  missoesConcluidas: lerMissoesSalvas(),

  gravando: false,
  inicioGravacao: 0,
  intervaloGravacao: null,

  chamada: null,             // dados da chamada em andamento
  historicoChamadas: [],

  indiceFonte: lerDado('localStorage', 'indiceFonte', 0),
  resultados: lerDado('sessionStorage', 'resultadosOficina', [])
};

// Confere se o progresso salvo das missões é válido
function lerMissoesSalvas() {
  const salvas = lerDado('sessionStorage', 'missoesConcluidas', null);
  if (Array.isArray(salvas) && salvas.length === 5) return salvas;
  return [false, false, false, false, false];
}

function contatoAtual() {
  return estado.contatoAberto ? contatos[estado.contatoAberto] : null;
}

function conversaEstaAberta(contato) {
  return estado.telaAtual === 'chat' && estado.contatoAberto === contato.id;
}

/* =========================================================
   4. NAVEGAÇÃO ENTRE TELAS
   ========================================================= */

// Mostra uma tela e esconde as outras. nome: inicio, conversas, chat, quiz-nome, quiz, quiz-fim, resultados
function mostrarTela(nome) {
  pararFala();
  document.querySelectorAll('.tela').forEach((tela) => {
    tela.classList.toggle('ativa', tela.id === 'tela-' + nome);
  });
  estado.telaAtual = nome;

  if (nome === 'inicio') renderizarMissoes();
  if (nome === 'conversas') {
    trocarAba(estado.abaAtual);
    renderizarListaConversas();
  }
  if (nome === 'chat') renderizarChat();
  if (nome === 'quiz-nome') $('#campo-nome').value = '';
  if (nome === 'resultados') renderizarResultados();

  // Volta para o topo nas telas que rolam
  const tela = $('#tela-' + nome);
  if (tela && tela.classList.contains('tela-conteudo')) tela.scrollTop = 0;

  atualizarDica();
}

/* =========================================================
   5. LISTA DE CONVERSAS E ABAS
   ========================================================= */

// Foto redonda com as iniciais coloridas
function htmlAvatar(contato, classeExtra = '') {
  return `<span class="avatar ${classeExtra}" style="background:${contato.cor}" aria-hidden="true">${escaparHTML(contato.iniciais)}</span>`;
}

// Tiques: ✓ enviado, ✓✓ cinza entregue, ✓✓ azul lido
function htmlTique(status) {
  if (status === 'lido') return '<span class="tique lido" aria-label="lida">✓✓</span>';
  if (status === 'entregue') return '<span class="tique" aria-label="entregue">✓✓</span>';
  return '<span class="tique" aria-label="enviada">✓</span>';
}

// Texto curtinho da última mensagem, mostrado na lista
function htmlPrevia(mensagem) {
  if (!mensagem) return '';
  let texto;
  if (mensagem.tipo === 'audio') texto = `🎤 Áudio (${formatarDuracao(mensagem.duracao)})`;
  else if (mensagem.tipo === 'foto') texto = '📷 Foto';
  else texto = mensagem.texto;

  if (mensagem.autor) texto = `${mensagem.autor}: ${texto}`;
  if (mensagem.de === 'eu' && mensagem.tipo !== 'sistema') {
    return htmlTique(mensagem.status) + ' ' + escaparHTML(texto);
  }
  return escaparHTML(texto);
}

function renderizarListaConversas() {
  // A conversa com mensagem mais recente fica em cima
  const ordenados = Object.values(contatos).sort((a, b) => b.ultimaAtividade - a.ultimaAtividade);

  $('#lista-conversas').innerHTML = ordenados.map((contato) => {
    const ultima = contato.mensagens[contato.mensagens.length - 1];

    const previa = contato.digitando > 0
      ? `<span class="conversa-previa digitando">${contato.grupo && contato.quemDigita ? escaparHTML(contato.quemDigita) + ' está ' : ''}digitando...</span>`
      : `<span class="conversa-previa">${htmlPrevia(ultima)}</span>`;

    const contador = contato.naoLidas > 0
      ? `<span class="contador" aria-label="${contato.naoLidas} mensagens não lidas">${contato.naoLidas}</span>`
      : '';

    return `
      <li>
        <button type="button" class="item-conversa${contato.naoLidas > 0 ? ' tem-naolidas' : ''}" data-id="${contato.id}">
          ${htmlAvatar(contato)}
          <span class="conversa-meio">
            <span class="conversa-nome">${escaparHTML(contato.nome)}</span>
            ${previa}
          </span>
          <span class="conversa-lado">
            <span class="conversa-hora">${ultima ? ultima.hora : ''}</span>
            ${contador}
          </span>
        </button>
      </li>`;
  }).join('');

  atualizarDica(); // a lista foi redesenhada: refaz o destaque amarelo
}

// Troca entre as abas Conversas / Status / Chamadas
function trocarAba(aba) {
  estado.abaAtual = aba;
  document.querySelectorAll('.aba').forEach((botao) => {
    const ativa = botao.dataset.aba === aba;
    botao.classList.toggle('ativa', ativa);
    botao.setAttribute('aria-selected', ativa ? 'true' : 'false');
  });
  document.querySelectorAll('.painel-aba').forEach((painel) => {
    painel.classList.toggle('ativa', painel.id === 'painel-' + aba);
  });
  if (aba === 'chamadas') renderizarChamadas();
  atualizarDica();
}

// Histórico de chamadas feitas no treino
function renderizarChamadas() {
  const lista = $('#lista-chamadas');
  if (estado.historicoChamadas.length === 0) {
    lista.innerHTML = '<li class="vazio">Nenhuma chamada ainda. Abra uma conversa e toque no 📞 ou no 📹 para treinar.</li>';
    return;
  }
  lista.innerHTML = estado.historicoChamadas.map((chamada) => {
    const contato = contatos[chamada.contatoId];
    const detalhe = chamada.atendida ? formatarDuracao(chamada.segundos) : 'não atendida';
    const icone = chamada.tipo === 'video' ? '#i-video' : '#i-telefone';
    return `
      <li class="item-chamada">
        ${htmlAvatar(contato)}
        <span class="conversa-meio">
          <span class="conversa-nome">${escaparHTML(contato.nome)}</span>
          <span class="conversa-previa">
            <span class="${chamada.atendida ? 'seta-ok' : 'seta-perdida'}" aria-hidden="true">↗</span>
            Hoje, ${chamada.hora} · ${detalhe}
          </span>
        </span>
        <svg class="ico" aria-label="${chamada.tipo === 'video' ? 'Chamada de vídeo' : 'Chamada de voz'}"><use href="${icone}"></use></svg>
      </li>`;
  }).join('');
}

/* =========================================================
   6. CONVERSA: MOSTRAR MENSAGENS
   ========================================================= */

function abrirConversa(id) {
  estado.contatoAberto = id;
  contatos[id].naoLidas = 0;
  fecharPaineis();
  fecharMenuMensagem();
  $('#campo-mensagem').value = '';
  mostrarTela('chat');
  registrarAcao('abriu-conversa', { contatoId: id });
}

function voltarParaLista() {
  if (estado.gravando) return;
  fecharPaineis();
  fecharMenuMensagem();
  estado.contatoAberto = null;
  mostrarTela('conversas');
}

// Desenha a conversa inteira
function renderizarChat() {
  const contato = contatoAtual();
  if (!contato) return;

  $('#chat-avatar').innerHTML = htmlAvatar(contato);
  $('#chat-nome').textContent = contato.nome;
  atualizarStatusTopo();

  $('#lista-mensagens').innerHTML =
    '<div class="msg-sistema">🎓 Conversa de treino. Pode testar à vontade!</div>' +
    contato.mensagens.map((m) => htmlMensagem(m)).join('');

  // Se o contato foi bloqueado, troca a barra de digitar por um aviso
  $('#barra-inferior').hidden = contato.bloqueado;
  $('#aviso-bloqueado').hidden = !contato.bloqueado;
  if (contato.bloqueado) fecharPaineis();

  atualizarBotaoPrincipal();
  rolarParaFim();
  atualizarDica();
}

// Mostra "online" ou "digitando..." no topo da conversa
function atualizarStatusTopo() {
  const contato = contatoAtual();
  if (!contato) return;
  const status = $('#chat-status');
  if (contato.digitando > 0) {
    status.textContent = contato.grupo && contato.quemDigita
      ? `${contato.quemDigita} está digitando...`
      : 'digitando...';
    status.classList.add('digitando');
  } else {
    status.textContent = contato.recado;
    status.classList.remove('digitando');
  }
}

// HTML de um balão de mensagem
function htmlMensagem(m) {
  if (m.tipo === 'sistema') {
    return `<div class="msg-sistema" id="msg-${m.id}">${escaparHTML(m.texto)}</div>`;
  }

  const enviada = m.de === 'eu';
  let conteudo = enviada ? '<span class="so-leitor">Você:</span>' : '';

  if (m.autor) {
    conteudo += `<span class="autor" style="color:${CORES_AUTORES[m.autor] || '#00695C'}">${escaparHTML(m.autor)}</span>`;
  }

  if (m.tipo === 'texto') {
    conteudo += `<p>${escaparHTML(m.texto)}</p>`;
    if (m.link) {
      conteudo += `<button type="button" class="link-golpe" data-acao="link">🔗 ${escaparHTML(m.link)}</button>`;
    }
  } else if (m.tipo === 'audio') {
    conteudo += htmlAudio(m);
  } else if (m.tipo === 'foto') {
    conteudo += `<img class="foto-msg" src="${m.imagem}" alt="${escaparHTML(m.alt)}">`;
  }

  const tique = enviada ? htmlTique(m.status) : '';
  const golpe = m.golpe ? ` data-golpe="${m.golpe}"` : '';

  return `
    <div class="linha-msg ${enviada ? 'enviada' : 'recebida'}" id="msg-${m.id}">
      <div class="balao"${golpe}>
        ${conteudo}
        <span class="balao-info"><span class="hora">${m.hora}</span>${tique}</span>
      </div>
    </div>`;
}

// HTML do balão de áudio: botão play + barrinhas da "onda"
function htmlAudio(m) {
  const barras = m.ondas.map((altura) => `<span style="height:${altura}%"></span>`).join('');
  return `
    <div class="audio" data-duracao="${m.duracao}">
      <button type="button" class="botao-play" data-acao="play" aria-label="Ouvir o áudio">
        <svg class="ico"><use href="#i-play"></use></svg>
      </button>
      <div class="onda" aria-hidden="true">${barras}</div>
      <span class="duracao">${formatarDuracao(m.duracao)}</span>
    </div>`;
}

// Alturas aleatórias para as barrinhas do áudio
function gerarOndas() {
  return Array.from({ length: 22 }, () => 25 + Math.round(Math.random() * 75));
}

// Coloca uma mensagem nova na tela (sem redesenhar tudo)
function mostrarNovaMensagem(contato, mensagem) {
  if (conversaEstaAberta(contato)) {
    $('#lista-mensagens').insertAdjacentHTML('beforeend', htmlMensagem(mensagem));
    rolarParaFim();
  } else if (estado.telaAtual === 'conversas') {
    renderizarListaConversas();
  }
}

// Atualiza "digitando..." no topo da conversa e na lista
function atualizarIndicadores(contato) {
  if (conversaEstaAberta(contato)) atualizarStatusTopo();
  if (estado.telaAtual === 'conversas') renderizarListaConversas();
}

function rolarParaFim() {
  const lista = $('#lista-mensagens');
  lista.scrollTop = lista.scrollHeight;
}

// Simula tocar um áudio: anima a onda e conta o tempo
function tocarAudio(botao) {
  const caixa = botao.closest('.audio');
  const usoIcone = botao.querySelector('use');
  const textoDuracao = caixa.querySelector('.duracao');
  const duracao = Number(caixa.dataset.duracao);

  const parar = () => {
    clearInterval(caixa.intervalo);
    caixa.classList.remove('tocando');
    usoIcone.setAttribute('href', '#i-play');
    botao.setAttribute('aria-label', 'Ouvir o áudio');
    textoDuracao.textContent = formatarDuracao(duracao);
  };

  if (caixa.classList.contains('tocando')) {
    parar();
    return;
  }

  let passados = 0;
  caixa.classList.add('tocando');
  usoIcone.setAttribute('href', '#i-pause');
  botao.setAttribute('aria-label', 'Pausar o áudio');
  textoDuracao.textContent = formatarDuracao(0);
  caixa.intervalo = setInterval(() => {
    passados++;
    textoDuracao.textContent = formatarDuracao(passados);
    if (passados >= duracao) parar();
  }, 1000);
}

/* =========================================================
   7. CONVERSA: ENVIAR TEXTO, EMOJIS E FOTOS
   ========================================================= */

function campoTemTexto() {
  return $('#campo-mensagem').value.trim().length > 0;
}

// Campo vazio: botão mostra o microfone. Com texto: mostra a setinha de enviar.
function atualizarBotaoPrincipal() {
  const temTexto = campoTemTexto();
  $('#uso-icone-principal').setAttribute('href', temTexto ? '#i-enviar' : '#i-mic');
  $('#botao-principal').setAttribute('aria-label', temTexto ? 'Enviar mensagem' : 'Aperte e segure para gravar um áudio');
  $('#btn-camera').hidden = temTexto;
}

function enviarTexto() {
  const campo = $('#campo-mensagem');
  const texto = campo.value.trim();
  const contato = contatoAtual();
  if (!texto || !contato) return;

  campo.value = '';
  atualizarBotaoPrincipal();
  fecharPaineis();

  // Responder ao golpista? Mostra um aviso em vez de enviar.
  if (contato.id === 'desconhecido') {
    mostrarAvisoGolpe('responder');
    return;
  }
  enviarMensagem(contato, { tipo: 'texto', texto });
}

function enviarFoto(origem) {
  const contato = contatoAtual();
  fecharPaineis();
  if (!contato) return;
  if (contato.id === 'desconhecido') {
    mostrarAvisoGolpe('responder');
    return;
  }
  enviarMensagem(contato, { tipo: 'foto', ...FOTOS[origem] });
}

// Envia qualquer mensagem (texto, áudio ou foto) e simula todo o "caminho" dela:
// ✓ enviado -> ✓✓ entregue -> ✓✓ azul lido -> "digitando..." -> resposta do contato
function enviarMensagem(contato, dados) {
  const mensagem = novaMensagem({ ...dados, de: 'eu', status: 'enviado' });
  contato.mensagens.push(mensagem);
  atualizarAtividade(contato);
  mostrarNovaMensagem(contato, mensagem);
  registrarAcao('enviou', { contatoId: contato.id, mensagem });

  setTimeout(() => mudarStatus(mensagem, 'entregue'), 1000);
  setTimeout(() => mudarStatus(mensagem, 'lido'), 2000);

  const resposta = escolherResposta(contato, mensagem);

  // O contato começa a "digitar"
  setTimeout(() => {
    contato.digitando++;
    contato.quemDigita = resposta.autor || '';
    atualizarIndicadores(contato);
  }, 2600);

  // E responde
  setTimeout(() => {
    contato.digitando = Math.max(0, contato.digitando - 1);
    const recebida = novaMensagem({ de: 'contato', texto: resposta.texto, autor: resposta.autor || null });
    contato.mensagens.push(recebida);
    atualizarAtividade(contato);
    if (!conversaEstaAberta(contato)) contato.naoLidas++;
    atualizarIndicadores(contato);
    mostrarNovaMensagem(contato, recebida);
    registrarAcao('resposta', { contatoId: contato.id, original: mensagem });
  }, 5200);
}

// Troca os tiques de uma mensagem já na tela
function mudarStatus(mensagem, novoStatus) {
  mensagem.status = novoStatus;
  const tique = document.querySelector(`#msg-${mensagem.id} .tique`);
  if (tique) tique.outerHTML = htmlTique(novoStatus);
  if (estado.telaAtual === 'conversas') renderizarListaConversas();
}

function ehBomDia(mensagem) {
  return mensagem.tipo === 'texto' && normalizar(mensagem.texto).includes('bom dia');
}

// Transforma "texto" em { texto, autor } (as respostas do grupo já têm autor)
function padronizarResposta(item) {
  return typeof item === 'string' ? { texto: item, autor: null } : item;
}

// Escolhe a resposta certa para o que a pessoa mandou
function escolherResposta(contato, mensagem) {
  const opcoes = RESPOSTAS[contato.id];
  if (!opcoes) return { texto: '👍', autor: null };
  if (opcoes.padrao) return padronizarResposta(sortear(opcoes.padrao));
  if (mensagem.tipo === 'audio') return padronizarResposta(sortear(opcoes.audio));
  if (mensagem.tipo === 'foto') return padronizarResposta(sortear(opcoes.foto));
  if (ehBomDia(mensagem)) return padronizarResposta(sortear(opcoes.bomDia));

  // Mensagens comuns: vai alternando as respostas
  const item = opcoes.texto[contato.contadorRespostas % opcoes.texto.length];
  contato.contadorRespostas++;
  return padronizarResposta(item);
}

// Monta os botões do painel de emojis
function montarPainelEmojis() {
  $('#painel-emojis').innerHTML = EMOJIS
    .map((emoji) => `<button type="button" class="botao-emoji" data-emoji="${emoji}" aria-label="Emoji ${emoji}">${emoji}</button>`)
    .join('');
}

// Coloca o emoji no campo, onde estava o cursor
function inserirEmoji(emoji) {
  const campo = $('#campo-mensagem');
  const inicio = campo.selectionStart ?? campo.value.length;
  const fim = campo.selectionEnd ?? campo.value.length;
  campo.value = campo.value.slice(0, inicio) + emoji + campo.value.slice(fim);
  const posicao = inicio + emoji.length;
  try { campo.setSelectionRange(posicao, posicao); } catch (erro) { /* sem problema */ }
  atualizarBotaoPrincipal();
  atualizarDica();
}

function alternarEmojis() {
  const abrir = !estado.emojisAberto;
  fecharPaineis();
  if (abrir) {
    estado.emojisAberto = true;
    $('#painel-emojis').hidden = false;
    $('#btn-emoji').setAttribute('aria-expanded', 'true');
  }
  rolarParaFim();
  atualizarDica();
}

function alternarAnexos() {
  const abrir = !estado.anexosAberto;
  fecharPaineis();
  if (abrir) {
    estado.anexosAberto = true;
    $('#menu-anexos').hidden = false;
    $('#botao-clipe').setAttribute('aria-expanded', 'true');
  }
  rolarParaFim();
  atualizarDica();
}

function fecharPaineis() {
  estado.emojisAberto = false;
  estado.anexosAberto = false;
  $('#painel-emojis').hidden = true;
  $('#menu-anexos').hidden = true;
  $('#btn-emoji').setAttribute('aria-expanded', 'false');
  $('#botao-clipe').setAttribute('aria-expanded', 'false');
}

/* =========================================================
   8. GRAVAÇÃO DE ÁUDIO (segurar o botão do microfone)
   Não grava som de verdade: só simula.
   ========================================================= */

function comecarGravacao() {
  if (estado.gravando) return;
  fecharPaineis();
  estado.gravando = true;
  estado.inicioGravacao = Date.now();

  $('#barra-inferior').classList.add('gravando');
  $('#botao-principal').classList.add('gravando');
  $('#tempo-gravacao').textContent = '0:00';

  estado.intervaloGravacao = setInterval(() => {
    const segundos = Math.floor((Date.now() - estado.inicioGravacao) / 1000);
    $('#tempo-gravacao').textContent = formatarDuracao(segundos);
  }, 250);

  try { if (navigator.vibrate) navigator.vibrate(40); } catch (erro) { /* sem vibração */ }
  atualizarDica();
}

function terminarGravacao() {
  if (!estado.gravando) return;
  clearInterval(estado.intervaloGravacao);
  estado.gravando = false;
  $('#barra-inferior').classList.remove('gravando');
  $('#botao-principal').classList.remove('gravando');

  const tempo = Date.now() - estado.inicioGravacao;

  // Toque muito rápido: explica como gravar (igual ao aplicativo de verdade)
  if (tempo < 1000) {
    mostrarAvisoRapido('Para gravar, SEGURE o dedo no microfone 🎤 enquanto fala. Solte só quando terminar.');
    atualizarDica();
    return;
  }

  const contato = contatoAtual();
  if (!contato) return;
  if (contato.id === 'desconhecido') {
    mostrarAvisoGolpe('responder');
    return;
  }
  enviarMensagem(contato, {
    tipo: 'audio',
    duracao: Math.max(1, Math.round(tempo / 1000)),
    ondas: gerarOndas()
  });
}

/* =========================================================
   9. CHAMADAS DE VOZ E VÍDEO
   ========================================================= */

function iniciarChamada(tipo) {
  const contato = contatoAtual();
  if (!contato || estado.chamada) return;
  if (contato.bloqueado) {
    mostrarAvisoRapido('Você bloqueou este número. Não dá para ligar.');
    return;
  }
  fecharPaineis();

  estado.chamada = {
    contatoId: contato.id,
    tipo,                 // 'video' ou 'voz'
    atendida: false,
    segundos: 0,
    temporizadores: [],
    intervalo: null
  };

  const tela = $('#tela-chamada');
  tela.classList.toggle('video', tipo === 'video');
  tela.classList.remove('atendida');
  $('#chamada-tipo').textContent = tipo === 'video' ? '📹 Chamada de vídeo' : '📞 Chamada de voz';
  $('#chamada-avatar').innerHTML = htmlAvatar(contato, 'grande');
  $('#chamada-nome').textContent = contato.nome;
  $('#chamada-status').textContent = 'Chamando...';
  $('#btn-mudo').setAttribute('aria-pressed', 'false');
  tela.hidden = false;

  // Depois de um tempinho o contato "atende" sozinho
  estado.chamada.temporizadores.push(setTimeout(() => {
    if (estado.chamada) $('#chamada-status').textContent = 'Tocando...';
  }, 2000));
  estado.chamada.temporizadores.push(setTimeout(atenderChamada, 4500));

  atualizarDica();
}

function atenderChamada() {
  const chamada = estado.chamada;
  if (!chamada) return;
  chamada.atendida = true;
  $('#tela-chamada').classList.add('atendida');
  $('#chamada-status').textContent = formatarDuracao(0);
  chamada.intervalo = setInterval(() => {
    chamada.segundos++;
    $('#chamada-status').textContent = formatarDuracao(chamada.segundos);
  }, 1000);
  atualizarDica();
}

function desligarChamada() {
  const chamada = estado.chamada;
  if (!chamada) return;
  chamada.temporizadores.forEach(clearTimeout);
  clearInterval(chamada.intervalo);
  estado.chamada = null;
  $('#tela-chamada').hidden = true;

  // Registra a chamada na conversa e no histórico
  const contato = contatos[chamada.contatoId];
  const icone = chamada.tipo === 'video' ? '📹' : '📞';
  const nomeTipo = chamada.tipo === 'video' ? 'Chamada de vídeo' : 'Chamada de voz';
  const detalhe = chamada.atendida ? formatarDuracao(chamada.segundos) : 'não atendida';
  const aviso = novaMensagem({ de: 'eu', tipo: 'sistema', texto: `${icone} ${nomeTipo} • ${detalhe}` });
  contato.mensagens.push(aviso);
  atualizarAtividade(contato);
  estado.historicoChamadas.unshift({
    contatoId: contato.id,
    tipo: chamada.tipo,
    hora: aviso.hora,
    atendida: chamada.atendida,
    segundos: chamada.segundos
  });

  if (estado.telaAtual === 'chat') renderizarChat();
  if (!chamada.atendida) {
    mostrarAvisoRapido('Você desligou antes de atenderem. Tudo bem! Pode tentar de novo. 🙂');
  }
  registrarAcao('desligou', chamada);
}

function alternarMudo() {
  const botao = $('#btn-mudo');
  const mudo = botao.getAttribute('aria-pressed') !== 'true';
  botao.setAttribute('aria-pressed', mudo ? 'true' : 'false');
  mostrarAvisoRapido(mudo ? '🔇 Microfone mudo: a outra pessoa não escuta você.' : '🎤 Microfone ligado de novo.');
}

/* =========================================================
   10. MODO "É GOLPE?"
   ========================================================= */

// Textos das janelas de aviso
const AVISOS = {
  responder: {
    icone: '🤚',
    titulo: 'Calma! Melhor não responder.',
    html: `
      <p>Não se preocupe: aqui é só um treino. 🙂</p>
      <p>Mas essas mensagens têm <strong>sinais de golpe</strong>: alguém diz que é da família,
         com um número novo, e pede dinheiro com pressa.</p>
      <p class="caixa-dica"><strong>Na vida real:</strong> não responda e não mande dinheiro.
         Ligue para seu filho ou sua filha no número antigo, que você já conhece.
         Depois, bloqueie e denuncie o número.</p>`
  },
  link: {
    icone: '🔗',
    titulo: 'Ainda bem que era só um treino!',
    html: `
      <p>Esse link era <strong>falso</strong>. Prêmio que chega do nada, sem você participar de nada, é golpe.</p>
      <p>Links assim servem para roubar seus dados ou estragar o celular.</p>
      <p class="caixa-dica"><strong>Na vida real:</strong> não toque no link. Apague a mensagem e bloqueie o número.
         Na dúvida, pergunte para alguém de confiança.</p>`
  },
  protegeu: {
    icone: '🛡️',
    titulo: 'Muito bem! Você se protegeu!',
    html: `
      <p>Essas mensagens eram <strong>golpe</strong>. Veja os sinais:</p>
      <ul class="lista-sinais">
        <li>⏰ <strong>Pressa:</strong> "urgente", "agora", "não conta pra ninguém".</li>
        <li>📱 <strong>Número novo:</strong> "troquei de número".</li>
        <li>💰 <strong>Pedido de dinheiro:</strong> Pix ou transferência.</li>
        <li>🔗 <strong>Link estranho:</strong> prêmio que você não pediu.</li>
        <li>🔢 <strong>Pedido de código ou senha:</strong> o banco nunca pede isso.</li>
      </ul>
      <p class="caixa-dica"><strong>Na vida real:</strong> na dúvida, ligue para a pessoa no número que você já conhece.
         Nunca passe códigos ou senhas. Bloqueie e denuncie números suspeitos.</p>`
  }
};

// Mostra o aviso amigável quando a pessoa responde ou toca no link
function mostrarAvisoGolpe(tipo) {
  mostrarModal(AVISOS[tipo]);
  registrarAcao('caiu-golpe', { tipo });
}

// Controle do "tocar e segurar" nas mensagens suspeitas
const toque = { temporizador: null, x: 0, y: 0, balao: null, abriuMenu: false };

function iniciarToqueMensagem(evento) {
  const balao = evento.target.closest('.balao[data-golpe]');
  toque.abriuMenu = false;
  if (!balao) return;
  toque.balao = balao;
  toque.x = evento.clientX;
  toque.y = evento.clientY;
  balao.classList.add('pressionado');
  clearTimeout(toque.temporizador);
  // Segurou por 0,6 segundo: abre o menu
  toque.temporizador = setTimeout(() => {
    toque.abriuMenu = true;
    cancelarToque();
    abrirMenuMensagem();
  }, 600);
}

function moverToqueMensagem(evento) {
  if (!toque.balao) return;
  // Se o dedo andou (rolando a tela), cancela
  if (Math.hypot(evento.clientX - toque.x, evento.clientY - toque.y) > 12) cancelarToque();
}

function soltarToqueMensagem(evento) {
  if (!toque.balao) return;
  const tocouNoLink = evento.target.closest('.link-golpe');
  cancelarToque();
  if (!tocouNoLink) {
    mostrarAvisoRapido('Para ver as opções, toque e SEGURE o dedo em cima da mensagem. 👆');
  }
}

function cancelarToque() {
  clearTimeout(toque.temporizador);
  if (toque.balao) toque.balao.classList.remove('pressionado');
  toque.balao = null;
}

function abrirMenuMensagem() {
  if (estado.menuMensagemAberto) return;
  estado.menuMensagemAberto = true;
  $('#menu-mensagem').hidden = false;
  try { if (navigator.vibrate) navigator.vibrate(30); } catch (erro) { /* sem vibração */ }
  atualizarDica();
}

function fecharMenuMensagem() {
  estado.menuMensagemAberto = false;
  $('#menu-mensagem').hidden = true;
  atualizarDica();
}

// Opção escolhida no menu: responder, bloquear, denunciar ou cancelar
function escolherOpcaoMensagem(opcao) {
  fecharMenuMensagem();
  if (opcao === 'responder') mostrarAvisoGolpe('responder');
  if (opcao === 'bloquear' || opcao === 'denunciar') protegerContraGolpe(opcao);
}

function protegerContraGolpe(opcao) {
  const contato = contatos.desconhecido;
  contato.bloqueado = true;
  contato.mensagens.push(novaMensagem({
    de: 'eu',
    tipo: 'sistema',
    texto: opcao === 'denunciar' ? '⚠️ Você denunciou e bloqueou este número.' : '🚫 Você bloqueou este número.'
  }));
  atualizarAtividade(contato);
  renderizarChat();

  mostrarModal({
    ...AVISOS.protegeu,
    titulo: opcao === 'denunciar' ? 'Muito bem! Você denunciou o golpe!' : 'Muito bem! Você bloqueou o golpista!',
    aoFechar: () => registrarAcao('protegeu')
  });
}

function desbloquearContato() {
  const contato = contatoAtual();
  if (!contato) return;
  contato.bloqueado = false;
  contato.mensagens.push(novaMensagem({ de: 'eu', tipo: 'sistema', texto: 'Você desbloqueou este número.' }));
  renderizarChat();
}

// Volta o "Número desconhecido" ao começo (usado ao iniciar a missão 5)
function resetarDesconhecido() {
  contatos.desconhecido = criarConversasIniciais().desconhecido;
}

/* =========================================================
   11. MISSÕES GUIADAS E BALÃO DE DICA

   Cada missão tem:
     - titulo:      o que aparece na lista
     - licao:       o resumo mostrado na tela de parabéns
     - passo():     descobre o PRÓXIMO passo olhando o que está na tela,
                    e devolve { texto da dica, alvo a destacar }
     - aoAcontecer: recebe as ações da pessoa e decide se a missão acabou
   ========================================================= */

// Passo comum: chegar na conversa certa
function passoIrParaConversa(id) {
  const nome = contatos[id].nome;
  if (estado.chamada) {
    return { texto: 'Você está numa chamada. Para sair, toque no botão vermelho.', alvo: '#btn-desligar' };
  }
  if (estado.telaAtual === 'chat' && estado.contatoAberto === id) return null; // já está lá!
  if (estado.telaAtual === 'chat') {
    return { texto: 'Esta não é a conversa certa. Toque na seta ←, lá em cima, para voltar.', alvo: '#btn-voltar' };
  }
  if (estado.abaAtual !== 'conversas') {
    return { texto: 'Toque em "Conversas", na faixa verde lá em cima.', alvo: '.aba[data-aba="conversas"]' };
  }
  return { texto: `Toque na conversa "${nome}".`, alvo: `.item-conversa[data-id="${id}"]` };
}

// Espera um pouco e conclui a missão (se a pessoa ainda estiver nela)
function concluirMissaoDepois(milissegundos) {
  const indice = estado.missaoAtual;
  setTimeout(() => {
    if (estado.missaoAtual === indice) concluirMissao();
  }, milissegundos);
}

const MISSOES = [
  // ---------- Missão 1 ----------
  {
    titulo: "Mande um 'Bom dia' para sua filha Ana",
    licao: 'Os tiquinhos mostram o caminho da mensagem: ✓ enviada, ✓✓ cinza entregue, ✓✓ azul lida.',
    passo() {
      if (estado.missaoFeita) {
        return { texto: 'Muito bem! 👏 Veja os tiquinhos ✓✓ ficarem azuis: quer dizer que a Ana leu. Espere a resposta dela.', alvo: null };
      }
      const ir = passoIrParaConversa('ana');
      if (ir) return ir;
      if (!normalizar($('#campo-mensagem').value).includes('bom dia')) {
        return { texto: 'Toque no campo branco escrito "Mensagem" e escreva: Bom dia', alvo: '.campo-caixa' };
      }
      return { texto: 'Ótimo! Agora toque no botão verde redondo, com a setinha, para enviar.', alvo: '#botao-principal' };
    },
    aoAcontecer(acao, dados) {
      if (acao === 'enviou' && dados.contatoId === 'ana' && ehBomDia(dados.mensagem)) estado.missaoFeita = true;
      if (acao === 'resposta' && dados.contatoId === 'ana' && ehBomDia(dados.original)) concluirMissaoDepois(1800);
    }
  },

  // ---------- Missão 2 ----------
  {
    titulo: 'Envie um áudio para o Neto Pedro',
    licao: 'Para gravar áudio: aperte e SEGURE o microfone 🎤, fale, e solte o dedo para enviar.',
    passo() {
      if (estado.missaoFeita) {
        return { texto: 'Muito bem! 👏 Seu áudio foi enviado. Espere o Pedro responder.', alvo: null };
      }
      const ir = passoIrParaConversa('pedro');
      if (ir) return ir;
      if (estado.gravando) {
        return { texto: 'Está gravando! 🎙️ Fale sua mensagem. Quando terminar, solte o dedo do botão.', alvo: '#botao-principal' };
      }
      if (campoTemTexto()) {
        return { texto: 'Apague o que está escrito no campo "Mensagem". Assim o botão do microfone 🎤 aparece.', alvo: '.campo-caixa' };
      }
      return { texto: 'Aperte e SEGURE o botão verde do microfone 🎤. Fale sua mensagem. Depois, solte o dedo.', alvo: '#botao-principal' };
    },
    aoAcontecer(acao, dados) {
      if (acao === 'enviou' && dados.contatoId === 'pedro' && dados.mensagem.tipo === 'audio') estado.missaoFeita = true;
      if (acao === 'resposta' && dados.contatoId === 'pedro' && dados.original.tipo === 'audio') concluirMissaoDepois(1800);
    }
  },

  // ---------- Missão 3 ----------
  {
    titulo: 'Envie uma foto para o Grupo da Família',
    licao: 'Para mandar foto: toque no clipe 📎 e escolha Câmera (tirar foto agora) ou Galeria (fotos que você já tem).',
    passo() {
      if (estado.missaoFeita) {
        return { texto: 'Muito bem! 👏 A foto foi para o grupo. Espere alguém da família responder.', alvo: null };
      }
      const ir = passoIrParaConversa('familia');
      if (ir) return ir;
      if (estado.anexosAberto) {
        return { texto: 'Escolha "Câmera" ou "Galeria".', alvo: '#menu-anexos' };
      }
      return { texto: 'Toque no clipe 📎, dentro do campo branco, perto do botão verde.', alvo: '#botao-clipe' };
    },
    aoAcontecer(acao, dados) {
      if (acao === 'enviou' && dados.contatoId === 'familia' && dados.mensagem.tipo === 'foto') estado.missaoFeita = true;
      if (acao === 'resposta' && dados.contatoId === 'familia' && dados.original.tipo === 'foto') concluirMissaoDepois(1800);
    }
  },

  // ---------- Missão 4 ----------
  {
    titulo: 'Faça uma chamada de vídeo para a Filha Ana',
    licao: 'Para chamada de vídeo: toque na câmera 📹 no alto da conversa. Para terminar, toque no botão vermelho.',
    passo() {
      const chamada = estado.chamada;
      if (chamada && chamada.contatoId === 'ana' && chamada.tipo === 'video') {
        if (!chamada.atendida) {
          return { texto: 'Chamando... ⏳ Espere um pouquinho, a Ana vai atender.', alvo: null };
        }
        return { texto: 'A Ana atendeu! 🎉 Converse à vontade. Para terminar, toque no botão vermelho.', alvo: '#btn-desligar' };
      }
      const ir = passoIrParaConversa('ana');
      if (ir) return ir;
      return { texto: 'Toque no ícone da câmera de vídeo 📹, lá em cima, perto do nome da Ana.', alvo: '#btn-video' };
    },
    aoAcontecer(acao, dados) {
      if (acao === 'desligou' && dados.contatoId === 'ana' && dados.tipo === 'video' && dados.atendida) {
        concluirMissaoDepois(600);
      }
    }
  },

  // ---------- Missão 5 ----------
  {
    titulo: 'Descubra o golpe',
    licao: 'Desconfie de pressa, número novo, pedido de dinheiro, links de prêmio e pedido de código. Na dúvida, ligue para a pessoa no número que você conhece.',
    passo() {
      if (estado.missaoFeita) {
        return { texto: 'Muito bem! 🛡️ Leia o aviso com calma e toque em "Entendi".', alvo: null };
      }
      const ir = passoIrParaConversa('desconhecido');
      if (ir) return ir;
      if (estado.menuMensagemAberto) {
        return { texto: 'O que fazer com uma mensagem suspeita? Escolha a opção mais segura.', alvo: '#menu-mensagem .folha' };
      }
      if (estado.missaoErrou) {
        return { texto: 'Tudo bem errar no treino! 😊 Toque e SEGURE a mensagem do Pix e escolha a opção mais segura.', alvo: '.balao[data-golpe="pix"]' };
      }
      return { texto: 'Leia as mensagens com calma. Tem algo estranho? 🤔 Toque e SEGURE o dedo em cima da mensagem do Pix.', alvo: '.balao[data-golpe="pix"]' };
    },
    aoAcontecer(acao) {
      if (acao === 'caiu-golpe') estado.missaoErrou = true;
      if (acao === 'protegeu') {
        estado.missaoFeita = true;
        concluirMissaoDepois(300);
      }
    }
  }
];

// Toda ação importante da pessoa passa por aqui
function registrarAcao(acao, dados = {}) {
  if (estado.missaoAtual !== null) {
    MISSOES[estado.missaoAtual].aoAcontecer(acao, dados);
  }
  atualizarDica();
}

// Mostra o balão de dica e o contorno amarelo no botão certo
function atualizarDica() {
  document.querySelectorAll('.destaque').forEach((el) => el.classList.remove('destaque'));
  $('#btn-inicio').hidden = estado.missaoAtual !== null;

  const dica = $('#dica');
  if (estado.missaoAtual === null) {
    dica.hidden = true;
    return;
  }

  const passo = MISSOES[estado.missaoAtual].passo();
  dica.hidden = false;
  $('#dica-missao').textContent = `💡 Missão ${estado.missaoAtual + 1} de ${MISSOES.length}`;
  if ($('#dica-texto').textContent !== passo.texto) $('#dica-texto').textContent = passo.texto;

  if (passo.alvo) {
    const alvo = document.querySelector(passo.alvo);
    if (alvo) {
      alvo.classList.add('destaque');
      // Em listas compridas, rola até o item destacado
      if (alvo.closest('.lista-conversas, .lista-mensagens')) {
        alvo.scrollIntoView({ block: 'nearest' });
      }
    }
  }
}

// Desenha a lista de missões na tela inicial
function renderizarMissoes() {
  const total = MISSOES.length;
  const feitas = estado.missoesConcluidas.filter(Boolean).length;

  $('#progresso-missoes').textContent = `Você completou ${feitas} de ${total} missões.`;
  $('#lista-missoes').innerHTML = MISSOES.map((missao, i) => {
    const concluida = estado.missoesConcluidas[i];
    return `
      <li>
        <button type="button" class="item-missao${concluida ? ' concluida' : ''}" data-missao="${i}">
          <span class="missao-numero" aria-hidden="true">${i + 1}</span>
          <span class="missao-texto">${escaparHTML(missao.titulo)}</span>
          <span class="missao-status" aria-label="${concluida ? 'concluída' : 'a fazer'}">${concluida ? '✅' : '▶'}</span>
        </button>
      </li>`;
  }).join('');

  let rotulo = '▶ Começar treino';
  if (feitas === total) rotulo = '📝 Fazer o quiz final';
  else if (feitas > 0) rotulo = '▶ Continuar treino';
  $('#btn-comecar').textContent = rotulo;
}

function proximaMissaoPendente() {
  return estado.missoesConcluidas.findIndex((feita) => !feita);
}

function iniciarMissao(indice) {
  fecharParabens();
  fecharModal(false);
  if (estado.chamada) desligarChamada();
  fecharPaineis();
  fecharMenuMensagem();

  estado.missaoAtual = indice;
  estado.missaoFeita = false;
  estado.missaoErrou = false;
  if (indice === 4) resetarDesconhecido(); // o golpe sempre começa do zero

  $('#campo-mensagem').value = '';
  estado.contatoAberto = null;
  estado.abaAtual = 'conversas';
  mostrarTela('conversas');
}

function sairMissao() {
  estado.missaoAtual = null;
  if (estado.chamada) desligarChamada();
  fecharPaineis();
  fecharMenuMensagem();
  mostrarTela('inicio');
}

function concluirMissao() {
  const indice = estado.missaoAtual;
  if (indice === null) return;
  estado.missoesConcluidas[indice] = true;
  salvarDado('sessionStorage', 'missoesConcluidas', estado.missoesConcluidas);
  estado.missaoAtual = null;
  estado.missaoFeita = false;
  atualizarDica();
  mostrarParabens(indice);
}

function recomecarMissoes() {
  if (!window.confirm('Apagar o progresso das missões e começar do zero?')) return;
  estado.missoesConcluidas = [false, false, false, false, false];
  salvarDado('sessionStorage', 'missoesConcluidas', estado.missoesConcluidas);
  Object.assign(contatos, criarConversasIniciais());
  estado.historicoChamadas = [];
  renderizarMissoes();
  mostrarAvisoRapido('Pronto! As missões começaram do zero. 🔄');
}

/* =========================================================
   12. PARABÉNS E CONFETE
   ========================================================= */

function mostrarParabens(indice) {
  const missao = MISSOES[indice];
  const proxima = proximaMissaoPendente();
  const botao = $('#parabens-proxima');

  let texto = `Você completou a missão ${indice + 1}: "${missao.titulo}".`;
  if (proxima === -1) {
    texto += ' Você terminou todas as missões! 🏅';
    botao.textContent = '📝 Fazer o quiz final';
    estado.acaoParabens = () => mostrarTela('quiz-nome');
  } else {
    botao.textContent = '▶ Próxima missão';
    estado.acaoParabens = () => iniciarMissao(proxima);
  }

  $('#parabens-texto').textContent = texto;
  $('#parabens-licao').textContent = '💡 ' + missao.licao;
  $('#parabens').hidden = false;
  soltarConfete($('#confete'));
  botao.focus({ preventScroll: true });
}

function fecharParabens() {
  $('#parabens').hidden = true;
  $('#confete').innerHTML = '';
}

// Cria pedacinhos coloridos que caem pela tela
function soltarConfete(area) {
  area.innerHTML = '';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cores = ['#25D366', '#FFD600', '#E91E63', '#2196F3', '#FF9800', '#9C27B0'];
  for (let i = 0; i < 70; i++) {
    const pedaco = document.createElement('span');
    pedaco.className = 'confete';
    pedaco.style.left = Math.random() * 100 + '%';
    pedaco.style.background = sortear(cores);
    pedaco.style.animationDuration = 2.5 + Math.random() * 2.5 + 's';
    pedaco.style.animationDelay = Math.random() * 1.5 + 's';
    if (Math.random() < 0.4) pedaco.style.borderRadius = '50%';
    area.appendChild(pedaco);
  }
}

/* =========================================================
   13. QUIZ FINAL
   ========================================================= */

const PERGUNTAS = [
  {
    pergunta: 'Para mandar um áudio, você...',
    opcoes: [
      'Toca uma vez no microfone e pronto',
      'Aperta e SEGURA o microfone enquanto fala, e solta para enviar',
      'Liga para a pessoa',
      'Escreve a palavra "áudio"'
    ],
    correta: 1,
    explicacao: 'Para gravar, aperte e segure o microfone 🎤 enquanto fala. Ao soltar o dedo, o áudio é enviado.'
  },
  {
    pergunta: 'O que quer dizer o ✓✓ azul ao lado da mensagem?',
    opcoes: [
      'A mensagem deu erro',
      'A pessoa já leu a mensagem',
      'A pessoa bloqueou você',
      'A mensagem foi apagada'
    ],
    correta: 1,
    explicacao: '✓ = enviada. ✓✓ cinza = chegou no celular da pessoa. ✓✓ azul = a pessoa leu.'
  },
  {
    pergunta: 'Para enviar uma foto, você toca em qual botão?',
    opcoes: [
      'No clipe 📎 e depois em Câmera ou Galeria',
      'Na seta de voltar',
      'No nome do contato',
      'No botão vermelho'
    ],
    correta: 0,
    explicacao: 'O clipe 📎 abre as opções Câmera e Galeria. Na Galeria ficam as fotos que você já tirou.'
  },
  {
    pergunta: 'Para fazer uma chamada de vídeo, você toca...',
    opcoes: [
      'No microfone',
      'No ícone da câmera de vídeo 📹, no alto da conversa',
      'Na carinha de emoji',
      'Na hora da mensagem'
    ],
    correta: 1,
    explicacao: 'A câmera de vídeo fica no alto da conversa, ao lado do telefone. Para terminar, toque no botão vermelho.'
  },
  {
    pergunta: 'Um número desconhecido diz: "Oi mãe, troquei de número, me manda um Pix urgente". O que fazer?',
    opcoes: [
      'Mandar o Pix rápido, porque é urgente',
      'Responder pedindo mais detalhes',
      'Não mandar nada, ligar para o número antigo do filho e bloquear o desconhecido',
      'Passar a mensagem para os amigos'
    ],
    correta: 2,
    explicacao: 'Golpistas fingem ser da família. Antes de tudo, ligue para a pessoa no número que você já conhece.'
  },
  {
    pergunta: 'Chegou: "Você ganhou um prêmio! Toque no link para receber". O que fazer?',
    opcoes: [
      'Tocar no link para ver o prêmio',
      'Não tocar no link, apagar e bloquear o número',
      'Mandar seus dados para receber',
      'Encaminhar para a família'
    ],
    correta: 1,
    explicacao: 'Prêmio que você não pediu é golpe. O link pode roubar seus dados. Não toque!'
  },
  {
    pergunta: 'Alguém diz ser do banco e pede o código que chegou por SMS. O que fazer?',
    opcoes: [
      'Passar o código, pois é do banco',
      'Mandar uma foto do cartão',
      'Nunca passar o código. Desligar e ligar para o número que está no cartão do banco',
      'Passar só metade do código'
    ],
    correta: 2,
    explicacao: 'O banco nunca pede código ou senha por mensagem. Na dúvida, ligue para o número que está atrás do seu cartão.'
  },
  {
    pergunta: 'Quais são sinais de golpe numa mensagem?',
    opcoes: [
      'Pressa, número novo e pedido de dinheiro',
      'Mensagem de bom dia da família',
      'Foto de um neto conhecido',
      'Lembrete de vacina do posto'
    ],
    correta: 0,
    explicacao: 'Desconfie quando aparecer: pressa, número novo, pedido de dinheiro ou de código, e links de prêmio.'
  }
];

const LETRAS = ['A', 'B', 'C', 'D'];

const quiz = { nome: '', indice: 0, acertos: 0, respondida: false };

function iniciarQuiz(nome) {
  quiz.nome = (nome || '').trim();
  quiz.indice = 0;
  quiz.acertos = 0;
  mostrarTela('quiz');
  mostrarPergunta();
}

function mostrarPergunta() {
  const atual = PERGUNTAS[quiz.indice];
  quiz.respondida = false;

  $('#quiz-progresso').textContent = `${quiz.indice + 1} de ${PERGUNTAS.length}`;
  $('#quiz-barra').style.width = (quiz.indice / PERGUNTAS.length) * 100 + '%';
  $('#quiz-pergunta').textContent = `${quiz.indice + 1}. ${atual.pergunta}`;
  $('#quiz-opcoes').innerHTML = atual.opcoes.map((opcao, i) => `
    <button type="button" class="opcao-quiz" data-indice="${i}">
      <span class="letra">${LETRAS[i]}</span>
      <span class="opcao-texto">${escaparHTML(opcao)}</span>
    </button>`).join('');

  $('#quiz-feedback').hidden = true;
  $('#btn-proxima').hidden = true;
  $('#tela-quiz').scrollTop = 0;
  pararFala();
}

function responderQuiz(escolhida) {
  if (quiz.respondida) return;
  quiz.respondida = true;

  const atual = PERGUNTAS[quiz.indice];
  const acertou = escolhida === atual.correta;
  if (acertou) quiz.acertos++;

  // Pinta a certa de verde e a escolhida errada de vermelho (com ✔ e ✘, não só cor)
  document.querySelectorAll('.opcao-quiz').forEach((botao, i) => {
    botao.disabled = true;
    if (i === atual.correta) {
      botao.classList.add('certa');
      botao.insertAdjacentHTML('beforeend', '<span class="marca">✔ Certa</span>');
    } else if (i === escolhida) {
      botao.classList.add('errada');
      botao.insertAdjacentHTML('beforeend', '<span class="marca">✘</span>');
    }
  });

  const feedback = $('#quiz-feedback');
  feedback.className = 'quiz-feedback ' + (acertou ? 'certo' : 'errado');
  feedback.innerHTML = `
    <strong>${acertou ? '✅ Muito bem, você acertou!' : '❌ Não foi dessa vez.'}</strong>
    <p>${escaparHTML(atual.explicacao)}</p>`;
  feedback.hidden = false;

  const ultima = quiz.indice === PERGUNTAS.length - 1;
  const botaoProxima = $('#btn-proxima');
  botaoProxima.textContent = ultima ? 'Ver meu resultado 🏁' : 'Próxima pergunta ▶';
  botaoProxima.hidden = false;
  feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function proximaPergunta() {
  quiz.indice++;
  if (quiz.indice < PERGUNTAS.length) mostrarPergunta();
  else finalizarQuiz();
}

function finalizarQuiz() {
  const total = PERGUNTAS.length;

  // Guarda o resultado para a tela "Resultados da oficina"
  estado.resultados.push({
    nome: quiz.nome || 'Sem nome',
    acertos: quiz.acertos,
    total,
    hora: formatarHora(new Date())
  });
  salvarDado('sessionStorage', 'resultadosOficina', estado.resultados);

  let emoji;
  let mensagem;
  if (quiz.acertos === total) {
    emoji = '🏆';
    mensagem = 'Perfeito! Você está craque!';
  } else if (quiz.acertos >= 6) {
    emoji = '🌟';
    mensagem = 'Muito bem! Você aprendeu bastante.';
  } else if (quiz.acertos >= 4) {
    emoji = '👍';
    mensagem = 'Bom trabalho! Treine mais um pouquinho as missões.';
  } else {
    emoji = '💪';
    mensagem = 'Não desanime! Faça as missões de novo e tente outra vez.';
  }
  if (quiz.nome) mensagem = `${quiz.nome}, ${mensagem.charAt(0).toLowerCase()}${mensagem.slice(1)}`;

  $('#placar-emoji').textContent = emoji;
  $('#placar-texto').textContent = `Você acertou ${quiz.acertos} de ${total}!`;
  $('#placar-mensagem').textContent = mensagem;
  mostrarTela('quiz-fim');
  if (quiz.acertos >= 5) soltarConfete($('#confete-quiz'));
  else $('#confete-quiz').innerHTML = '';
}

/* =========================================================
   14. RESULTADOS DA OFICINA (para o aplicador anotar)
   ========================================================= */

function renderizarResultados() {
  const area = $('#area-resultados');
  const lista = estado.resultados;

  if (lista.length === 0) {
    area.innerHTML = '<p class="vazio">Ninguém fez o quiz ainda nesta sessão.</p>';
    return;
  }

  const linhas = lista.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escaparHTML(r.nome)}</td>
      <td><strong>${r.acertos}</strong> de ${r.total}</td>
      <td>${r.hora}</td>
    </tr>`).join('');

  const media = lista.reduce((soma, r) => soma + r.acertos, 0) / lista.length;

  area.innerHTML = `
    <table class="tabela-resultados">
      <thead><tr><th>#</th><th>Nome</th><th>Acertos</th><th>Hora</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <p class="resumo-resultados">
      Participantes: ${lista.length} · Média: ${media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} de ${PERGUNTAS.length}
    </p>`;
}

function limparResultados() {
  if (!window.confirm('Apagar todos os resultados desta sessão?')) return;
  estado.resultados = [];
  salvarDado('sessionStorage', 'resultadosOficina', estado.resultados);
  renderizarResultados();
}

/* =========================================================
   15. ACESSIBILIDADE
   ========================================================= */

// ---- Tamanho da letra (A+ / A-) ----
function aplicarFonte() {
  if (!(estado.indiceFonte >= 0 && estado.indiceFonte < TAMANHOS_FONTE.length)) estado.indiceFonte = 0;
  document.documentElement.style.fontSize = TAMANHOS_FONTE[estado.indiceFonte] + 'px';
}

function mudarFonte(passo) {
  const novo = estado.indiceFonte + passo;
  if (novo < 0) {
    mostrarAvisoRapido('A letra já está no menor tamanho.');
    return;
  }
  if (novo >= TAMANHOS_FONTE.length) {
    mostrarAvisoRapido('A letra já está no maior tamanho.');
    return;
  }
  estado.indiceFonte = novo;
  aplicarFonte();
  salvarDado('localStorage', 'indiceFonte', novo);
  if (estado.telaAtual === 'chat') rolarParaFim();
}

// ---- Leitura em voz alta (Web Speech API) ----
let vozPortugues = null;

function carregarVozes() {
  if (!('speechSynthesis' in window)) return;
  const vozes = window.speechSynthesis.getVoices();
  vozPortugues =
    vozes.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
    vozes.find((v) => v.lang && v.lang.toLowerCase().startsWith('pt')) ||
    null;
}

// Tira emojis e troca símbolos por palavras, para a leitura ficar natural
function prepararTextoParaFala(texto) {
  return texto
    .replace(/✓✓/g, ' dois tiquinhos ')
    .replace(/✓/g, ' um tiquinho ')
    .replace(/✔/g, ' ')
    .replace(/✘/g, ' ')
    .replace(/←/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

function falar(texto) {
  if (!('speechSynthesis' in window)) {
    mostrarAvisoRapido('Este navegador não consegue ler em voz alta. 😕');
    return;
  }
  const limpo = prepararTextoParaFala(texto);
  if (!limpo) return;

  window.speechSynthesis.cancel();
  // Pequena pausa: alguns navegadores ignoram a fala logo após o "cancel"
  setTimeout(() => {
    const fala = new SpeechSynthesisUtterance(limpo);
    fala.lang = 'pt-BR';
    fala.rate = 0.9; // um pouco mais devagar
    if (vozPortugues) fala.voice = vozPortugues;
    window.speechSynthesis.speak(fala);
  }, 80);
}

function pararFala() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/* =========================================================
   16. AVISOS
   ========================================================= */

// Janela de aviso com botão "Entendi"
function mostrarModal({ icone, titulo, html, textoBotao, aoFechar }) {
  $('#modal-icone').textContent = icone || '💬';
  $('#modal-titulo').textContent = titulo;
  $('#modal-conteudo').innerHTML = html;
  $('#modal-ok').textContent = textoBotao || 'Entendi 👍';
  estado.aoFecharModal = aoFechar || null;
  estado.modalAberto = true;
  $('#modal').hidden = false;
  $('#modal .modal').scrollTop = 0;
  $('#modal-ok').focus({ preventScroll: true });
}

// executarAcao = false: fecha sem chamar a função "aoFechar"
function fecharModal(executarAcao = true) {
  if (!estado.modalAberto) return;
  pararFala();
  estado.modalAberto = false;
  $('#modal').hidden = true;
  const acao = estado.aoFecharModal;
  estado.aoFecharModal = null;
  if (executarAcao && acao) acao();
  atualizarDica();
}

// Aviso rápido no rodapé (some sozinho; tocar fecha)
let temporizadorAviso = null;

function mostrarAvisoRapido(texto) {
  const aviso = $('#aviso-rapido');
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { aviso.hidden = true; }, 6000);
}

/* =========================================================
   17. LIGAR OS EVENTOS
   ========================================================= */

function ligarEventos() {
  // ---- Botões "🔊 Ouvir" e de navegação (servem para a página toda) ----
  document.addEventListener('click', (evento) => {
    const botaoOuvir = evento.target.closest('[data-ouvir]');
    if (botaoOuvir) {
      const alvo = $(botaoOuvir.dataset.ouvir);
      if (alvo) falar(alvo.innerText);
      return;
    }
    const botaoIr = evento.target.closest('[data-ir]');
    if (botaoIr) mostrarTela(botaoIr.dataset.ir);
  });

  // ---- Tamanho da letra ----
  $('#btn-letra-maior').addEventListener('click', () => mudarFonte(1));
  $('#btn-letra-menor').addEventListener('click', () => mudarFonte(-1));

  // ---- Tela inicial ----
  $('#btn-comecar').addEventListener('click', () => {
    const proxima = proximaMissaoPendente();
    if (proxima === -1) mostrarTela('quiz-nome');
    else iniciarMissao(proxima);
  });
  $('#lista-missoes').addEventListener('click', (evento) => {
    const item = evento.target.closest('[data-missao]');
    if (item) iniciarMissao(Number(item.dataset.missao));
  });
  $('#btn-explorar').addEventListener('click', () => {
    estado.missaoAtual = null;
    estado.abaAtual = 'conversas';
    mostrarTela('conversas');
  });
  $('#btn-ir-quiz').addEventListener('click', () => mostrarTela('quiz-nome'));
  $('#btn-recomecar').addEventListener('click', recomecarMissoes);
  $('#btn-resultados').addEventListener('click', () => mostrarTela('resultados'));

  // ---- Lista de conversas e abas ----
  $('#btn-inicio').addEventListener('click', () => mostrarTela('inicio'));
  document.querySelectorAll('.aba').forEach((botao) => {
    botao.addEventListener('click', () => trocarAba(botao.dataset.aba));
  });
  $('#lista-conversas').addEventListener('click', (evento) => {
    const item = evento.target.closest('.item-conversa');
    if (item) abrirConversa(item.dataset.id);
  });
  $('#painel-status').addEventListener('click', (evento) => {
    const item = evento.target.closest('.item-status');
    if (!item) return;
    if (item.dataset.status === 'meu') {
      mostrarAvisoRapido('No treino, o Status é só para conhecer. 🙂 Na vida real, aqui você publicaria uma foto ou um recado.');
    } else {
      mostrarAvisoRapido(`Na vida real, aqui você veria a foto ou o recado que ${item.dataset.status} publicou. 🙂`);
    }
  });

  // ---- Topo da conversa ----
  $('#btn-voltar').addEventListener('click', voltarParaLista);
  $('#btn-video').addEventListener('click', () => iniciarChamada('video'));
  $('#btn-voz').addEventListener('click', () => iniciarChamada('voz'));

  // ---- Mensagens: tocar áudio, link falso e "tocar e segurar" ----
  const listaMensagens = $('#lista-mensagens');
  listaMensagens.addEventListener('click', (evento) => {
    const botaoPlay = evento.target.closest('[data-acao="play"]');
    if (botaoPlay) {
      tocarAudio(botaoPlay);
      return;
    }
    const link = evento.target.closest('[data-acao="link"]');
    if (link) {
      // Se o dedo segurou e abriu o menu, não conta como toque no link
      if (toque.abriuMenu) {
        toque.abriuMenu = false;
        return;
      }
      mostrarAvisoGolpe('link');
      return;
    }
    fecharPaineis();
    atualizarDica();
  });
  listaMensagens.addEventListener('pointerdown', iniciarToqueMensagem);
  listaMensagens.addEventListener('pointermove', moverToqueMensagem);
  listaMensagens.addEventListener('pointerup', soltarToqueMensagem);
  listaMensagens.addEventListener('pointercancel', cancelarToque);
  listaMensagens.addEventListener('contextmenu', (evento) => {
    // Clique com o botão direito (computador) ou toque longo (celular)
    if (evento.target.closest('.balao[data-golpe]')) {
      evento.preventDefault();
      toque.abriuMenu = true;
      cancelarToque();
      abrirMenuMensagem();
    }
  });
  // Quando uma foto termina de carregar, desce a conversa até o fim
  listaMensagens.addEventListener('load', rolarParaFim, true);

  // ---- Menu Responder / Bloquear / Denunciar ----
  $('#menu-mensagem').addEventListener('click', (evento) => {
    if (evento.target.id === 'menu-mensagem') {
      fecharMenuMensagem(); // tocou fora do menu
      return;
    }
    const opcao = evento.target.closest('[data-opcao]');
    if (opcao) escolherOpcaoMensagem(opcao.dataset.opcao);
  });
  $('#btn-desbloquear').addEventListener('click', desbloquearContato);

  // ---- Campo de mensagem ----
  const campo = $('#campo-mensagem');
  campo.addEventListener('input', () => {
    atualizarBotaoPrincipal();
    atualizarDica();
  });
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      enviarTexto();
    }
  });

  // ---- Emojis, clipe e câmera ----
  $('#btn-emoji').addEventListener('click', alternarEmojis);
  $('#painel-emojis').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-emoji]');
    if (botao) inserirEmoji(botao.dataset.emoji);
  });
  $('#botao-clipe').addEventListener('click', alternarAnexos);
  $('#menu-anexos').addEventListener('click', (evento) => {
    const opcao = evento.target.closest('[data-anexo]');
    if (opcao) enviarFoto(opcao.dataset.anexo);
  });
  $('#btn-camera').addEventListener('click', () => enviarFoto('camera'));

  // ---- Botão verde: segurar = gravar áudio / tocar com texto = enviar ----
  const botaoPrincipal = $('#botao-principal');
  botaoPrincipal.addEventListener('pointerdown', (evento) => {
    if (campoTemTexto()) return;                 // com texto, o "click" envia
    if (evento.button !== 0) return;             // só o botão esquerdo do mouse
    evento.preventDefault();
    try { botaoPrincipal.setPointerCapture(evento.pointerId); } catch (erro) { /* sem problema */ }
    comecarGravacao();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((tipo) => {
    botaoPrincipal.addEventListener(tipo, terminarGravacao);
  });
  botaoPrincipal.addEventListener('click', (evento) => {
    if (campoTemTexto()) {
      enviarTexto();
    } else if (evento.detail === 0) {
      // Ativado pelo teclado (Enter/Espaço): explica como gravar
      mostrarAvisoRapido('Para gravar um áudio, aperte e SEGURE este botão enquanto fala.');
    }
  });
  botaoPrincipal.addEventListener('contextmenu', (evento) => evento.preventDefault());

  // ---- Chamada ----
  $('#btn-desligar').addEventListener('click', desligarChamada);
  $('#btn-mudo').addEventListener('click', alternarMudo);

  // ---- Balão de dica ----
  $('#dica-sair').addEventListener('click', sairMissao);

  // ---- Janela de aviso e parabéns ----
  $('#modal-ok').addEventListener('click', () => fecharModal());
  $('#parabens-proxima').addEventListener('click', () => {
    const acao = estado.acaoParabens;
    fecharParabens();
    if (acao) acao();
  });
  $('#parabens-inicio').addEventListener('click', () => {
    fecharParabens();
    mostrarTela('inicio');
  });

  // ---- Aviso rápido: tocar fecha ----
  $('#aviso-rapido').addEventListener('click', () => { $('#aviso-rapido').hidden = true; });

  // ---- Quiz ----
  $('#btn-iniciar-quiz').addEventListener('click', () => iniciarQuiz($('#campo-nome').value));
  $('#campo-nome').addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') iniciarQuiz($('#campo-nome').value);
  });
  $('#quiz-opcoes').addEventListener('click', (evento) => {
    const opcao = evento.target.closest('.opcao-quiz');
    if (opcao) responderQuiz(Number(opcao.dataset.indice));
  });
  $('#btn-proxima').addEventListener('click', proximaPergunta);
  $('#btn-quiz-denovo').addEventListener('click', () => iniciarQuiz(quiz.nome));

  // ---- Resultados ----
  $('#btn-limpar-resultados').addEventListener('click', limparResultados);

  // ---- Tecla Esc fecha janelas e menus ----
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    if (estado.modalAberto) fecharModal();
    else if (estado.menuMensagemAberto) fecharMenuMensagem();
    else if (estado.emojisAberto || estado.anexosAberto) {
      fecharPaineis();
      atualizarDica();
    }
  });

  // ---- Vozes da leitura em voz alta carregam depois da página ----
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = carregarVozes;
  }
}

/* =========================================================
   18. INÍCIO DA APLICAÇÃO
   ========================================================= */

function iniciar() {
  Object.assign(contatos, criarConversasIniciais());
  montarPainelEmojis();
  aplicarFonte();
  ligarEventos();
  carregarVozes();
  mostrarTela('inicio');
}

document.addEventListener('DOMContentLoaded', iniciar);
