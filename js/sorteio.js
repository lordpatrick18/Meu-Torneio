
let filtroAberto = false;
let ultimoSorteioConcluido = null;
let ultimaAcaoFoiCliqueNoFiltro = false;
let ultimaAcaoFoiCliqueNoPote = false;

let poteVisualizacaoAtivo = 1;

function alternarFiltroFases(event) {
  event.stopPropagation();
  const filtroLista = document.querySelector('.filtro-fase-lista');
  if (filtroLista) {
    filtroLista.classList.toggle('hidden');
    filtroAberto = !filtroLista.classList.contains('hidden');
  }
}

// INÍCIO DA ALTERAÇÃO: Adicionado 'letraGrupo' como parâmetro
/**
 * Gera o HTML para um único card de equipe, aplicando a cor de texto correta.

/**
 * Gera o HTML para um único card de equipe, aplicando a cor de texto correta.
/**
 * Gera o HTML para um único card de equipe, aplicando a cor de texto correta.
 * @param {string} equipe - O nome da equipe.
 * @param {string} letraGrupo - A letra do grupo da equipe.
 * @param {boolean} [isPote1=false] - Verdadeiro se a equipe for da primeira coluna.
 * @returns {string} - O HTML do card da equipe.
 */
function gerarCardSorteado(equipe, letraGrupo, isPote1 = false) {
    const escudo = getEscudoPath(equipe);
    const nomeFormatado = formatarNomeExibicao(equipe);
    const pais = getPais(equipe);
    const estiloCor = isPote1 ? 'style="color: #000;"' : 'style="color: #FFF;"';

    // Se o grupo for 'FINAL', exibe apenas 'F'
    const displayGrupo = letraGrupo === 'FINAL' ? 'F' : letraGrupo;

    // Adiciona o indicador de grupo
    const groupIndicatorHTML = displayGrupo ? `<div class="grupo-letra-indicator">${displayGrupo}</div>` : '';

    return `
        <div class="card-vazio card-sorteado">
           ${groupIndicatorHTML}
           <img src="${escudo}" class="escudo-sorteado" alt="${nomeFormatado}" onerror="this.onerror=null; this.src='images/default.png';">
           <span class="nome-sorteado" ${estiloCor}>${nomeFormatado}</span>
           <div class="pais-sorteado">${pais}</div>
        </div>`;
}
// FIM DA ALTERAÇÃO

document.addEventListener('click', function(e) {
  const filtroContainer = document.querySelector('.filtro-fase-container');
  if (filtroAberto && filtroContainer && !filtroContainer.contains(e.target)) {
    document.querySelector('.filtro-fase-lista')?.classList.add('hidden');
    filtroAberto = false;
  }
});

async function filtrarSorteioPorFase(fase, elementoClicado) {
    // A mudança principal está aqui: só altera o estado da ação se houver um clique.
    if (elementoClicado) {
        ultimaAcaoFoiCliqueNoFiltro = true;
        ultimaAcaoFoiCliqueNoPote = false;
    }
    
    window.ultimaFaseSorteio = fase;

    document.querySelectorAll('.filtro-fase-lista .filtro-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('onclick')?.includes(`'${fase}'`));
    });

    const mapaNomesFase = {
        'primeiraFase': 'Primeira Fase', 'segundaFase': 'Segunda Fase',
        'terceiraFase': 'Terceira Fase', 'quartaFase': 'Quarta Fase', 'final': 'Fase Final'
    };
    
    document.getElementById('fase-selecionada').textContent = mapaNomesFase[fase] || "Selecionar Fase";

    const filtroLista = document.querySelector('.filtro-fase-lista');
    if (filtroLista) filtroLista.classList.add('hidden');
    filtroAberto = false;

    const mapaBotoesAcao = {
        'primeiraFase': 'sortearGruposPorPotes()', 'segundaFase': 'gerarSegundaFaseSorteio()',
        'terceiraFase': 'gerarTerceiraFaseSorteio()', 'quartaFase': 'gerarQuartaFaseSorteio()', 'final': 'gerarFaseFinalSorteio()'
    };
    
    document.querySelectorAll('.botoes-sorteio.menu-sorteio-superior button').forEach(btn => {
        btn.classList.remove('active', 'viewing');
    });

    const seletorBotao = `.botoes-sorteio.menu-sorteio-superior button[onclick="${mapaBotoesAcao[fase]}"]`;
    const botaoParaDestacar = document.querySelector(seletorBotao);

    if (botaoParaDestacar) {
        if (fase === ultimoSorteioConcluido && !ultimaAcaoFoiCliqueNoFiltro) {
            botaoParaDestacar.classList.add('active');
        } else {
            botaoParaDestacar.classList.add('viewing');
        }
    }
    
    if (fase === 'primeiraFase') exibirSorteioPrimeiraFase();
    else if (fase === 'segundaFase') exibirSorteioSegundaFase();
    else if (fase === 'terceiraFase') exibirSorteioTerceiraFase();
    else if (fase === 'quartaFase') exibirSorteioQuartaFase();
    else if (fase === 'final') exibirSorteioFaseFinal();
}


