let rodadaAtiva = 1;
let faseAtiva = 'grupo';
let filtroJogosAtual = 'grupo';
let rodadaFiltrada = 1;
let datasHoras = {};

/**
 * Filtra os jogos por fase. Apenas atualiza o estado e chama a função de renderização.
 * @param {string} fase - A chave da fase a ser exibida (ex: 'grupo', 'segundaFase').
 */
function filtrarJogos(fase) {
  faseAtiva = fase;
  filtroJogosAtual = fase;
  rodadaAtiva = 1; // Sempre reseta para a Rodada 1 ao mudar de fase
  rodadaFiltrada = 1;
  exibirJogos(); // Apenas chama a função que desenha a tela
}

/**
 * Filtra os jogos por rodada. Apenas atualiza o estado e chama a função de renderização.
 * @param {number} rodada - O número da rodada a ser exibida.
 */
function filtrarPorRodada(rodada) {
  rodadaAtiva = rodada;
  rodadaFiltrada = rodada;
  exibirJogos(); // Apenas chama a função que desenha a tela
}

/**
 * Função principal que desenha TODA a tela de jogos, incluindo os destaques dos botões.
 */
/**
 * Função principal que desenha TODA a tela de jogos, incluindo os destaques dos botões.
 */
function exibirJogos() {
  let html = "";
  const containerJogos = document.getElementById("jogosRodadas");

  const fases = [
    { nome: "Fase de Grupos", dados: dadosJogos, prefixo: "", chave: "grupo" },
    { nome: "Segunda Fase", dados: jogosSegundaFase, prefixo: "SF", chave: "segundaFase" },
    { nome: "Terceira Fase", dados: jogosTerceiraFase, prefixo: "TF", chave: "terceiraFase" },
    { nome: "Quarta Fase", dados: jogosQuartaFase, prefixo: "QF", chave: "quartaFase" },
    { nome: "Fase Final", dados: jogosFinal, prefixo: "FIN", chave: "final" }
  ];

  const faseDados = fases.find(f => f.chave === faseAtiva);

  if (faseDados && faseDados.dados && Object.keys(faseDados.dados).length > 0) {
    const { dados, prefixo } = faseDados;
    const grupos = Object.keys(dados);
    const rodadasPorGrupo = dados[grupos[0]]?.length || 0;

    if (rodadaAtiva <= rodadasPorGrupo) {
      html += `<div class="grupo-jogos">`;
      grupos.forEach(grupo => {
        const rodadaAtual = dados[grupo]?.find(r => r.rodada === rodadaAtiva);
        if (rodadaAtual) {
          rodadaAtual.jogos.forEach((jogo, i) => {
            const id = prefixo ? `${prefixo}_${grupo}_${rodadaAtiva}_${i}` : `${grupo}_${rodadaAtiva}_${i}`;
            const res = resultados[id] || { gc: '', gv: '' };
            const dataSalva = datasHoras[id] || '';
            
            let diaDaSemanaTexto = '';
            if (dataSalva) {
                const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
                const dataObj = new Date(dataSalva);
                if (!isNaN(dataObj.getTime())) {
                    diaDaSemanaTexto = dias[dataObj.getDay()];
                }
            }

            const placarCasa = res.gc !== '' ? parseInt(res.gc, 10) : -1;
            const placarVisitante = res.gv !== '' ? parseInt(res.gv, 10) : -1;

            const indicadorCasa = placarCasa > placarVisitante ? '<span class="indicador-vitoria">◀</span>' : '';
            const indicadorVisitante = placarVisitante > placarCasa ? '<span class="indicador-vitoria">▶</span>' : '';

            // Busca as cores para as equipes, incluindo a terciária
            const coresCasa = getCoresEquipe(jogo.casa);
            const coresVisitante = getCoresEquipe(jogo.visitante);
            
            html += `
              <div class="jogo-card-grupo">
                <div class="card-partida-visual">
                    <div class="equipe-lado equipe-casa">
                        <div class="logo-area">
                            <div class="banner-1 banner-casa-1" style="background-color: ${coresCasa.primaria};"></div>
                            <div class="banner-3 banner-casa-3" style="background-color: ${coresCasa.terciaria};"></div>
                            <div class="banner-2 banner-casa-2" style="background-color: ${coresCasa.secundaria};"></div>
                            <img src="${getEscudoPath(jogo.casa)}" alt="Escudo ${formatarNomeExibicao(jogo.casa)}" class="escudo-partida">
                        </div>
                        <div class="detalhes-equipe-partida">
                            <span class="nome-equipe-partida">${formatarNomeExibicao(jogo.casa)}</span>
                            <span class="pais-equipe-partida">${getPais(jogo.casa)}</span>
                        </div>
                    </div>

                    <div class="info-partida">
                        <div class="detalhes-box">
                           <span class="dia-semana" id="dia-semana-${id}">${diaDaSemanaTexto}</span>
                           <input type="datetime-local" class="input-data-hora" value="${dataSalva}" oninput="salvarDataHora('${id}', this.value)">
                        </div>
                        <div class="placar-partida">
                            <div class="placar-valor">
                                <div class="indicador-container">${indicadorCasa}</div>
                                <input type="number" class="placar-input" value="${res.gc}" onchange="salvarResultado('${id}', this.value, true)" aria-label="Gols ${formatarNomeExibicao(jogo.casa)}">
                            </div>
                            <span class="placar-separador">-</span>
                            <div class="placar-valor">
                                <input type="number" class="placar-input" value="${res.gv}" onchange="salvarResultado('${id}', this.value, false)" aria-label="Gols ${formatarNomeExibicao(jogo.visitante)}">
                                <div class="indicador-container">${indicadorVisitante}</div>
                            </div>
                        </div>
                        <div class="formato-header">Grupo ${grupo}</div>
                    </div>

                    <div class="equipe-lado equipe-visitante">
                        <div class="logo-area">
                            <div class="banner-1 banner-visitante-1" style="background-color: ${coresVisitante.primaria};"></div>
                            <div class="banner-3 banner-visitante-3" style="background-color: ${coresVisitante.terciaria};"></div>
                            <div class="banner-2 banner-visitante-2" style="background-color: ${coresVisitante.secundaria};"></div>
                            <img src="${getEscudoPath(jogo.visitante)}" alt="Escudo ${formatarNomeExibicao(jogo.visitante)}" class="escudo-partida">
                        </div>
                        <div class="detalhes-equipe-partida">
                            <span class="pais-equipe-partida">${getPais(jogo.visitante)}</span>
                            <span class="nome-equipe-partida">${formatarNomeExibicao(jogo.visitante)}</span>
                        </div>
                    </div>
                </div>
              </div>
            `;
          });
        }
      });
      html += `</div>`;
    }
  }
  
  if(containerJogos) containerJogos.innerHTML = html || "<p style='color: white; text-align: center; margin-top: 2rem;'>Nenhum jogo para exibir. Gere os grupos na tela de sorteio.</p>";

  // Atualiza os botões de filtro de fase
  document.querySelectorAll('.fase-botoes-jogos button').forEach(button => {
    const buttonFase = button.getAttribute('onclick').match(/'([^']+)'/)[1];
    button.classList.toggle('active', buttonFase === faseAtiva);
  });

  // Atualiza os botões de filtro de rodada
  document.querySelectorAll('.rodada-btn').forEach(btn => {
    const btnRodada = parseInt(btn.textContent.replace('Rodada ', ''));
    btn.classList.toggle('selecionada', btnRodada === rodadaAtiva);
  });
  
  // Garante que a equipe favorita seja destacada
  if (typeof atualizarFavoritosNaTela === 'function') {
    atualizarFavoritosNaTela(); 
  }
}

