let equipeSendoEditada = null;
let poteSendoEditado = null;

let todasEquipes = [
  "Arsenal (ENG)", "Chelsea (ENG)", "Liverpool (ENG)", "Manchester City (ENG)", "Manchester United (ENG)",
  "Atalanta (ITA)", "Inter De Milão (ITA)", "Juventus (ITA)", "Milan (ITA)", "Paris Saint-Germain (FRA)",
  "Atlético De Madrid (ESP)", "Barcelona (ESP)", "Real Madrid (ESP)", "Benfica (POR)", "Porto (POR)",
  "Bayern De Munique (GER)", "Borussia Dortmund (GER)", "Bayer Leverkusen (GER)", "Ajax (NED)", "Sporting (POR)",
  "RB Leipzig (GER)", "Club Brugge (BEL)", "Shakhtar Donetsk (UKR)", "Feyenoord (NED)", "PSV Eindhoven (NED)",
  "Celtic (SCO)", "Monaco (FRA)", "Aston Villa (ENG)", "Bolonha (ITA)", "Girona (ESP)",
  "Stuttgart (GER)", "Sturm Graz (AUT)", "Brest (FRA)", "Dínamo Zagreb (CRO)", "Estrela Vermelha (SRB)",
  "Slovan Bratislava (SVK)", "Lille (FRA)", "Young Boys (SUI)", "RB Salzburg (AUT)", "Sparta Praga (CZE)"
];

let equipes = [];
let equipesSelecionadas = new Set();
const MAX_EQUIPES_POR_POTE = 5;

// ==========================================================
// FUNÇÕES PRINCIPAIS DE MANIPULAÇÃO DE DADOS
// ==========================================================

function getEscudoPath(equipe) {
  if (!equipe) {
    return 'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png';
  }

  const userShieldKey = getUserUploadedEscudoStorageKey(equipe);
  const userUploaded = window.escudosCustomizados ? window.escudosCustomizados[userShieldKey] : null;

  if (userUploaded && userUploaded.startsWith('data:image')) {
    return userUploaded;
  }

  const nomeBase = equipe.split(' (')[0];
  const pais = equipe.match(/\(([A-Z]{3})\)/)?.[1] || '';
  const nomeNormalizado = nomeBase
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_');

  return `images/${nomeNormalizado}_${pais.toLowerCase()}.png`;
}

function adicionarEquipe(event) {
  event.preventDefault(); // Previne o recarregamento da página pelo formulário
  if (!verificarEAtualizarPotes()) return;

  const pote = document.getElementById("poteSelecionado").value;
  const nome = document.getElementById("nomeEquipe").value.trim();
  const pais = document.getElementById("paisEquipe").value.trim().toUpperCase();
  const fileInput = document.getElementById("escudoEquipe");
  const corPrimaria = document.getElementById("corPrimaria").value;
  const corSecundaria = document.getElementById("corSecundaria").value;
  const corTerciaria = document.getElementById("corTerciaria").value;

  if (!pote || !nome || !pais) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  const equipeCompleta = `${nome} (${pais})`;
  
  if (window.coresEquipes) {
    window.coresEquipes[equipeCompleta] = { 
      primaria: corPrimaria, 
      secundaria: corSecundaria, 
      terciaria: corTerciaria 
    };
  }

  // Função interna para finalizar o processo
  const finalizarAdicao = () => {
      adicionarEquipeAoPote(pote, equipeCompleta);
      salvarDadosTorneio();
      exibirPotes();
      fecharModalCadastro();
  };

  // Verifica se um arquivo foi selecionado para o escudo
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      // Quando o arquivo for lido, salva o escudo e finaliza a adição
      const chaveLocal = getUserUploadedEscudoStorageKey(equipeCompleta);
      window.escudosCustomizados[chaveLocal] = e.target.result;
      finalizarAdicao();
    };
    
    // CORREÇÃO APLICADA AQUI: A leitura era feita de forma incorreta
    reader.readAsDataURL(file); 
  } else {
    // Se não houver arquivo, finaliza a adição diretamente
    finalizarAdicao();
  }
}

