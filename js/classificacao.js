// Variáveis globais
window.resultados = window.resultados || {};
window.historicoClassificacao = window.historicoClassificacao || {};
window.filtroAtual = window.filtroAtual || 'geral';
window.equipes = window.equipes || [];
window.dadosJogos = window.dadosJogos || {};
window.jogosSegundaFase = window.jogosSegundaFase || {};
window.jogosTerceiraFase = window.jogosTerceiraFase || {};
window.jogosQuartaFase = window.jogosQuartaFase || {};
window.jogosFinal = window.jogosFinal || {};
window.dadosGrupos = window.dadosGrupos || {};

// Funções Auxiliares (devem estar disponíveis globalmente)
function getEscudoPath(nomeEquipe) {
  if (!nomeEquipe) return 'images/default.png';
  return `images/escudos/${nomeEquipe.toLowerCase().replace(/ /g, '_')}.png`;
}

function formatarNomeExibicao(nomeEquipe) {
  if (!nomeEquipe) return "";
  return nomeEquipe.split(' (')[0];
}

function getPais(nomeEquipe) {
    if (!nomeEquipe) return "";
    const match = nomeEquipe.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
}

// --- Funções Principais de Classificação ---
function obterRodadaGlobal(fase, rodada) {
  const offsetPorFase = {
    geral: 0,
    segundaFase: 6,
    terceiraFase: 12,
    quartaFase: 18,
    final: 24
  };
  return (offsetPorFase[fase] || 0) + rodada;
}

function salvarClassificacaoGlobal(rodadaGlobal, faseLimite, rodadaLimite) {
  // Chama a função de cálculo passando os limites da rodada atual
  const classificacaoAtual = calcularClassificacao(faseLimite, rodadaLimite);
  historicoClassificacao[`rodadaGlobal_${rodadaGlobal}`] = [...classificacaoAtual];
}

/**
 * Salva o resultado de um jogo, atualiza a classificação e o histórico.
 * Esta função é chamada sempre que um placar é alterado na interface.
 *
 * @param {string} id - O ID único do jogo (ex: 'A_1_0', 'SF_G1_1_0').
 * @param {string} valor - O valor do placar inserido pelo usuário.
 * @param {boolean} casa - True se o placar é do time da casa, false se for do visitante.
 */
function salvarResultado(id, valor, casa) {
  // Inicializa o objeto de resultado para o jogo, se não existir
  if (!window.resultados[id]) {
    window.resultados[id] = { gc: '', gv: '' };
  }

  // Atribui o placar ao time da casa (gc) ou visitante (gv)
  if (casa) {
    window.resultados[id].gc = valor ? parseInt(valor) : '';
  } else {
    window.resultados[id].gv = valor ? parseInt(valor) : '';
  }

  // Divide o ID para extrair informações da partida
  const partes = id.split('_');
  let faseDoJogo;
  let rodadaDoJogo;

  // Determina a fase e a rodada com base no prefixo do ID do jogo
  if (id.startsWith('SF_')) {
    faseDoJogo = 'segundaFase';
    rodadaDoJogo = parseInt(partes[2]) || 1;
  } else if (id.startsWith('TF_')) {
    faseDoJogo = 'terceiraFase';
    rodadaDoJogo = parseInt(partes[2]) || 1;
  } else if (id.startsWith('QF_')) {
    faseDoJogo = 'quartaFase';
    rodadaDoJogo = parseInt(partes[2]) || 1;
  } else if (id.startsWith('FIN_')) {
    faseDoJogo = 'final';
    rodadaDoJogo = parseInt(partes[2]) || 1;
  } else {
    faseDoJogo = 'geral';
    rodadaDoJogo = parseInt(partes[1]) || 1;
  }

  // Atualiza um sistema de histórico secundário (se houver uso)
  atualizarHistoricoClassificacao(faseDoJogo, rodadaDoJogo);

  // Calcula a rodada global para usar como chave única no histórico principal
  const rodadaGlobal = obterRodadaGlobal(faseDoJogo, rodadaDoJogo);

  // Salva o estado da classificação de forma "pura", considerando apenas os jogos até a rodada atual
  // Esta é a correção crucial para o bug de comparação de variação
  salvarClassificacaoGlobal(rodadaGlobal, faseDoJogo, rodadaDoJogo);

  // Atualiza as telas de classificação e jogos na interface do usuário
  exibirClassificacao();
  exibirJogos();
}