function sortearGruposPorPotes() {
  ultimaAcaoFoiCliqueNoPote = false;
   ultimaAcaoFoiCliqueNoFiltro = false; // <-- Adicione esta linha
  if (!potes || Object.values(potes).some(p => p.length < 5)) {
    alert("Erro: Preencha todos os 4 potes com 5 equipes cada antes de sortear.");
    return;
  }
  
  dadosGrupos = {}; 
  dadosJogos = {}; 
  resultados = {}; 
  historicoClassificacao = {};
  ultimoSorteioConcluido = null;
  limparFasesSubsequentes('primeiraFase');
  
  const potesParaSortear = {
    pote1: [...potes.pote1].sort(() => Math.random() - 0.5),
    pote2: [...potes.pote2].sort(() => Math.random() - 0.5),
    pote3: [...potes.pote3].sort(() => Math.random() - 0.5),
    pote4: [...potes.pote4].sort(() => Math.random() - 0.5)
  };

  dadosGrupos = { A: [], B: [], C: [], D: [], E: [] };

  for (let grupo in dadosGrupos) {
    dadosGrupos[grupo].push(
      potesParaSortear.pote1.pop(),
      potesParaSortear.pote2.pop(),
      potesParaSortear.pote3.pop(),
      potesParaSortear.pote4.pop()
    );
  }

  dadosJogos = {};
  for (let grupo in dadosGrupos) {
    dadosJogos[grupo] = gerarRodadas(dadosGrupos[grupo], grupo);
  }

  ultimoSorteioConcluido = 'primeiraFase';
  poteVisualizacaoAtivo = 1;
  filtrarSorteioPorFase('primeiraFase');
}

function gerarSegundaFaseSorteio() {
  ultimaAcaoFoiCliqueNoPote = false;
   ultimaAcaoFoiCliqueNoFiltro = false; // <-- Adicione esta linha
  if (!dadosGrupos || Object.keys(dadosGrupos).length === 0) {
    alert("Erro: Gere a Primeira Fase antes de continuar.");
    return;
  }
  const classificados = calcularClassificacao();
  if (!classificados || classificados.length < 16) {
    alert("Erro: Não há times classificados suficientes para a segunda fase. Jogue as partidas.");
    return;
  }
  limparFasesSubsequentes('segundaFase');

  const pote1_sf = classificados.slice(0, 4).map(e => e.nome);
  const pote2_sf = classificados.slice(4, 8).map(e => e.nome);
  const pote3_sf = classificados.slice(8, 12).map(e => e.nome);
  const pote4_sf = classificados.slice(12, 16).map(e => e.nome);

  pote1_sf.sort(() => Math.random() - 0.5);
  pote2_sf.sort(() => Math.random() - 0.5);
  pote3_sf.sort(() => Math.random() - 0.5);
  pote4_sf.sort(() => Math.random() - 0.5);

  dadosSegundaFase = {
    A: [pote1_sf.pop(), pote2_sf.pop(), pote3_sf.pop(), pote4_sf.pop()],
    B: [pote1_sf.pop(), pote2_sf.pop(), pote3_sf.pop(), pote4_sf.pop()],
    C: [pote1_sf.pop(), pote2_sf.pop(), pote3_sf.pop(), pote4_sf.pop()],
    D: [pote1_sf.pop(), pote2_sf.pop(), pote3_sf.pop(), pote4_sf.pop()]
  };
  
  jogosSegundaFase = {};
  for (let grupo in dadosSegundaFase) {
      jogosSegundaFase[grupo] = gerarRodadas(dadosSegundaFase[grupo], grupo);
  }
  
  ultimoSorteioConcluido = 'segundaFase';
  poteVisualizacaoAtivo = 1; 
  filtrarSorteioPorFase('segundaFase');
}