// Adicione esta função em potes.js
function mostrarAbaEquipe(aba) {
  const abaNova = document.getElementById('aba-nova-equipe');
  const abaExistente = document.getElementById('aba-equipes-existentes');

  if (aba === 'nova') {
    abaNova.style.display = 'block';
    abaExistente.style.display = 'none';
  } else {
    abaNova.style.display = 'none';
    abaExistente.style.display = 'block';
    // A CORREÇÃO PRINCIPAL: Sempre atualiza a lista ao mostrar esta aba
    const poteSelecionado = document.getElementById('poteSelecionado').value;
    exibirEquipesExistentes(poteSelecionado);
  }
}
function adicionarEquipeAoPote(pote, equipeCompleta) {
  if (window.potes[pote].length >= MAX_EQUIPES_POR_POTE && !equipeSendoEditada) {
    // A verificação de espaço agora será feita na função 'adicionarEquipesSelecionadas'
    return; 
  }

  if (equipeSendoEditada) {
      const poteAntigo = poteSendoEditado;
      window.potes[poteAntigo] = window.potes[poteAntigo].filter(e => e !== equipeSendoEditada);
  }

  // Remove a equipe de qualquer outro pote para evitar duplicatas
  for (const p in window.potes) {
    if (p !== pote) {
      window.potes[p] = window.potes[p].filter(e => e.toLowerCase() !== equipeCompleta.toLowerCase());
    }
  }

  // Adiciona ao pote de destino se ainda não existir
  if (!window.potes[pote].some(e => e.toLowerCase() === equipeCompleta.toLowerCase())) {
      window.potes[pote].push(equipeCompleta);
  }

  // Adiciona à lista geral de equipes, se for nova
  if (!todasEquipes.includes(equipeCompleta)) {
    todasEquipes.push(equipeCompleta);
  }
}
function removerEquipe(pote, equipeCodificada) {
  if (!verificarEAtualizarPotes()) return;
  const equipe = decodeURIComponent(equipeCodificada);

  if (confirm(`Tem certeza que deseja remover "${formatarNomeExibicao(equipe)}"?`)) {
    const chaveEscudo = getUserUploadedEscudoStorageKey(equipe);
    if (window.escudosCustomizados && window.escudosCustomizados[chaveEscudo]) {
      delete window.escudosCustomizados[chaveEscudo];
    }
    
    window.potes[pote] = window.potes[pote].filter(e => e !== equipe);
    
    if (equipe === window.equipeFavorita) {
      window.equipeFavorita = null;
    }
    
    exibirPotes();
    atualizarFavoritosNaTela();
    salvarDadosTorneio();
  }
}


// ==========================================================
// FUNÇÕES DO MODAL (CADASTRO, EDIÇÃO, SELEÇÃO)
// ==========================================================



// No arquivo: Meu Torneio/js/potes.js