function calcularClassificacao(faseLimite, rodadaLimite) {
  const faseAtualSelecionada = faseLimite || window.filtroAtual || 'geral';
  
  const equipesSorteadas = new Set();
  if (dadosGrupos && Object.keys(dadosGrupos).length > 0) {
    Object.values(dadosGrupos).forEach(grupo => {
        grupo.forEach(equipe => equipesSorteadas.add(equipe));
    });
  } else {
      return [];
  }

  let pontos = {};
  const gruposOriginais = {};

  Object.entries(dadosGrupos).forEach(([grupo, times]) => {
    times.forEach((time, index) => {
      gruposOriginais[time] = {
        grupoOrigem: grupo,
        posicaoOrigem: index + 1,
        posicaoGlobal: (['A', 'B', 'C', 'D', 'E'].indexOf(grupo) * 4) + (index + 1)
      };
    });
  });

  Array.from(equipesSorteadas).forEach(eq => {
    pontos[eq] = {
      nome: eq,
      ...gruposOriginais[eq] || { grupoOrigem: '', posicaoOrigem: 0, posicaoGlobal: 0 },
      pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, saldo: 0, ultimosJogos: []
    };
  });

  const ordemFases = ['geral', 'segundaFase', 'terceiraFase', 'quartaFase', 'final'];
  const indiceFaseLimite = faseLimite ? ordemFases.indexOf(faseLimite) : -1;

  for (let id in resultados) {
    const res = resultados[id];
    if (!res || res.gc === '' || res.gv === '') continue;

    let faseDoJogo;
    let rodadaDoJogo;
    let partes = id.split('_');

    if (id.startsWith('SF_')) { faseDoJogo = 'segundaFase'; rodadaDoJogo = parseInt(partes[2]); } 
    else if (id.startsWith('TF_')) { faseDoJogo = 'terceiraFase'; rodadaDoJogo = parseInt(partes[2]); } 
    else if (id.startsWith('QF_')) { faseDoJogo = 'quartaFase'; rodadaDoJogo = parseInt(partes[2]); } 
    else if (id.startsWith('FIN_')) { faseDoJogo = 'final'; rodadaDoJogo = parseInt(partes[2]); }
    else { faseDoJogo = 'geral'; rodadaDoJogo = parseInt(partes[1]); }

    // --- LÓGICA DE FILTRO DO HISTÓRICO ---
    if (faseLimite) {
      const indiceFaseJogo = ordemFases.indexOf(faseDoJogo);
      if (indiceFaseJogo > indiceFaseLimite) continue; // Ignora jogos de fases futuras
      if (indiceFaseJogo === indiceFaseLimite && rodadaDoJogo > rodadaLimite) continue; // Ignora jogos de rodadas futuras na mesma fase
    }
    // --- FIM DA LÓGICA DE FILTRO ---

    const faseIndex = ordemFases.indexOf(faseDoJogo);
    const selecionadaIndex = ordemFases.indexOf(faseAtualSelecionada);
    if (faseIndex > selecionadaIndex && !faseLimite) continue; // Mantém filtro de exibição
    
    const dadosJogo = obterJogoPeloId(id);
    if (!dadosJogo || !pontos[dadosJogo.casa] || !pontos[dadosJogo.visitante]) continue;

    const atualizarTime = (time, golsFeitos, golsSofridos, resultado) => {
      pontos[time].j += 1;
      pontos[time].gp += golsFeitos;
      pontos[time].gc += golsSofridos;
      pontos[time].saldo = pontos[time].gp - pontos[time].gc;
      pontos[time].ultimosJogos.push(resultado);
      if (resultado === 'vitoria') pontos[time].v += 1;
      if (resultado === 'empate') pontos[time].e += 1;
      if (resultado === 'derrota') pontos[time].d += 1;
    };

    if (res.gc > res.gv) {
      atualizarTime(dadosJogo.casa, res.gc, res.gv, 'vitoria');
      atualizarTime(dadosJogo.visitante, res.gv, res.gc, 'derrota');
      pontos[dadosJogo.casa].pts += 3;
    } else if (res.gc < res.gv) {
      atualizarTime(dadosJogo.visitante, res.gv, res.gc, 'vitoria');
      atualizarTime(dadosJogo.casa, res.gc, res.gv, 'derrota');
      pontos[dadosJogo.visitante].pts += 3;
    } else {
      atualizarTime(dadosJogo.casa, res.gc, res.gv, 'empate');
      atualizarTime(dadosJogo.visitante, res.gv, res.gc, 'empate');
      pontos[dadosJogo.casa].pts += 1;
      pontos[dadosJogo.visitante].pts += 1;
    }
  }

  return Object.values(pontos).sort((a, b) => {
    return (b.pts - a.pts || b.v - a.v || b.saldo - a.saldo || b.gp - a.gp || a.posicaoGlobal - b.posicaoGlobal);
  });
}

