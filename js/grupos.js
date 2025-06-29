function gerarSegundaFase() {
  const classificados = calcularClassificacao();
  dadosSegundaFase = {
    A: [classificados[0].nome, classificados[7].nome, classificados[11].nome, classificados[15].nome],
    B: [classificados[1].nome, classificados[6].nome, classificados[10].nome, classificados[14].nome],
    C: [classificados[2].nome, classificados[5].nome, classificados[9].nome, classificados[13].nome],
    D: [classificados[3].nome, classificados[4].nome, classificados[8].nome, classificados[12].nome]
  };

  jogosSegundaFase = {};
  for (let grupo in dadosSegundaFase) {
jogosSegundaFase[grupo] = gerarRodadas(dadosSegundaFase[grupo], grupo); // <- Grupo aqui
}

  exibirGruposSegundaFase();
  exibirJogosSegundaFase();
  mostrar('segundaFase');
  atualizarFavoritosNaTela();
  atualizarFavoritosNaTela();
}

function exibirGruposSegundaFase() {
let html = "";
for (let grupo in dadosSegundaFase) {
const times = dadosSegundaFase[grupo];
html += `<div class='grupo'><h3>Grupo ${grupo}</h3><ul>${
  times.map(t => `<li>${formatarNomeComEscudo(t, grupo)}</li>`).join('')
}</ul></div>`;
}
document.getElementById("gruposSegundaFase").innerHTML = html;
}

// Mantenha as outras funções de exibição similares para as outras fases

function gerarTerceiraFase() {
  const classificados = calcularClassificacao();
  dadosTerceiraFase = {
    A: [classificados[0].nome, classificados[5].nome, classificados[8].nome, classificados[11].nome],
    B: [classificados[1].nome, classificados[4].nome, classificados[7].nome, classificados[10].nome],
    C: [classificados[2].nome, classificados[3].nome, classificados[6].nome, classificados[9].nome]
  };

  jogosTerceiraFase = {};
  for (let grupo in dadosTerceiraFase) {
jogosTerceiraFase[grupo] = gerarRodadas(dadosTerceiraFase[grupo], grupo); // <- Grupo aqui
}


  exibirGruposTerceiraFase();
  exibirJogosTerceiraFase();
  mostrar('terceiraFase');
  atualizarFavoritosNaTela();
  atualizarFavoritosNaTela();
}

function exibirGruposTerceiraFase() {
  let html = "";
  for (let grupo in dadosTerceiraFase) {
    const times = dadosTerceiraFase[grupo];
    html += `<div class='grupo'><h3>Grupo ${grupo}</h3><ul>${
      times.map(t => `<li>${formatarNomeComEscudo(t, grupo)}</li>`).join('')
    }</ul></div>`;
  }
  document.getElementById("gruposTerceiraFase").innerHTML = html;
}



function gerarQuartaFase() {
  const classificados = calcularClassificacao();
  dadosQuartaFase = {
    A: [classificados[0].nome, classificados[3].nome, classificados[5].nome, classificados[7].nome],
    B: [classificados[1].nome, classificados[2].nome, classificados[4].nome, classificados[6].nome]
  };

  jogosQuartaFase = {};
  for (let grupo in dadosQuartaFase) {
jogosQuartaFase[grupo] = gerarRodadas(dadosQuartaFase[grupo], grupo); // <- Grupo aqui
}
  exibirGruposQuartaFase();
  exibirJogosQuartaFase();
  mostrar('quartaFase');
  atualizarFavoritosNaTela();
  atualizarFavoritosNaTela();
}

function exibirGruposQuartaFase() {
  let html = "";
  for (let grupo in dadosQuartaFase) {
    const times = dadosQuartaFase[grupo];
    html += `<div class='grupo'><h3>Grupo ${grupo}</h3><ul>${
      times.map(t => `<li>${formatarNomeComEscudo(t, grupo)}</li>`).join('')
    }</ul></div>`;
  }
  document.getElementById("gruposQuartaFase").innerHTML = html;
}


function gerarFaseFinal() {
  const classificados = calcularClassificacao().slice(0, 4);
  dadosFinal = { FINAL: classificados.map(t => t.nome) };
  jogosFinal = {};
  for (let grupo in dadosFinal) {
jogosFinal[grupo] = gerarRodadas(dadosFinal[grupo], grupo); // <- Grupo aqui (ex: "FINAL")
}
  exibirGruposFinal();
  exibirJogosFinal();
  mostrar('final');
  atualizarFavoritosNaTela();
  atualizarFavoritosNaTela();
}

function exibirGruposFinal() {
  let html = "";
  for (let grupo in dadosFinal) {
    const times = dadosFinal[grupo];
    html += `<div class='grupo final-phase'><h3>Fase Final</h3><ul>${
      times.map(t => `<li>${formatarNomeComEscudo(t, grupo)}</li>`).join('')
    }</ul></div>`;
  }
  document.getElementById("gruposFinal").innerHTML = html;

  atualizarFavoritosNaTela();
}


// Variável para controlar o filtro atual de grupos
let filtroGruposAtual = 'todas';

function filtrarGrupos() {
    filtroGruposAtual = document.getElementById("faseFiltroGrupos").value;
    exibirTodosGrupos();
    atualizarFavoritosNaTela();
}