function exibirEquipesExistentes(pote) {
  const lista = document.getElementById("lista-equipes-existentes");
  if (!lista) return;

  let disponiveis;
  if (equipeSendoEditada) {
    disponiveis = todasEquipes.filter(eq => eq !== equipeSendoEditada);
  } else {
    const ocupadas = Object.values(potes).flat();
    disponiveis = todasEquipes.filter(eq => !ocupadas.includes(eq));
  }

  disponiveis.sort((a, b) => formatarNomeExibicao(a).localeCompare(formatarNomeExibicao(b)));

  if (disponiveis.length === 0) {
    lista.innerHTML = '<p style="text-align:center; color:white;">Nenhuma equipe disponível</p>';
    return;
  }
  
  // Constrói todo o HTML de uma vez antes de o atribuir ao DOM
  const htmlDosCards = disponiveis.map(eq => {
    const escudo = getEscudoPath(eq);
    const pais = getPais(eq);
    const nomeExibicao = formatarNomeExibicao(eq);
    const idCheckbox = `check-${eq.replace(/\s+/g, '-')}`;
    const cores = getCoresEquipe(eq);
    const backgroundStyle = `background: repeating-linear-gradient(45deg, ${cores.primaria}, ${cores.primaria} 10px, ${cores.secundaria} 10px, ${cores.secundaria} 20px, ${cores.terciaria} 20px, ${cores.terciaria} 30px);`;

    return `
      <div class="equipe-card-container">
        <div class="equipe-card" style="${backgroundStyle}" onclick="alternarSelecaoEquipe('${eq}', this)">
          <input type="checkbox" class="checkbox-selecao" id="${idCheckbox}"
                 onchange="alternarSelecaoEquipe('${eq}', this.parentNode)">
          <img 
            src="${escudo}"
            class="escudo" 
            alt="${nomeExibicao}"
            onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png';"
          />
          <div class="nome-modal">${nomeExibicao}</div>
          <div class="sigla-modal">${pais}</div>
        </div>
      </div>
    `;
  }).join('');

  // Atribui a lista completa de uma só vez, o que é muito mais rápido.
  lista.innerHTML = htmlDosCards;
}

function alternarSelecaoEquipe(equipe, elemento) {
  const checkbox = elemento.querySelector('.checkbox-selecao');
  if (equipeSendoEditada) {
    // Modo edição: seleção única
    equipesSelecionadas.clear();
    document.querySelectorAll('.equipe-card.selecionada').forEach(card => card.classList.remove('selecionada'));
    document.querySelectorAll('.checkbox-selecao').forEach(cb => cb.checked = false);
  }
  
  if (equipesSelecionadas.has(equipe)) {
    equipesSelecionadas.delete(equipe);
    elemento.classList.remove('selecionada');
    checkbox.checked = false;
  } else {
    equipesSelecionadas.add(equipe);
    elemento.classList.add('selecionada');
    checkbox.checked = true;
  }
}

function abrirModalCadastro() {
  const pote = document.getElementById("poteSelecionado").value;
  const tituloModal = document.getElementById("modal-titulo-equipe");

  if (tituloModal && pote) {
    tituloModal.textContent = `Adicionar Equipe ao ${pote.replace('pote', 'Pote ')}`;
  }
  document.getElementById('modal-cadastro').style.display = 'flex';

  // Por padrão, sempre abre na aba de cadastro
  mostrarAbaEquipe('nova');
}

function fecharModalCadastro() {
  document.getElementById('modal-cadastro').style.display = 'none';
  document.getElementById('form-cadastro-equipe').reset(); // Reseta o formulário
  document.getElementById('preview-escudo').innerHTML = ''; // Limpa o preview
  equipesSelecionadas.clear();
  equipeSendoEditada = null;
  poteSendoEditado = null;
}