function gerarTerceiraFaseSorteio() {
    ultimaAcaoFoiCliqueNoPote = false;
     ultimaAcaoFoiCliqueNoFiltro = false; // <-- Adicione esta linha
    if (!dadosSegundaFase || Object.keys(dadosSegundaFase).length === 0) {
        alert("Erro: Gere a Segunda Fase antes de continuar.");
        return;
    }
    const classificados = calcularClassificacao();
    if (!classificados || classificados.length < 12) {
        alert("Erro: Não há times classificados suficientes para a terceira fase. Jogue as partidas.");
        return;
    }
    limparFasesSubsequentes('terceiraFase');

    const pote1_tf = classificados.slice(0, 3).map(e => e.nome);
    const pote2_tf = classificados.slice(3, 6).map(e => e.nome);
    const pote3_tf = classificados.slice(6, 9).map(e => e.nome);
    const pote4_tf = classificados.slice(9, 12).map(e => e.nome);

    pote1_tf.sort(() => Math.random() - 0.5);
    pote2_tf.sort(() => Math.random() - 0.5);
    pote3_tf.sort(() => Math.random() - 0.5);
    pote4_tf.sort(() => Math.random() - 0.5);

    dadosTerceiraFase = {
        A: [pote1_tf.pop(), pote2_tf.pop(), pote3_tf.pop(), pote4_tf.pop()],
        B: [pote1_tf.pop(), pote2_tf.pop(), pote3_tf.pop(), pote4_tf.pop()],
        C: [pote1_tf.pop(), pote2_tf.pop(), pote3_tf.pop(), pote4_tf.pop()]
    };

    jogosTerceiraFase = {};
    for (let grupo in dadosTerceiraFase) jogosTerceiraFase[grupo] = gerarRodadas(dadosTerceiraFase[grupo], grupo);
    
    ultimoSorteioConcluido = 'terceiraFase';
    poteVisualizacaoAtivo = 1;
    filtrarSorteioPorFase('terceiraFase');
}

function gerarQuartaFaseSorteio() {
    ultimaAcaoFoiCliqueNoPote = false;
     ultimaAcaoFoiCliqueNoFiltro = false; // <-- Adicione esta linha
    if (!dadosTerceiraFase || Object.keys(dadosTerceiraFase).length === 0) {
        alert("Erro: Gere a Terceira Fase antes de continuar.");
        return;
    }
    const classificados = calcularClassificacao();
    if (!classificados || classificados.length < 8) {
        alert("Erro: Não há times classificados suficientes para a quarta fase. Jogue as partidas.");
        return;
    }
    limparFasesSubsequentes('quartaFase');

    const pote1_qf = classificados.slice(0, 2).map(e => e.nome);
    const pote2_qf = classificados.slice(2, 4).map(e => e.nome);
    const pote3_qf = classificados.slice(4, 6).map(e => e.nome);
    const pote4_qf = classificados.slice(6, 8).map(e => e.nome);

    pote1_qf.sort(() => Math.random() - 0.5);
    pote2_qf.sort(() => Math.random() - 0.5);
    pote3_qf.sort(() => Math.random() - 0.5);
    pote4_qf.sort(() => Math.random() - 0.5);

    dadosQuartaFase = {
        A: [pote1_qf.pop(), pote2_qf.pop(), pote3_qf.pop(), pote4_qf.pop()],
        B: [pote1_qf.pop(), pote2_qf.pop(), pote3_qf.pop(), pote4_qf.pop()]
    };
    
    jogosQuartaFase = {};
    for (let grupo in dadosQuartaFase) jogosQuartaFase[grupo] = gerarRodadas(dadosQuartaFase[grupo], grupo);
    
    ultimoSorteioConcluido = 'quartaFase';
    poteVisualizacaoAtivo = 1;
    filtrarSorteioPorFase('quartaFase');
}