// No ficheiro ucl atlzd23.06/js/classificacao.js

// ... (previous code)

/**
 * Renderiza a tabela de classificação na tela.
 * Esta função calcula a classificação atual, compara com o histórico para
 * determinar a variação de posição e gera o HTML completo da tabela.
 */
/**
 * Renderiza a tabela de classificação na tela.
 * Esta função calcula a classificação atual, compara com o histórico para
 * determinar a variação de posição e gera o HTML completo da tabela.
 */
/**
 * Renderiza a tabela de classificação na tela.
 * Esta função calcula a classificação atual, compara com o histórico para
 * determinar a variação de posição e gera o HTML completo da tabela.
 */
function exibirClassificacao() {
  // Calcula a classificação atual com base nos resultados dos jogos
  const classificacaoCompleta = calcularClassificacao();
  if (classificacaoCompleta.length === 0) {
      document.getElementById("tabelaClassificacao").innerHTML = "<p style='color: white; text-align: center; margin-top: 2rem;'>Sorteie os grupos para ver a classificação.</p>";
      return;
  }

  // Determina a rodada atual e a rodada anterior para comparação de variação
  const rodadaAtualSendoExibida = determinarRodadaAtualParaFase(filtroAtual);
  const rodadaGlobalAtual = obterRodadaGlobal(filtroAtual, rodadaAtualSendoExibida);
  let classificacaoRodadaAnterior = [];

  // Lógica para buscar o histórico da rodada correta para comparação
  const chaveAnterior = `rodadaGlobal_${rodadaGlobalAtual - 1}`;
  classificacaoRodadaAnterior = historicoClassificacao[chaveAnterior] || [];

  // Adiciona a informação de variação a cada equipe
  const classificacaoComVariacao = classificacaoCompleta.map((equipe, index) => {
    const posicaoAnterior = classificacaoRodadaAnterior.findIndex(e => e.nome === equipe.nome);
    const variacao = posicaoAnterior !== -1 ? posicaoAnterior - index : 0;
    return { ...equipe, variacao };
  });

  // Define o limite de equipes a serem exibidas com base na fase atual
  let limite = classificacaoCompleta.length;
  switch (filtroAtual) {
    case 'segundaFase': limite = 16; break;
    case 'terceiraFase': limite = 12; break;
    case 'quartaFase': limite = 8; break;
    case 'final': limite = 4; break;
  }
  const equipesFiltradas = classificacaoComVariacao.slice(0, limite);

  // Inicia a construção do HTML da tabela de classificação
  let html = `
    <div class="linha-cards header">
        <div class="card-info-header equipe-cabecalho">
            <div class="cabecalho-pos-var">
                <div class="posicao-interno">POS</div>
                <div class="variacao-interno">VAR</div>
            </div>
            <div class="equipe-main-content">
                <span class="nome-equipe-classificacao">EQUIPE</span>
            </div>
        </div>
        <div class="card-info-header">P</div>
        <div class="card-info-header">J</div>
        <div class="card-info-header">V</div>
        <div class="card-info-header">E</div>
        <div class="card-info-header">D</div>
        <div class="card-info-header">GP</div>
        <div class="card-info-header">GC</div>
        <div class="card-info-header">SG</div>
        <div class="card-info-header">%</div>
        <div class="card-info-header">ÚLT. JOGOS</div>
    </div>
    <div class="classificacao-grid">
`;
  // Itera sobre cada equipe para criar sua linha na tabela
  equipesFiltradas.forEach((equipe, index) => {
    const pontosPossiveis = equipe.j * 3;
    const aproveitamento = pontosPossiveis > 0 ? Math.round((equipe.pts / pontosPossiveis) * 100) : 0;

    // ==================================================================
    // INÍCIO DA NOVA LÓGICA DE CORES DINÂMICAS POR FASE
    // ==================================================================
    let cardClasses = '';
    const isRebaixado = (filtroAtual === 'segundaFase' && index >= 12) ||
                        (filtroAtual === 'terceiraFase' && index >= 8) ||
                        (filtroAtual === 'quartaFase' && index >= 4);

    if (isRebaixado) {
        cardClasses += ' rebaixado';
    } else {
        switch (filtroAtual) {
            case 'segundaFase':
                if (index >= 0 && index <= 2) cardClasses += ' posicao-1-a-3';
                else if (index >= 3 && index <= 5) cardClasses += ' posicao-4-a-6';
                else if (index >= 6 && index <= 8) cardClasses += ' posicao-7-a-9';
                else if (index >= 9 && index <= 11) cardClasses += ' posicao-10-a-12';
                break;
            case 'terceiraFase':
                if (index >= 0 && index <= 1) cardClasses += ' posicao-1-a-2';
                else if (index >= 2 && index <= 3) cardClasses += ' posicao-3-a-4';
                else if (index >= 4 && index <= 5) cardClasses += ' posicao-5-a-6';
                else if (index >= 6 && index <= 7) cardClasses += ' posicao-7-a-8';
                break;
            case 'quartaFase':
                if (index === 0) cardClasses += ' posicao-1-a-1';
                else if (index === 1) cardClasses += ' posicao-2-a-2';
                else if (index === 2) cardClasses += ' posicao-3-a-3';
                else if (index === 3) cardClasses += ' posicao-4-a-4';
                break;
            case 'final':
                if (index === 0) cardClasses += ' posicao-ouro';
                else if (index === 1) cardClasses += ' posicao-prata';
                else if (index === 2) cardClasses += ' posicao-bronze';
                else if (index === 3) cardClasses += ' posicao-latao';
                break;
            case 'geral':
            default:
                if (index >= 0 && index <= 3) cardClasses += ' posicao-1-a-4';
                else if (index >= 4 && index <= 7) cardClasses += ' posicao-5-a-8';
                else if (index >= 8 && index <= 11) cardClasses += ' posicao-9-a-12';
                else if (index >= 12 && index <= 15) cardClasses += ' posicao-13-a-16';
                else if (index >= 16) cardClasses += ' rebaixado';
                break;
        }
    }
    // ==================================================================
    // FIM DA NOVA LÓGICA DE CORES
    // ==================================================================

    // Lógica para o ícone de variação de posição
    let variacaoIconHTML = '';
    const valorAbs = Math.abs(equipe.variacao);
    const direcao = equipe.variacao > 0 ? 'subiu' : (equipe.variacao < 0 ? 'desceu' : 'manteve');

    // Gera o HTML do card de variação com as classes e dados corretos para o CSS
    variacaoIconHTML = `<div class="card-variacao ${direcao}" data-variacao="${valorAbs}"></div>`;

    // Gera o HTML para os últimos jogos
    const ultimosJogos = getResultadoUltimosJogosPorFase(equipe.nome, filtroAtual);
    const ultimosJogosHTML = ultimosJogos.reverse().map((res, i) => {
        const isLast = i === ultimosJogos.length - 1;
        const resultClass = `resultado-card ${res} ${isLast ? 'ultimo-resultado' : ''}`;
        const resultLetter = res.charAt(0).toUpperCase();
        return `<div class="${resultClass}"><span>${resultLetter}</span></div>`;
    }).join('');

    // Monta a linha completa da equipe com a nova estrutura
    html += `
      <div class="linha-cards${cardClasses}" data-equipe="${encodeURIComponent(equipe.nome)}">
        <div class="card-info equipe">
          <div class="equipe-main-content">
            <div class="posicao-interno">
              <span class="posicao-numero">${index + 1}</span>
              ${variacaoIconHTML}
            </div>
            <div class="equipe-details">
              <img src="${getEscudoPath(equipe.nome)}" class="escudo-img">
              <div class="equipe-info-bloco">
                <div class="nome-equipe-classificacao">${formatarNomeExibicao(equipe.nome)}</div>
                <div class="pais-equipe-classificacao">${getPais(equipe.nome)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-info"><span>${equipe.pts}</span></div>
        <div class="card-info"><span>${equipe.j}</span></div>
        <div class="card-info"><span>${equipe.v}</span></div>
        <div class="card-info"><span>${equipe.e}</span></div>
        <div class="card-info"><span>${equipe.d}</span></div>
        <div class="card-info"><span>${equipe.gp}</span></div>
        <div class="card-info"><span>${equipe.gc}</span></div>
        <div class="card-info"><span>${equipe.saldo > 0 ? '+' : ''}${equipe.saldo}</span></div>
        <div class="card-info"><span>${aproveitamento}%</span></div>
        <div class="card-info ultimos">${ultimosJogosHTML}</div>
      </div>
    `;
  });

  // Finaliza e insere o HTML na página
  html += `</div>`;
  document.getElementById("tabelaClassificacao").innerHTML = html;
  
  // Atualiza a marcação da equipe favorita, se houver
  if (typeof atualizarFavoritosNaTela === 'function') {
    atualizarFavoritosNaTela();
  }
}
// ... (rest of the code)