function adicionarEquipesSelecionadas() {
    if (!verificarEAtualizarPotes()) return;

    const poteSelecionadoNoModal = document.getElementById('poteSelecionado').value;

    if (equipesSelecionadas.size === 0) {
        alert("Nenhuma equipe selecionada!");
        return;
    }

    // --- LÓGICA DE DECISÃO: ADICIONAR vs EDITAR ---
    if (equipeSendoEditada) {
        // ESTÁ NO MODO DE EDIÇÃO/TROCA
        if (equipesSelecionadas.size !== 1) {
            alert("Por favor, selecione exatamente uma equipe para a troca.");
            return;
        }

        const equipeOriginal = equipeSendoEditada;
        const poteOriginal = poteSendoEditado;
        const equipeEscolhida = Array.from(equipesSelecionadas)[0];
        let poteDaEquipeEscolhida = null;
        let indexDaEquipeEscolhida = -1;

        // Verifica se a equipe escolhida já está em algum pote
        for (const [key, equipesDoPote] of Object.entries(window.potes)) {
            const idx = equipesDoPote.indexOf(equipeEscolhida);
            if (idx !== -1) {
                poteDaEquipeEscolhida = key;
                indexDaEquipeEscolhida = idx;
                break;
            }
        }

        // Cenário 1: A equipe escolhida já está em um pote (TROCA)
        if (poteDaEquipeEscolhida) {
            const indexOriginal = window.potes[poteOriginal].indexOf(equipeOriginal);
            window.potes[poteOriginal][indexOriginal] = equipeEscolhida;
            window.potes[poteDaEquipeEscolhida][indexDaEquipeEscolhida] = equipeOriginal;
        } 
        // Cenário 2: A equipe escolhida não está em pote nenhum (SUBSTITUIÇÃO)
        else {
            const indexOriginal = window.potes[poteOriginal].indexOf(equipeOriginal);
            if (indexOriginal !== -1) {
                window.potes[poteOriginal][indexOriginal] = equipeEscolhida;
            }
        }

    } else {
        // ESTÁ NO MODO DE ADIÇÃO NORMAL (Aqui sim verificamos o espaço)
        const espacoDisponivel = MAX_EQUIPES_POR_POTE - window.potes[poteSelecionadoNoModal].length;
        if (equipesSelecionadas.size > espacoDisponivel) {
            alert(`O pote selecionado só tem espaço para mais ${espacoDisponivel} equipe(s).`);
            return;
        }
        equipesSelecionadas.forEach(equipe => {
            adicionarEquipeAoPote(poteSelecionadoNoModal, equipe);
        });
    }

    // Finaliza e atualiza a tela para ambos os casos
    salvarDadosTorneio();
    exibirPotes();
    fecharModalCadastro();
}

function editarEquipe(poteAtual, equipeCodificada) {
  const equipe = decodeURIComponent(equipeCodificada);
  equipeSendoEditada = equipe;
  poteSendoEditado = poteAtual;

  abrirModalCadastro();
  document.getElementById('poteSelecionado').value = poteAtual;
  mostrarAbaEquipe('existente'); // Assume que 'mostrarAbaEquipe' é uma função que troca as abas do modal
  exibirEquipesExistentes(poteAtual);

  atualizarFavoritosNaTela();
}


function removerEquipe(pote, equipeCodificada) {
  if (!verificarEAtualizarPotes()) return;

  const equipe = decodeURIComponent(equipeCodificada);
  if (confirm(`Tem certeza que deseja remover "${formatarNomeExibicao(equipe)}" do ${pote.replace('pote', 'Pote ')}?`)) {
    potes[pote] = potes[pote].filter(e => e !== equipe);

    const equipeAindaEmAlgumPote = Object.values(potes).flat().includes(equipe);

    // Se a equipe removida era a favorita e não está mais em nenhum pote, reseta a seleção.
    if (equipe === equipeFavorita && !equipeAindaEmAlgumPote) {
      equipeFavorita = null;
    }

    if (!equipeAindaEmAlgumPote) {
      if (!todasEquipes.slice(0, 20).includes(equipe)) {
        equipes = equipes.filter(e => e !== equipe);
        todasEquipes = todasEquipes.filter(e => e !== equipe);
      }
    }

    exibirPotes();
    atualizarFavoritosNaTela();
  }
}

// ==========================================================
// FUNÇÕES DE EXIBIÇÃO E AUXILIARES
// ==========================================================

/**
 * Renderiza todos os potes e as equipes contidas neles na tela.
 * A função limpa o container e o reconstrói com os dados mais recentes
 * da variável global 'window.potes'.
 */
// No arquivo: Meu Torneio/js/potes.js

/**
 * Renderiza todos os potes e as equipes contidas neles na tela.
 * A função limpa o container e o reconstrói com os dados mais recentes
 * da variável global 'window.potes'.
 */
