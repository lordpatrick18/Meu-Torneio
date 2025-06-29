let ultimaFaseSorteio = 'primeiraFase';
let filtroAberto = false;
let ultimoSorteioConcluido = null; // Rastreia APENAS o último sorteio executado

// Função para alternar a visibilidade do menu dropdown de fases
function alternarFiltroFases(event) {
  event.stopPropagation();
  const filtroLista = document.querySelector('.filtro-fase-lista');
  if (filtroLista) {
    filtroLista.classList.toggle('hidden');
    filtroAberto = !filtroLista.classList.contains('hidden');
  }
}

// Fecha o dropdown se clicar fora dele
document.addEventListener('click', function(e) {
  const filtroContainer = document.querySelector('.filtro-fase-container');
  if (filtroAberto && filtroContainer && !filtroContainer.contains(e.target)) {
    document.querySelector('.filtro-fase-lista')?.classList.add('hidden');
    filtroAberto = false;
  }
});

/**
 * Função central para controlar a exibição da tela de sorteio.
 * @param {string} fase - A chave da fase a ser exibida (ex: 'primeiraFase').
 * @param {HTMLElement} [elementoClicado] - O elemento <li> do filtro que foi clicado.
 */
function filtrarSorteioPorFase(fase, elementoClicado) {
    ultimaFaseSorteio = fase; // Salva a última fase visualizada na "memória"

    const mapaNomesFase = {
        'primeiraFase': 'Primeira Fase',
        'segundaFase': 'Segunda Fase',
        'terceiraFase': 'Terceira Fase',
        'quartaFase': 'Quarta Fase',
        'final': 'Fase Final'
    };
    const mapaBotoesAcao = {
        'primeiraFase': 'sortearGruposPorPotes()',
        'segundaFase': 'gerarSegundaFaseSorteio()',
        'terceiraFase': 'gerarTerceiraFaseSorteio()',
        'quartaFase': 'gerarQuartaFaseSorteio()',
        'final': 'gerarFaseFinalSorteio()'
    };
    const dadosFaseMap = {
        'primeiraFase': dadosGrupos, 'segundaFase': dadosSegundaFase,
        'terceiraFase': dadosTerceiraFase, 'quartaFase': dadosQuartaFase, 'final': dadosFinal
    };

    // 1. Limpa a seleção de todos os botões de ação e itens de filtro
    document.querySelectorAll('.botoes-sorteio button, .filtro-fase-lista .filtro-item').forEach(btn => {
        btn.classList.remove('active');
    });

    // 2. LÓGICA CORRIGIDA: Ativa APENAS o botão do último sorteio que foi CONCLUÍDO
    if (ultimoSorteioConcluido) {
        const seletorBotao = `.botoes-sorteio button[onclick="${mapaBotoesAcao[ultimoSorteioConcluido]}"]`;
        document.querySelector(seletorBotao)?.classList.add('active');
    }

    // 3. Ativa o item de filtro (no dropdown) correspondente à fase que está sendo VISUALIZADA
    const seletorItemFiltro = `.filtro-item[onclick*="'${fase}'"]`;
    document.querySelector(seletorItemFiltro)?.classList.add('active');
    
    // 4. Atualiza o texto do botão de filtro principal
    const nomeFaseCorreto = mapaNomesFase[fase] || "Selecionar Fase";
    const spanFase = document.getElementById('fase-selecionada');
    if (spanFase) {
        spanFase.textContent = nomeFaseCorreto;
    }

    // 5. Esconde o menu dropdown
    document.querySelector('.filtro-fase-lista')?.classList.add('hidden');
    filtroAberto = false;

    // 6. Renderiza os grupos na tela
    const containerGrupos = document.getElementById("grupos");
    const dados = dadosFaseMap[fase];
    let html = "";

    if (dados && Object.keys(dados).length > 0) {
        html += `<div class="grupos-container ${fase === 'final' ? 'final-phase' : ''}">`;
        for (let grupo in dados) {
            html += criarCardGrupo(grupo, dados[grupo]);
        }
        html += `</div>`;
    } else {
        const nomeBotaoAcao = document.querySelector(`.botoes-sorteio button[onclick="${mapaBotoesAcao[fase]}"]`)?.textContent || `Sortear ${mapaNomesFase[fase]}`;
        const mensagem = `Clique em "${nomeBotaoAcao}" no menu acima`;
        html = gerarGruposVaziosComMensagem(nomeFaseCorreto, fase, mensagem);
    }

    if (containerGrupos) {
        containerGrupos.innerHTML = html;
    }
    if (typeof atualizarFavoritosNaTela === 'function') {
        atualizarFavoritosNaTela();
    }
}