function gerarRodadas(times, grupo) {
  const numTimes = times.length;
  if (numTimes === 0) return [];
  if (numTimes % 2 !== 0) times.push("BYE");
  const turno = [], returno = [], isGrupoACE = ['A', 'C', 'E'].includes(grupo);
  if (numTimes === 4) {
    turno.push([{ casa: times[0], visitante: times[2] }, { casa: times[3], visitante: times[1] }]);
    turno.push([{ casa: times[3], visitante: times[0] }, { casa: times[1], visitante: times[2] }]);
    turno.push([{ casa: times[0], visitante: times[1] }, { casa: times[2], visitante: times[3] }]);
  } else {
    const metade = numTimes / 2; let timesCircular = times.slice(1);
    for (let i = 0; i < numTimes - 1; i++) {
      let jogosRodada = [{ casa: times[0], visitante: timesCircular[timesCircular.length - 1] }];
      for (let j = 0; j < metade - 1; j++) jogosRodada.push({ casa: timesCircular[j], visitante: timesCircular[timesCircular.length - 2 - j] });
      turno.push(jogosRodada);
      timesCircular.unshift(timesCircular.pop());
    }
  }
  if (numTimes === 4) {
    if (isGrupoACE) {
      returno.push(turno[0].map(j => ({ casa: j.visitante, visitante: j.casa })));
      returno.push(turno[2].map(j => ({ casa: j.visitante, visitante: j.casa })));
      returno.push(turno[1].map(j => ({ casa: j.visitante, visitante: j.casa })));
    } else {
      returno.push(turno[2].map(j => ({ casa: j.visitante, visitante: j.casa })));
      returno.push(turno[1].map(j => ({ casa: j.visitante, visitante: j.casa })));
      returno.push(turno[0].map(j => ({ casa: j.visitante, visitante: j.casa })));
    }
  } else {
    for (let rodada of turno) returno.push(rodada.map(j => ({ casa: j.visitante, visitante: j.casa })));
  }
  const rodadas = [];
  turno.forEach((jogos, i) => rodadas.push({ rodada: i + 1, jogos }));
  returno.forEach((jogos, i) => rodadas.push({ rodada: i + turno.length + 1, jogos }));
  return rodadas.filter(r => r.jogos.every(j => j.casa !== "BYE" && j.visitante !== "BYE"));
}