function determinarRodadaAtualParaFase(faseAtual) {
  let maxRodadaComResultados = 0;
  for (const id in resultados) {
    const partes = id.split('_');
    let jogoFase;
    let rodadaDoJogo;

    if (id.startsWith('SF_')) {
      jogoFase = 'segundaFase';
      rodadaDoJogo = parseInt(partes[2]) || 1;
    } else if (id.startsWith('TF_')) {
      jogoFase = 'terceiraFase';
      rodadaDoJogo = parseInt(partes[2]) || 1;
    } else if (id.startsWith('QF_')) {
      jogoFase = 'quartaFase';
      rodadaDoJogo = parseInt(partes[2]) || 1;
    } else if (id.startsWith('FIN_')) {
      jogoFase = 'final';
      rodadaDoJogo = parseInt(partes[2]) || 1;
    } else { 
      jogoFase = 'geral';
      rodadaDoJogo = parseInt(partes[1]) || 1;
    }

    if (resultados[id].gc !== '' && resultados[id].gv !== '') {
        if (jogoFase === faseAtual && rodadaDoJogo > maxRodadaComResultados) {
            maxRodadaComResultados = rodadaDoJogo;
        }
    }
  }
  return maxRodadaComResultados === 0 ? 1 : maxRodadaComResultados;
}