// --- Funções de Sorteio (Ação dos Botões) ---
function sortearGruposPorPotes() {
  if (!potes || Object.values(potes).some(p => p.length < 5)) {
    alert("Erro: Preencha todos os 4 potes com 5 equipes cada antes de sortear.");
    return;
  }
  limparFasesSubsequentes(true); 
  const potesParaSortear = {
    pote1: [...potes.pote1].sort(() => Math.random() - 0.5),
    pote2: [...potes.pote2].sort(() => Math.random() - 0.5),
    pote3: [...potes.pote3].sort(() => Math.random() - 0.5),
    pote4: [...potes.pote4].sort(() => Math.random() - 0.5)
  };
  dadosGrupos = { A: [], B: [], C: [], D: [], E: [] };
  for (let grupo in dadosGrupos) {
    dadosGrupos[grupo].push(potesParaSortear.pote1.pop(), potesParaSortear.pote2.pop(), potesParaSortear.pote3.pop(), potesParaSortear.pote4.pop());
  }
  dadosJogos = {};
  for (let grupo in dadosGrupos) {
    dadosJogos[grupo] = gerarRodadas(dadosGrupos[grupo], grupo);
  }
  ultimoSorteioConcluido = 'primeiraFase';
  filtrarSorteioPorFase('primeiraFase');
}

function gerarSegundaFaseSorteio() {
  if (!dadosGrupos || Object.keys(dadosGrupos).length === 0) {
    alert("Erro: Gere a Primeira Fase antes de continuar.");
    return;
  }
  const classificados = calcularClassificacao();
  if (!classificados || classificados.length < 16) {
    alert("Erro: Não há times classificados suficientes para a segunda fase. Jogue as partidas.");
    return;
  }
  limparFasesSubsequentes(false);
  dadosSegundaFase = {
    A: [classificados[0].nome, classificados[7].nome, classificados[11].nome, classificados[15].nome],
    B: [classificados[1].nome, classificados[6].nome, classificados[10].nome, classificados[14].nome],
    C: [classificados[2].nome, classificados[5].nome, classificados[9].nome, classificados[13].nome],
    D: [classificados[3].nome, classificados[4].nome, classificados[8].nome, classificados[12].nome]
  };
  jogosSegundaFase = {};
  for (let grupo in dadosSegundaFase) {
    jogosSegundaFase[grupo] = gerarRodadas(dadosSegundaFase[grupo], grupo);
  }
  ultimoSorteioConcluido = 'segundaFase';
  filtrarSorteioPorFase('segundaFase');
}

function gerarTerceiraFaseSorteio() {
    if (!dadosSegundaFase || Object.keys(dadosSegundaFase).length === 0) {
        alert("Erro: Gere a Segunda Fase antes de continuar.");
        return;
    }
    const classificados = calcularClassificacao();
    if (!classificados || classificados.length < 12) {
        alert("Erro: Não há times classificados suficientes para a terceira fase. Jogue as partidas.");
        return;
    }
    limparFasesSubsequentes(false);
    dadosTerceiraFase = {
        A: [classificados[0].nome, classificados[5].nome, classificados[8].nome, classificados[11].nome],
        B: [classificados[1].nome, classificados[4].nome, classificados[7].nome, classificados[10].nome],
        C: [classificados[2].nome, classificados[3].nome, classificados[6].nome, classificados[9].nome]
    };
    jogosTerceiraFase = {};
    for (let grupo in dadosTerceiraFase) {
        jogosTerceiraFase[grupo] = gerarRodadas(dadosTerceiraFase[grupo], grupo);
    }
    ultimoSorteioConcluido = 'terceiraFase';
    filtrarSorteioPorFase('terceiraFase');
}

function gerarQuartaFaseSorteio() {
    if (!dadosTerceiraFase || Object.keys(dadosTerceiraFase).length === 0) {
        alert("Erro: Gere a Terceira Fase antes de continuar.");
        return;
    }
    const classificados = calcularClassificacao();
    if (!classificados || classificados.length < 8) {
        alert("Erro: Não há times classificados suficientes para a quarta fase. Jogue as partidas.");
        return;
    }
    limparFasesSubsequentes(false);
    dadosQuartaFase = {
        A: [classificados[0].nome, classificados[3].nome, classificados[5].nome, classificados[7].nome],
        B: [classificados[1].nome, classificados[2].nome, classificados[4].nome, classificados[6].nome]
    };
    jogosQuartaFase = {};
    for (let grupo in dadosQuartaFase) {
        jogosQuartaFase[grupo] = gerarRodadas(dadosQuartaFase[grupo], grupo);
    }
    ultimoSorteioConcluido = 'quartaFase';
    filtrarSorteioPorFase('quartaFase');
}

function gerarFaseFinalSorteio() {
    if (!dadosQuartaFase || Object.keys(dadosQuartaFase).length === 0) {
        alert("Erro: Gere a Quarta Fase antes de continuar.");
        return;
    }
    const classificados = calcularClassificacao().slice(0, 4);
    if (!classificados || classificados.length < 4) {
        alert("Erro: Não há times classificados suficientes para a fase final. Jogue as partidas.");
        return;
    }
    limparFasesSubsequentes(false);
    dadosFinal = { FINAL: classificados.map(t => t.nome) };
    jogosFinal = {};
    for (let grupo in dadosFinal) {
        jogosFinal[grupo] = gerarRodadas(dadosFinal[grupo], grupo);
    }
    ultimoSorteioConcluido = 'final';
    filtrarSorteioPorFase('final');
}