function salvarDataHora(id, valor) {
  // Salva a data no nosso objeto de controle
  datasHoras[id] = valor;

  // Encontra o elemento específico do dia da semana pelo ID
  const diaSemanaSpan = document.getElementById(`dia-semana-${id}`);

  // Atualiza o texto diretamente no elemento, sem redesenhar a tela inteira
  if (diaSemanaSpan) {
    if (valor) {
      const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
      const dataObj = new Date(valor);
      if (!isNaN(dataObj.getTime())) {
        diaSemanaSpan.textContent = dias[dataObj.getDay()];
      } else {
        diaSemanaSpan.textContent = "";
      }
    } else {
      diaSemanaSpan.textContent = "";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.rodada-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const rodada = parseInt(this.textContent.replace('Rodada ', ''));
      filtrarPorRodada(rodada);
    });
  });
});

function preencherPlacaresRodadaAtual() {
  if (!rodadaAtiva) return;
  const jogosNaTela = document.querySelectorAll('#jogosRodadas .jogo-card-grupo');
  jogosNaTela.forEach(jogo => {
    const inputs = jogo.querySelectorAll('.placar-input');
    if (inputs.length === 2) {
      inputs[0].value = Math.floor(Math.random() * 6);
      inputs[1].value = Math.floor(Math.random() * 6);
      inputs[0].dispatchEvent(new Event('change'));
      inputs[1].dispatchEvent(new Event('change'));
    }
  });
  const btn = document.getElementById('btn-preencher-placares');
  if(btn) {
    btn.innerHTML = '<i class="fas fa-check"></i> Placares Gerados!';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-dice"></i> Preencher Placar Aleatório (Rodada Atual)';
    }, 2000);
  }
}