function exibirPotes() {
  const container = document.querySelector('.potes-container');
  if (!container) return;

  // 1. Usa um DocumentFragment para construir os potes em memória, o que é muito mais rápido.
  const fragment = document.createDocumentFragment();

  for (const pote in potes) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'pote-wrapper';

    const equipesHTML = potes[pote].map((equipe) => {
      const escudo = getEscudoPath(equipe);
      const pais = getPais(equipe);
      const equipeCodificada = encodeURIComponent(equipe);
      
      // Lógica de carregamento direto dos escudos, como no seu código original.
      return `
        <li class="pote-equipe-item" data-pote="${pote}" data-equipe="${equipeCodificada}">
          <img src="${escudo}" class="escudo" alt="${formatarNomeExibicao(equipe)}" onerror="this.onerror=null; this.src='images/default.png';">
          <div class="info-equipe">
            <span class="nome-equipe">${formatarNomeExibicao(equipe)}</span>
            <div class="pais-equipe-card">${pais}</div>
          </div>
          <div class="equipe-actions">
              <button class="action-btn" onclick="editarEquipe('${pote}', '${equipeCodificada}')" title="Editar Equipe"><i class="fas fa-edit"></i></button>
              <button class="action-btn" onclick="removerEquipe('${pote}', '${equipeCodificada}')" title="Remover Equipe"><i class="fas fa-trash"></i></button>
          </div>
        </li>
      `;
    }).join('');

    const vazioHTML = `<li class="pote-vazio-placeholder">Pote Vazio</li>`;

    wrapperDiv.innerHTML = `
      <div class="pote-titulo-lateral">${pote.replace('pote', 'Pote ')}</div>
      <div class="pote-conteudo-principal">
        <ul>${potes[pote].length > 0 ? equipesHTML : vazioHTML}</ul>
      </div>
      <button class="botao-adicionar-lateral" onclick="document.getElementById('poteSelecionado').value='${pote}'; abrirModalCadastro()">Adicionar</button>
    `;

    fragment.appendChild(wrapperDiv);
  }

  // 2. Limpa o ecrã e adiciona todos os potes de uma só vez. Esta é a principal otimização.
  container.innerHTML = '';
  container.appendChild(fragment);

  const botoesGerais = document.querySelector(".botoes-tela-potes");
  if (botoesGerais) {
    botoesGerais.style.display = 'flex';
  }

  atualizarFavoritosNaTela();
}
function formatarNomeExibicao(equipe) {
  return equipe ? equipe.split(' (')[0] : '';
}

function getPais(equipe) {
  const match = equipe ? equipe.match(/\(([^)]+)\)/) : null;
  return match ? match[1] : '';
}

function getUserUploadedEscudoStorageKey(equipe) {
  if (!equipe) return '';
  const nomeBase = equipe.split(' (')[0];
  const cleanName = nomeBase.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '_');
  return `escudo_user_${cleanName}`;
}

function mostrarPreviewEscudo(event) {
  const input = event.target;
  const previewDiv = document.getElementById('preview-escudo');
  if (previewDiv && input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      previewDiv.innerHTML = `<div class="preview-frame"><img id="preview-img" src="${e.target.result}"></div>`;
      ajustarZoomEscudo(1);
    };
    reader.readAsDataURL(input.files[0]);
  } else if (previewDiv) {
    previewDiv.innerHTML = '';
  }
}

function ajustarZoomEscudo(zoom) {
  const img = document.getElementById('preview-img');
  if (img) img.style.transform = `scale(${zoom})`;
}

// >>> FUNÇÃO RESTAURADA <<<
function filtrarEquipesExistentes() {
  const termo = document.getElementById('pesquisa-equipes').value.toLowerCase().trim();
  const lista = document.getElementById('lista-equipes-existentes');
  if (!lista) return;

  const cards = lista.querySelectorAll('.equipe-card-container');
  cards.forEach(cardContainer => {
    const nomeElemento = cardContainer.querySelector('.nome-modal');
    const paisElemento = cardContainer.querySelector('.sigla-modal');
    const nome = nomeElemento ? nomeElemento.textContent.toLowerCase() : '';
    const pais = paisElemento ? paisElemento.textContent.toLowerCase() : '';
    if (nome.includes(termo) || pais.includes(termo)) {
      cardContainer.style.display = '';
    } else {
      cardContainer.style.display = 'none';
    }
  });
}