function exibirGruposSorteio() {
  let html = "";
  
  // Se nenhum sorteio foi realizado, mostrar grupos vazios
if ((!dadosGrupos || Object.keys(dadosGrupos).length === 0) && document.getElementById("sorteio")?.classList.contains("hidden") === false) {
  html += `<div class="grupos-container">`;
    
    // Criar 5 grupos vazios (A, B, C, D, E)
    for (let grupo of ['A', 'B', 'C', 'D', 'E']) {
      html += `
        <div class="grupo-completo">
          <div class="grupo-header">Grupo ${grupo}</div>
          <div class="grupo-item">
            <div class="grupo-equipes">
              <div class="grupo-equipe" style="justify-content: center; color: #aaa;">
                Clique em "Sortear Primeira Fase" no menu acima
              </div>
            </div>
          </div>
        </div>`;
    }
    
    html += `</div>`;
    
    document.getElementById("grupos").innerHTML = html;
    return;
  }

  // Restante da função original...
  // Fase de Grupos
  if (dadosGrupos && Object.keys(dadosGrupos).length > 0) {
    html += `<h3>Fase de Grupos</h3><div class="grupos-container">`;
    for (let grupo in dadosGrupos) {
      html += criarCardGrupo(grupo, dadosGrupos[grupo]);
    }
    html += `</div>`;
  }

  // Segunda Fase
  if (dadosSegundaFase && Object.keys(dadosSegundaFase).length > 0) {
    html += `<h3>Segunda Fase</h3><div class="grupos-container">`;
    for (let grupo in dadosSegundaFase) {
      html += criarCardGrupo(grupo, dadosSegundaFase[grupo]);
    }
    html += `</div>`;
  }

  // Terceira Fase
  if (dadosTerceiraFase && Object.keys(dadosTerceiraFase).length > 0) {
    html += `<h3>Terceira Fase</h3><div class="grupos-container">`;
    for (let grupo in dadosTerceiraFase) {
      html += criarCardGrupo(grupo, dadosTerceiraFase[grupo]);
    }
    html += `</div>`;
  }

  // Quarta Fase
  if (dadosQuartaFase && Object.keys(dadosQuartaFase).length > 0) {
    html += `<h3>Quarta Fase</h3><div class="grupos-container">`;
    for (let grupo in dadosQuartaFase) {
      html += criarCardGrupo(grupo, dadosQuartaFase[grupo]);
    }
    html += `</div>`;
  }

  // Fase Final
  if (dadosFinal && Object.keys(dadosFinal).length > 0) {
    html += `<h3>Fase Final</h3><div class="grupos-container final-phase">`;
    for (let grupo in dadosFinal) {
      html += criarCardGrupo(grupo, dadosFinal[grupo]);
    }
    html += `</div>`;
  }

  document.getElementById("grupos").innerHTML = html || "<p>Nenhum grupo gerado ainda</p>";
}
  
function criarCardGrupo(grupo, times) {
  const posicoesGrupoASegundaFase = new Set([1, 4, 9, 16]);
  let contadorGlobal = 0;

  const gruposOrdem = ['A', 'B', 'C', 'D', 'E'];
  const indexGrupo = gruposOrdem.indexOf(grupo);
  contadorGlobal = indexGrupo * 4;

  return `
    <div class='grupo-completo'>
      <div class='grupo-header'>Grupo ${grupo}</div>
      <div class='grupo-item'>
        <div class='grupo-equipes'>
          ${times.map((time, index) => {
            const posicaoGlobal = contadorGlobal + index + 1;
            const destaque = ultimaFaseSorteio === 'primeiraFase' &&
                            posicoesGrupoASegundaFase.has(posicaoGlobal)
              ? 'destaque-proxima-fase'
              : '';

            return `
              <div class="grupo-equipe ${destaque}" data-equipe="${time}">
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
              </div>
              ${destaque ? `<div class="info-destaque-texto"></div>` : ''}`;
          }).join('')}
        </div>
      </div>
    </div>`;
}
  
function exibirGruposSegundaFase() {
    let html = "";
    for (let grupo in dadosSegundaFase) {
      const times = dadosSegundaFase[grupo];
      html += `<div class='grupo'><h3>Grupo ${grupo}</h3><ul>${
        times.map(t => `<li>${formatarNomeComEscudo(t, grupo)}</li>`).join('')
      }</ul></div>`;
    }
    document.getElementById("gruposSegundaFase").innerHTML = html;

    atualizarFavoritosNaTela();
}

     // Função para sortear os grupos
     function sortearGrupos() {
      // Criar cópias dos potes para sortear
      const potesParaSortear = {
        pote1: [...potes.pote1].sort(() => Math.random() - 0.5),
        pote2: [...potes.pote2].sort(() => Math.random() - 0.5),
        pote3: [...potes.pote3].sort(() => Math.random() - 0.5),
        pote4: [...potes.pote4].sort(() => Math.random() - 0.5)
      };

      // Criar grupos (A, B, C, D, E)
      const grupos = {
        A: [], B: [], C: [], D: [], E: []
      };

      // Distribuir times nos grupos (1 de cada pote por grupo)
      for (let grupo in grupos) {
        grupos[grupo].push(potesParaSortear.pote1.pop());
        grupos[grupo].push(potesParaSortear.pote2.pop());
        grupos[grupo].push(potesParaSortear.pote3.pop());
        grupos[grupo].push(potesParaSortear.pote4.pop());
      }

      // Exibir os grupos sorteados
      const container = document.getElementById('grupos-sorteados');
      let html = '';
      
      for (let grupo in grupos) {
        html += `
          <div class="grupo-box">
            <h3>Grupo ${grupo}</h3>
            <ul>
              ${grupos[grupo].map(time => `<li>${time}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      container.innerHTML = html;

      atualizarFavoritosNaTela();
    }