// --- Funções Auxiliares ---

// ===== CORREÇÃO PRINCIPAL AQUI =====
function limparFasesSubsequentes(limparPrimeiraFase = false) {
  if (limparPrimeiraFase) {
      // Reseta tudo se for um novo sorteio da primeira fase
      dadosGrupos = {}; dadosJogos = {}; resultados = {}; historicoClassificacao = {};
      ultimoSorteioConcluido = null;
  }

  // Sempre limpa os dados das fases futuras
  dadosSegundaFase = {}; jogosSegundaFase = {};
  dadosTerceiraFase = {}; jogosTerceiraFase = {};
  dadosQuartaFase = {}; jogosQuartaFase = {};
  dadosFinal = {}; jogosFinal = {};
  
  if (!limparPrimeiraFase) {
    // Se não for um reset completo, limpamos o histórico e resultados das fases futuras
    // para permitir que sejam geradas novamente.
    let minGlobalRoundParaLimpar = 99; // Um número alto para garantir que nada seja limpo por padrão

    // Define a partir de qual rodada global os dados devem ser apagados
    if (ultimoSorteioConcluido === 'primeiraFase') minGlobalRoundParaLimpar = 7;
    if (ultimoSorteioConcluido === 'segundaFase') minGlobalRoundParaLimpar = 13;
    if (ultimoSorteioConcluido === 'terceiraFase') minGlobalRoundParaLimpar = 19;
    if (ultimoSorteioConcluido === 'quartaFase') minGlobalRoundParaLimpar = 25;

    // Apaga os resultados dos jogos das fases futuras
    for (let id in resultados) {
        const partes = id.split('_');
        let faseDoJogo, rodadaDoJogo;
        if (id.startsWith('SF_')) { faseDoJogo = 'segundaFase'; rodadaDoJogo = parseInt(partes[2]); }
        else if (id.startsWith('TF_')) { faseDoJogo = 'terceiraFase'; rodadaDoJogo = parseInt(partes[2]); }
        else if (id.startsWith('QF_')) { faseDoJogo = 'quartaFase'; rodadaDoJogo = parseInt(partes[2]); }
        else if (id.startsWith('FIN_')) { faseDoJogo = 'final'; rodadaDoJogo = parseInt(partes[2]); }
        else { continue; } // Pula os jogos da primeira fase

        const rodadaGlobalDoResultado = obterRodadaGlobal(faseDoJogo, rodadaDoJogo);
        if (rodadaGlobalDoResultado >= minGlobalRoundParaLimpar) {
            delete resultados[id];
        }
    }

    // Apaga o histórico de classificação das fases futuras
    for (let key in historicoClassificacao) { // A chave é no formato "rodadaGlobal_X"
        const rodadaNum = parseInt(key.split('_')[2]);
        if (rodadaNum >= minGlobalRoundParaLimpar) {
            delete historicoClassificacao[key];
        }
    }
  }
}

function criarCardGrupo(grupo, times) {
  return `
    <div class='grupo-completo'>
      <div class='grupo-header'>Grupo ${grupo}</div>
      <div class='grupo-item'>
        <div class='grupo-equipes'>
          ${times.map((time) => `
              <div class="grupo-equipe" data-equipe="${time}">
                <div class="equipe-escudo">
                  <img src="${getEscudoPath(time)}" alt="${time}" class="escudo" onerror="this.style.display='none'">
                </div>
                <div class="equipe-info">
                  <div class="linha-nome">
                    <div class="nome-completo">${formatarNomeExibicao(time)}</div>
                  </div>
                  <div class="linha-pais">
                    <div class="sigla-pais">${getPais(time)}</div>
                  </div>
                </div>
              </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function gerarGruposVaziosComMensagem(titulo, fase, mensagem) {
    const gruposPadrao = {
      'primeiraFase': ['A', 'B', 'C', 'D', 'E'],
      'segundaFase': ['A', 'B', 'C', 'D'],
      'terceiraFase': ['A', 'B', 'C'],
      'quartaFase': ['A', 'B'],
      'final': ['FINAL']
    };
  
    let html = `<div class="grupos-container ${fase === 'final' ? 'final-phase' : ''}">`;
  
    for (let grupo of gruposPadrao[fase] || []) {
      html += `
        <div class="grupo-completo">
          <div class="grupo-header">Grupo ${grupo}</div>
          <div class="grupo-item">
            <div class="grupo-equipes">
              <div class="grupo-equipe" style="justify-content: center;">
                ${mensagem}
              </div>
            </div>
          </div>
        </div>`;
    }
  
    html += `</div>`;
    return html;
}