function atualizarHistoricoClassificacao(fase, rodada, isFinalDaFase = false) {
  const classificacaoAtual = calcularClassificacao();
  if (isFinalDaFase) {
    historicoClassificacao[`${fase}_final`] = [...classificacaoAtual];
  } else {
    historicoClassificacao[`${fase}_rodada_${rodada}`] = [...classificacaoAtual];
  }
}

function filtrarClassificacao(fase) {
  filtroAtual = fase;
  document.querySelectorAll('.botoes-classificacao button').forEach(button => {
    button.classList.remove('active');
  });
  const botaoAtivo = document.querySelector(`.botoes-classificacao button[onclick*="${fase}"]`);
  if (botaoAtivo) {
    botaoAtivo.classList.add('active');
  }
  exibirClassificacao();
  atualizarFavoritosNaTela();
}

function getResultadoUltimosJogosPorFase(equipeNome, fase) {
    const jogosDaFase = [];

    const processarJogos = (dadosDaFase, prefixo) => {
        if (!dadosDaFase) return;
        for (const grupo in dadosDaFase) {
            for (const rodadaData of dadosDaFase[grupo]) {
                rodadaData.jogos.forEach((jogo, i) => {
                    if (jogo.casa === equipeNome || jogo.visitante === equipeNome) {
                        const id = prefixo ? `${prefixo}_${grupo}_${rodadaData.rodada}_${i}` : `${grupo}_${rodadaData.rodada}_${i}`;
                        const res = resultados[id];
                        if (res && res.gc !== '' && res.gv !== '') {
                            jogosDaFase.push({
                                rodada: rodadaData.rodada,
                                resultado: calcularResultado(equipeNome, jogo, res)
                            });
                        }
                    }
                });
            }
        }
    };

    switch (fase) {
        case 'geral':
            processarJogos(dadosJogos, '');
            break;
        case 'segundaFase':
            processarJogos(jogosSegundaFase, 'SF');
            break;
        case 'terceiraFase':
            processarJogos(jogosTerceiraFase, 'TF');
            break;
        case 'quartaFase':
            processarJogos(jogosQuartaFase, 'QF');
            break;
        case 'final':
            processarJogos(jogosFinal, 'FIN');
            break;
    }

    jogosDaFase.sort((a, b) => b.rodada - a.rodada);
    return jogosDaFase.slice(0, 6).map(j => j.resultado);
}