// No arquivo: Meu Torneio/js/potes.js

function preencherPotesAleatoriamente() {
    if (!verificarEAtualizarPotes()) return;
    if (Object.values(window.potes).every(p => p.length >= MAX_EQUIPES_POR_POTE)) {
        alert("Todos os potes já estão cheios!");
        return;
    }

    const equipesJaNosPotes = new Set(Object.values(window.potes).flat());
    const equipesDisponiveisUnicas = [...new Set(todasEquipes)].filter(e => !equipesJaNosPotes.has(e));
    const equipesEmbaralhadas = [...equipesDisponiveisUnicas].sort(() => Math.random() - 0.5);

    let indiceEquipe = 0;
    for (const pote in window.potes) {
        while (window.potes[pote].length < MAX_EQUIPES_POR_POTE && indiceEquipe < equipesEmbaralhadas.length) {
            window.potes[pote].push(equipesEmbaralhadas[indiceEquipe++]);
        }
    }
    
    // 1. Renderiza a tela imediatamente com a versão otimizada.
    exibirPotes();
    
    // 2. Adia a operação de salvar para não bloquear a interface, garantindo fluidez.
    setTimeout(() => {
        salvarDadosTorneio();
    }, 100);
}

function verificarEAtualizarPotes() {
  if (Object.keys(window.dadosGrupos).length > 0) {
    if (confirm("Ao alterar os potes, todo o progresso do sorteio e jogos será resetado. Deseja continuar?")) {
      window.dadosGrupos = {}; window.dadosJogos = {}; window.jogosSegundaFase = {};
      window.jogosTerceiraFase = {}; window.jogosQuartaFase = {}; window.jogosFinal = {};
      window.resultados = {}; window.historicoClassificacao = {};
      // Não limpa equipe favorita ou escudos customizados
      salvarDadosTorneio();
      return true;
    }
    return false;
  }
  return true;
}

// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

function carregarEquipesDoArquivoJson() {
  fetch('js/equipes.json')
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => {
      const equipesConvertidas = data.map(eq => `${eq.nome} (${eq.pais})`);
      const unicas = new Set([...todasEquipes, ...equipesConvertidas]);
      todasEquipes = Array.from(unicas);
    })
    .catch(err => console.error("Erro ao carregar equipes.json:", err));
}

// Event Listeners
document.getElementById('form-cadastro-equipe').addEventListener('submit', adicionarEquipe);
document.getElementById('escudoEquipe').addEventListener('change', mostrarPreviewEscudo);

// Carregamento inicial de dados
carregarEquipesDoArquivoJson();

// Adicionando um listener para o botão de compartilhar
document.addEventListener('DOMContentLoaded', () => {
    const shareButton = document.getElementById('botao-compartilhar-potes');
    if(shareButton) {
        shareButton.addEventListener('click', compartilharPotesComoImagem);
    }
});

/**
 * Converte todas as imagens dentro de um elemento para um formato de texto (Base64).
 * Isso corrige erros de segurança do navegador ao gerar a imagem com html2canvas.
 * @param {HTMLElement} element - O elemento que contém as imagens a serem convertidas.
 */
async function inlineAllImages(element) {
    const images = Array.from(element.getElementsByTagName('img'));
    const promises = images.map(img => {
        if (img.src.startsWith('data:image')) {
            return Promise.resolve();
        }
        // Usa 'no-cors' para evitar problemas ao buscar imagens, mas pode ter limitações.
        // A melhor solução a longo prazo é rodar o projeto em um servidor local.
        return fetch(img.src, { mode: 'no-cors' })
            .then(response => response.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    img.src = reader.result;
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }))
            .catch(error => {
                console.warn(`Não foi possível carregar a imagem para o canvas: ${img.src}`, error);
            });
    });
    // Espera que todas as imagens sejam processadas
    await Promise.all(promises);
}