function gerarFaseFinalSorteio() {
    ultimaAcaoFoiCliqueNoPote = false;
     ultimaAcaoFoiCliqueNoFiltro = false; // <-- Adicione esta linha
    if (!dadosQuartaFase || Object.keys(dadosQuartaFase).length === 0) {
        alert("Erro: Gere a Quarta Fase antes de continuar.");
        return;
    }
    const classificados = calcularClassificacao().slice(0, 4);
    if (!classificados || classificados.length < 4) {
        alert("Erro: Não há times classificados suficientes para a fase final. Jogue as partidas.");
        return;
    }
    limparFasesSubsequentes('final');
    
    dadosFinal = { FINAL: classificados.map(t => t.nome) };
    jogosFinal = {};
    for (let grupo in dadosFinal) jogosFinal[grupo] = gerarRodadas(dadosFinal[grupo], grupo);
    
    ultimoSorteioConcluido = 'final';
    filtrarSorteioPorFase('final');
}

function limparFasesSubsequentes(faseSendoGerada) {
    switch (faseSendoGerada) {
        case 'primeiraFase':
            dadosSegundaFase = {}; jogosSegundaFase = {};
        case 'segundaFase':
            dadosTerceiraFase = {}; jogosTerceiraFase = {};
        case 'terceiraFase':
            dadosQuartaFase = {}; jogosQuartaFase = {};
        case 'quartaFase':
            dadosFinal = {}; jogosFinal = {};
        case 'final':
            break;
    }

    let minGlobalRoundParaLimpar = 99;
    if (faseSendoGerada === 'primeiraFase') minGlobalRoundParaLimpar = 7;
    if (faseSendoGerada === 'segundaFase') minGlobalRoundParaLimpar = 13;
    if (faseSendoGerada === 'terceiraFase') minGlobalRoundParaLimpar = 19;
    if (faseSendoGerada === 'quartaFase') minGlobalRoundParaLimpar = 25;

    for (let id in resultados) {
        const partes = id.split('_');
        let faseDoJogo, rodadaDoJogo;
        if (id.startsWith('SF_')) { faseDoJogo = 'segundaFase'; rodadaDoJogo = parseInt(partes[2]); }
        else if (id.startsWith('TF_')) { faseDoJogo = 'terceiraFase'; rodadaDoJogo = parseInt(partes[2]); }
        else if (id.startsWith('QF_')) { faseDoJogo = 'quartaFase'; rodadaDoJogo = parseInt(partes[2]); }
        else if (id.startsWith('FIN_')) { faseDoJogo = 'final'; rodadaDoJogo = parseInt(partes[2]); }
        else { continue; }

        const rodadaGlobalDoResultado = obterRodadaGlobal(faseDoJogo, rodadaDoJogo);
        if (rodadaGlobalDoResultado >= minGlobalRoundParaLimpar) {
            delete resultados[id];
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

function atualizarDestaqueBotoesPote() {
    const potesButtons = document.querySelectorAll('#botoes-potes-container button');
    const classeDestaque = ultimaAcaoFoiCliqueNoPote ? 'active' : 'viewing';
    
    potesButtons.forEach(button => {
        button.classList.remove('active', 'viewing');
        const buttonPoteNum = parseInt(button.textContent.replace('Pote ', ''));
        if (buttonPoteNum === poteVisualizacaoAtivo) {
            button.classList.add(classeDestaque);
        }
    });
}

function exibirSorteioFaseFinal() {
    const containerGrupos = document.getElementById("grupos");
    if (!containerGrupos) return;
    let html = `<div class="grid-vazio-container">`;
    const tituloPoteBase = `Pote ${poteVisualizacaoAtivo}`;
    html += `<div class="card-vazio card-pote-titulo">${tituloPoteBase}</div>`;
    for (let i = 0; i < 3; i++) {
        html += `<div class="card-vazio card-coluna-titulo">Casa</div>`;
        html += `<div class="card-vazio card-coluna-titulo">Fora</div>`;
    }
    const ordemDosGrupos = ['FINAL']; 
    ordemDosGrupos.forEach(letraGrupo => {
        if (dadosFinal && dadosFinal[letraGrupo]) {
            const timesDoGrupo = dadosFinal[letraGrupo];
            const timeBase = timesDoGrupo[poteVisualizacaoAtivo - 1];
            const timesAdversarios = timesDoGrupo.filter((_, index) => index !== poteVisualizacaoAtivo - 1);
            html += gerarCardSorteado(timeBase, letraGrupo, true);
            timesAdversarios.forEach(adversario => {
                html += gerarCardSorteado(adversario, letraGrupo);
                html += gerarCardSorteado(adversario, letraGrupo);
            });
        } else {
            for (let j = 0; j < 7; j++) {
                html += '<div class="card-vazio"></div>';
            }
        }
    });
    html += `</div>`;
    containerGrupos.innerHTML = html;
    if (typeof atualizarFavoritosNaTela === 'function') {
        atualizarFavoritosNaTela();
    }
    atualizarDestaqueBotoesPote();
}

function exibirSorteioQuartaFase() {
    const containerGrupos = document.getElementById("grupos");
    if (!containerGrupos) return;
    let html = `<div class="grid-vazio-container">`;
    const tituloPoteBase = `Pote ${poteVisualizacaoAtivo}`;
    html += `<div class="card-vazio card-pote-titulo">${tituloPoteBase}</div>`;
    for (let i = 0; i < 3; i++) {
        html += `<div class="card-vazio card-coluna-titulo">Casa</div>`;
        html += `<div class="card-vazio card-coluna-titulo">Fora</div>`;
    }
    const ordemDosGrupos = ['A', 'B'];
    ordemDosGrupos.forEach(letraGrupo => {
        if (dadosQuartaFase && dadosQuartaFase[letraGrupo]) {
            const timesDoGrupo = dadosQuartaFase[letraGrupo];
            const timeBase = timesDoGrupo[poteVisualizacaoAtivo - 1];
            const timesAdversarios = timesDoGrupo.filter((_, index) => index !== poteVisualizacaoAtivo - 1);
            html += gerarCardSorteado(timeBase, letraGrupo, true);
            timesAdversarios.forEach(adversario => {
                html += gerarCardSorteado(adversario, letraGrupo);
                html += gerarCardSorteado(adversario, letraGrupo);
            });
        } else {
            for (let j = 0; j < 7; j++) {
                html += '<div class="card-vazio"></div>';
            }
        }
    });
    html += `</div>`;
    containerGrupos.innerHTML = html;
    if (typeof atualizarFavoritosNaTela === 'function') {
        atualizarFavoritosNaTela();
    }
    atualizarDestaqueBotoesPote();
}

function exibirSorteioTerceiraFase() {
    const containerGrupos = document.getElementById("grupos");
    if (!containerGrupos) return;
    let html = `<div class="grid-vazio-container">`;
    const tituloPoteBase = `Pote ${poteVisualizacaoAtivo}`;
    html += `<div class="card-vazio card-pote-titulo">${tituloPoteBase}</div>`;
    for (let i = 0; i < 3; i++) {
        html += `<div class="card-vazio card-coluna-titulo">Casa</div>`;
        html += `<div class="card-vazio card-coluna-titulo">Fora</div>`;
    }
    const ordemDosGrupos = ['A', 'B', 'C'];
    ordemDosGrupos.forEach(letraGrupo => {
        if (dadosTerceiraFase && dadosTerceiraFase[letraGrupo]) {
            const timesDoGrupo = dadosTerceiraFase[letraGrupo];
            const timeBase = timesDoGrupo[poteVisualizacaoAtivo - 1];
            const timesAdversarios = timesDoGrupo.filter((_, index) => index !== poteVisualizacaoAtivo - 1);
            html += gerarCardSorteado(timeBase, letraGrupo, true);
            timesAdversarios.forEach(adversario => {
                html += gerarCardSorteado(adversario, letraGrupo);
                html += gerarCardSorteado(adversario, letraGrupo);
            });
        } else {
            for (let j = 0; j < 7; j++) {
                html += '<div class="card-vazio"></div>';
            }
        }
    });
    html += `</div>`;
    containerGrupos.innerHTML = html;
    if (typeof atualizarFavoritosNaTela === 'function') {
        atualizarFavoritosNaTela();
    }
    atualizarDestaqueBotoesPote();
}

function exibirSorteioSegundaFase() {
    const containerGrupos = document.getElementById("grupos");
    if (!containerGrupos) return;
    let html = `<div class="grid-vazio-container">`;
    const tituloPoteBase = `Pote ${poteVisualizacaoAtivo}`;
    html += `<div class="card-vazio card-pote-titulo">${tituloPoteBase}</div>`;
    for (let i = 0; i < 3; i++) {
        html += `<div class="card-vazio card-coluna-titulo">Casa</div>`;
        html += `<div class="card-vazio card-coluna-titulo">Fora</div>`;
    }
    const ordemDosGrupos = ['A', 'B', 'C', 'D'];
    ordemDosGrupos.forEach(letraGrupo => {
        if (dadosSegundaFase && dadosSegundaFase[letraGrupo]) {
            const timesDoGrupo = dadosSegundaFase[letraGrupo];
            const timeBase = timesDoGrupo[poteVisualizacaoAtivo - 1];
            const timesAdversarios = timesDoGrupo.filter((_, index) => index !== poteVisualizacaoAtivo - 1);
            html += gerarCardSorteado(timeBase, letraGrupo, true);
            timesAdversarios.forEach(adversario => {
                html += gerarCardSorteado(adversario, letraGrupo);
                html += gerarCardSorteado(adversario, letraGrupo);
            });
        } else {
            for (let j = 0; j < 7; j++) {
                html += '<div class="card-vazio"></div>';
            }
        }
    });
    html += `</div>`;
    containerGrupos.innerHTML = html;
    if (typeof atualizarFavoritosNaTela === 'function') {
        atualizarFavoritosNaTela();
    }
    atualizarDestaqueBotoesPote();
}


function exibirSorteioPrimeiraFase() {
    const containerGrupos = document.getElementById("grupos");
    if (!containerGrupos) return;
    let html = `<div class="grid-vazio-container">`;
    const tituloPoteBase = `Pote ${poteVisualizacaoAtivo}`;
    html += `<div class="card-vazio card-pote-titulo">${tituloPoteBase}</div>`;
    for (let i = 0; i < 3; i++) {
        html += `<div class="card-vazio card-coluna-titulo">Casa</div>`;
        html += `<div class="card-vazio card-coluna-titulo">Fora</div>`;
    }
    const ordemDosGrupos = ['A', 'B', 'C', 'D', 'E'];
    ordemDosGrupos.forEach(letraGrupo => {
        if (dadosGrupos && dadosGrupos[letraGrupo]) {
            const timesDoGrupo = dadosGrupos[letraGrupo];
            const timeBase = timesDoGrupo[poteVisualizacaoAtivo - 1];
            const timesAdversarios = timesDoGrupo.filter((_, index) => index !== poteVisualizacaoAtivo - 1);
            html += gerarCardSorteado(timeBase, letraGrupo, true);
            timesAdversarios.forEach(adversario => {
                html += gerarCardSorteado(adversario, letraGrupo);
                html += gerarCardSorteado(adversario, letraGrupo);
            });
        } else {
            for (let j = 0; j < 7; j++) {
                html += '<div class="card-vazio"></div>';
            }
        }
    });
    html += `</div>`;
    containerGrupos.innerHTML = html;
    if (typeof atualizarFavoritosNaTela === 'function') {
        atualizarFavoritosNaTela();
    }
    atualizarDestaqueBotoesPote();
}

function selecionarPoteParaVisualizacao(poteNumero) {
    poteVisualizacaoAtivo = poteNumero;
    // Define explicitamente o estado da ação do usuário
    ultimaAcaoFoiCliqueNoPote = true; 
    ultimaAcaoFoiCliqueNoFiltro = false;
    
    const faseAtual = window.ultimaFaseSorteio;

    if (faseAtual === 'primeiraFase') exibirSorteioPrimeiraFase();
    else if (faseAtual === 'segundaFase') exibirSorteioSegundaFase();
    else if (faseAtual === 'terceiraFase') exibirSorteioTerceiraFase();
    else if (faseAtual === 'quartaFase') exibirSorteioQuartaFase();
    else if (faseAtual === 'final') exibirSorteioFaseFinal();
}