function calcularResultado(equipeNome, jogo, res) {
  const foiCasa = jogo.casa === equipeNome;
  const gc = parseInt(res.gc, 10);
  const gv = parseInt(res.gv, 10);

  if (foiCasa) {
    return gc > gv ? 'vitoria' : (gc < gv ? 'derrota' : 'empate');
  } else {
    return gv > gc ? 'vitoria' : (gv < gc ? 'derrota' : 'empate');
  }
}

function obterFasePorRodadaGlobal(rodadaGlobal) {
  if (rodadaGlobal >= 1 && rodadaGlobal <= 6) return 'geral';
  if (rodadaGlobal >= 7 && rodadaGlobal <= 12) return 'segundaFase';
  if (rodadaGlobal >= 13 && rodadaGlobal <= 18) return 'terceiraFase';
  if (rodadaGlobal >= 19 && rodadaGlobal <= 24) return 'quartaFase';
  if (rodadaGlobal >= 25) return 'final';
  return 'geral';
}

function buscarUltimaRodadaDaFaseAnterior(faseAtual, rodadaGlobalAtual) {
  const faseAnterior = {
    segundaFase: 'geral',
    terceiraFase: 'segundaFase',
    quartaFase: 'terceiraFase',
    final: 'quartaFase'
  }[faseAtual];

  for (let i = rodadaGlobalAtual - 1; i >= 1; i--) {
    if (historicoClassificacao[`rodadaGlobal_${i}`]) {
      const faseOrigem = obterFasePorRodadaGlobal(i);
      if (faseOrigem === faseAnterior) return i;
    }
  }
  return null;
}

function obterJogoPeloId(id) {
    const partes = id.split('_');
    if (id.startsWith('SF_')) {
        const [, grupo, rodada, index] = partes;
        return jogosSegundaFase[grupo]?.find(r => r.rodada === parseInt(rodada))?.jogos[parseInt(index)];
    } else if (id.startsWith('TF_')) {
        const [, grupo, rodada, index] = partes;
        return jogosTerceiraFase[grupo]?.find(r => r.rodada === parseInt(rodada))?.jogos[parseInt(index)];
    } else if (id.startsWith('QF_')) {
        const [, grupo, rodada, index] = partes;
        return jogosQuartaFase[grupo]?.find(r => r.rodada === parseInt(rodada))?.jogos[parseInt(index)];
    } else if (id.startsWith('FIN_')) {
        const [, grupo, rodada, index] = partes;
        return jogosFinal[grupo]?.find(r => r.rodada === parseInt(rodada))?.jogos[parseInt(index)];
    } else {
        const [grupo, rodada, index] = partes;
        return dadosJogos[grupo]?.[parseInt(rodada) - 1]?.jogos[parseInt(index)];
    }
}