/**
 * Captura a área dos potes como uma imagem e abre o modal de compartilhamento.
 * VERSÃO CORRIGIDA para lidar com imagens locais.
 */
async function compartilharPotesComoImagem() {
    const modal = document.getElementById('modal-compartilhar');
    const previewContainer = document.getElementById('preview-imagem-container');
    const downloadBtn = document.getElementById('btn-download-imagem');
    const nativeShareBtn = document.getElementById('btn-native-share');
    const elementoParaCapturar = document.querySelector('.potes-container');

    if (!modal || !previewContainer || !elementoParaCapturar) {
        console.error("Elementos essenciais não encontrados.");
        return;
    }

    modal.classList.remove('hidden');
    previewContainer.innerHTML = '<div class="loading-spinner"></div><p>Gerando imagem...</p>';

    try {
        // 1. Criar um clone do container dos potes
        const clone = elementoParaCapturar.cloneNode(true);
        document.body.appendChild(clone);
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.width = elementoParaCapturar.offsetWidth + 'px';

        // 2. Processar todas as imagens no clone
        const imagens = clone.querySelectorAll('img.escudo');
        await Promise.all(Array.from(imagens).map(async (img) => {
            try {
                // Se já for data URL, mantém
                if (img.src.startsWith('data:image')) return;
                
                // Se for uma imagem padrão do sistema
                if (img.src.includes('images/')) {
                    // Tenta carregar a imagem original
                    const response = await fetch(img.src, { mode: 'cors' });
                    if (!response.ok) throw new Error('Imagem não encontrada');
                    const blob = await response.blob();
                    img.src = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } else {
                    // Usa imagem padrão transparente como fallback
                    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                }
            } catch (error) {
                console.warn('Erro ao processar escudo:', img.src, error);
                // Fallback para imagem transparente
                img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            }
        }));

        // 3. Adicionar pequeno delay para garantir que todas as imagens estão renderizadas
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Capturar o clone com html2canvas
        const canvas = await html2canvas(clone, {
            backgroundColor: '#01096c',
            scale: 2,
            logging: true,
            allowTaint: true,
            useCORS: true,
            ignoreElements: (element) => {
                // Ignora elementos que não devem ser capturados
                return element.classList.contains('loading-spinner');
            }
        });

        // 5. Remover o clone
        document.body.removeChild(clone);

        // 6. Exibir a imagem gerada
        const imagemUrl = canvas.toDataURL('image/png');
        previewContainer.innerHTML = `<img src="${imagemUrl}" style="max-width: 100%; border-radius: 8px;" alt="Potes do Torneio">`;
        downloadBtn.href = imagemUrl;
        downloadBtn.download = `potes-torneio-${new Date().toISOString().slice(0,10)}.png`;

        // 7. Configurar compartilhamento nativo se disponível
        if (navigator.canShare) {
            nativeShareBtn.style.display = 'flex';
            const response = await fetch(imagemUrl);
            const blob = await response.blob();
            const file = new File([blob], 'potes-torneio.png', { type: 'image/png' });

            nativeShareBtn.onclick = async () => {
                try {
                    await navigator.share({
                        title: 'Potes do Torneio',
                        text: 'Confira os potes do meu torneio!',
                        files: [file]
                    });
                } catch (err) {
                    console.error('Erro ao compartilhar:', err);
                }
            };
        } else {
            nativeShareBtn.style.display = 'none';
        }

    } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        previewContainer.innerHTML = `
            <p style="color: #ff4d4d;">Erro ao gerar imagem</p>
            <button onclick="compartilharPotesComoImagem()">Tentar novamente</button>
        `;
    }
}