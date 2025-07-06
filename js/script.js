// Global variables for tournament data (ensure they are declared globally)
let dadosUsuarioLogado = null;
window.potes = { pote1: [], pote2: [], pote3: [], pote4: [] };
window.dadosGrupos = {};
window.dadosJogos = {};
window.jogosSegundaFase = {};
window.jogosTerceiraFase = {};
window.jogosQuartaFase = {};
window.jogosFinal = {};
window.resultados = {};
window.historicoClassificacao = {};
window.equipeFavorita = null;
window.ultimaFaseSorteio = 'primeiraFase'; // Default active sort phase
window.filtroAtual = 'geral'; // Default active classification filter
window.escudosCustomizados = {}; // <<< VARIÁVEL GLOBAL PARA ESCUDOS

// New global variables to manage the current tournament's identity
window.currentTournamentName = "UEFA.com";
window.currentTournamentLogo = "images/logotype_dark.svg";
let classificacaoInicializada = false;


// Adicione estas duas funções no início do seu script.js

/**
 * Aplica um tema de cores dinamicamente ao site.
/**
 * Aplica um tema de cores dinamicamente ao site.
 * @param {object} themeColors - Objeto com as cores a serem aplicadas.
 */
function aplicarTema(themeColors) {
    const root = document.documentElement;
    if (themeColors) {
        // Itera sobre as chaves do objeto ('--cor-fundo-app', etc.) e aplica os valores
        for (const [key, value] of Object.entries(themeColors)) {
            root.style.setProperty(key, value);
        }
    }
}
/**
 * Remove o tema de cores customizado, voltando ao CSS padrão.
 */
function resetarTema() {
    const root = document.documentElement;
    const customColorKeys = ['--cor-fundo-app', '--cor-primaria-app', '--cor-secundaria-app', '--cor-destaque-app'];
    customColorKeys.forEach(key => root.style.removeProperty(key));
}

/**
 * Function to decode JWT token.
 *
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Erro ao decodificar o token", e);
    return null;
  }
}

/**
 * Checks for token on page load.
 *
 */
function verificarTokenAoCarregar() {
  const token = localStorage.getItem('googleAuthToken');
  if (token) {
    try {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        handleCredentialResponse({ credential: token });
        return true;
      }
    } catch (e) {
      console.error("Erro ao verificar token:", e);
    }
    localStorage.removeItem('googleAuthToken');
  }
  return false;
}

/**
 * Initializes the application after Google API is loaded.
 *
 */
// Apenas para confirmação - esta função deve estar assim no seu script.js
function inicializarAplicacao() {
    const tokenSalvo = localStorage.getItem('googleAuthToken');
    if (tokenSalvo) {
        try {
            const payload = parseJwt(tokenSalvo);
            if (payload && payload.exp * 1000 > Date.now()) {
                handleCredentialResponse({ credential: tokenSalvo });
                return;
            }
        } catch (e) {
            localStorage.removeItem('googleAuthToken');
        }
    }

    try {
        google.accounts.id.initialize({
            client_id: "130362201874-hjgj370t04tkr0fqb7jb7ql2o7gdcugj.apps.googleusercontent.com",
            callback: handleCredentialResponse
        });
    } catch (error) {
        console.error("Falha ao inicializar o Google Sign-In:", error);
        return;
    }

    const loginContainer = document.getElementById("login-container");
    if (loginContainer) {
        loginContainer.innerHTML = ''; 

        const customButtonWrapper = document.createElement('div');
        customButtonWrapper.id = 'custom-google-button-wrapper';

        customButtonWrapper.innerHTML = `
            <div class="custom-google-button-content">
                <img class="google-logo-svg" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Logo Google"/>
                <span>Iniciar Sessão</span>
            </div>
            <div id="google-render-target"></div>
        `;

        loginContainer.appendChild(customButtonWrapper);

        const renderTarget = document.getElementById('google-render-target');
        if (renderTarget) {
            google.accounts.id.renderButton(
                renderTarget,
                { theme: 'outline', size: 'large', type: 'standard' }
            );
        }
    }
    
    google.accounts.id.prompt();
    carregarUltimoTorneioOuPrompt();
}
/**
 * Handles Google credential response (login/auto-login).
 *
 */
function handleCredentialResponse(response) {
  localStorage.setItem('googleAuthToken', response.credential);
  dadosUsuarioLogado = parseJwt(response.credential);

  if (!dadosUsuarioLogado) {
    console.error("Falha ao decodificar os dados do usuário.");
    return;
  }
  
  exibirUsuarioLogado();
  carregarUltimoTorneioOuPrompt();
}

/**
 * Displays logged-in user's info.
 *
 */
function exibirUsuarioLogado() {
  const loginContainer = document.getElementById('login-container');
  if (!loginContainer || !dadosUsuarioLogado) return;
  loginContainer.innerHTML = `
    <div class="user-info-logged">
      <img src="${dadosUsuarioLogado.picture}" alt="Foto de Perfil" class="user-picture">
      <span class="user-name">Olá, ${dadosUsuarioLogado.given_name}</span>
      <button onclick="handleSignOut()" class="signout-button">Sair</button>
    </div>
  `;
}

/**
 * Handles user logout.
 *
 */
function handleSignOut() {
  if(confirm("Deseja realmente sair?")) {
    localStorage.removeItem('googleAuthToken');
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
      google.accounts.id.revoke(dadosUsuarioLogado?.email, done => {
        console.log("Logout realizado com sucesso");
        location.reload();
      });
    } else {
      location.reload();
    }
  }
}

/**
 * Determines whether to load the last active tournament or show the creation/load modal.
 *
 */
function carregarUltimoTorneioOuPrompt() {
    const lastActiveTournamentName = localStorage.getItem('lastActiveTournament');
    const savedTournamentsList = JSON.parse(localStorage.getItem('savedTournamentsList')) || [];
    const modalTorneio = document.getElementById('modal-torneio');

    if (lastActiveTournamentName && savedTournamentsList.includes(lastActiveTournamentName)) {
        carregarTorneioPorNome(lastActiveTournamentName);
        if (modalTorneio) modalTorneio.classList.add('hidden');
    } else {
        if (modalTorneio) {
            const tituloModal = document.getElementById('modal-torneio-titulo');
            if (tituloModal && dadosUsuarioLogado) tituloModal.innerHTML = `Bem-vindo(a), ${dadosUsuarioLogado.given_name}!`;
            else if (tituloModal) tituloModal.innerHTML = `Bem-vindo(a)!`;

            document.getElementById('btn-criar-torneio').onclick = criarNovoTorneio;
            document.getElementById('btn-carregar-torneio').onclick = abrirListaTorneiosSalvos;

            modalTorneio.classList.remove('hidden');
        }
    }
}


/**
 * Creates a new tournament, clearing all data and setting new name/logo.
 *
 */
function criarNovoTorneio() {
  const nomeTorneioInput = document.getElementById('nome-torneio');
  const imagemTorneioInput = document.getElementById('imagem-torneio');
  let nomeTorneio = nomeTorneioInput.value.trim();

  if (!nomeTorneio) {
    alert("Por favor, digite um nome para o novo torneio.");
    return;
  }

  const savedTournamentsList = JSON.parse(localStorage.getItem('savedTournamentsList')) || [];
  if (savedTournamentsList.includes(nomeTorneio)) {
      alert(`Já existe um torneio com o nome "${nomeTorneio}". Por favor, escolha outro nome.`);
      return;
  }

  // --- INÍCIO DAS CORREÇÕES ---

  // 1. Captura as cores escolhidas no modal
  const customColors = {
    '--cor-fundo-app': document.getElementById('cor-fundo-app').value,
    '--cor-primaria-app': document.getElementById('cor-primaria-app').value,
    '--cor-secundaria-app': document.getElementById('cor-secundaria-app').value,
    '--cor-destaque-app': document.getElementById('cor-destaque-app').value,
  };

  // 2. Aplica as novas cores na página IMEDIATAMENTE
  aplicarTema(customColors);

  // 3. Atualiza o título do torneio na tela IMEDIATAMENTE
  document.getElementById('tournament-title').textContent = nomeTorneio;
  window.currentTournamentName = nomeTorneio;

  // --- FIM DAS CORREÇÕES ---

  const championsLogoImg = document.querySelector('.champions-logo img');
  if (championsLogoImg && imagemTorneioInput.files && imagemTorneioInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      championsLogoImg.src = e.target.result;
      window.currentTournamentLogo = e.target.result;
      proceedWithNewTournamentCreation(customColors); // Passa as cores para salvar
    };
    reader.readAsDataURL(imagemTorneioInput.files[0]);
  } else {
    championsLogoImg.src = "images/logotype_dark.svg";
    window.currentTournamentLogo = "images/logotype_dark.svg";
    proceedWithNewTournamentCreation(customColors); // Passa as cores para salvar
  }

  function proceedWithNewTournamentCreation(colorsToSave) {
      // Limpa os dados do torneio (potes, grupos, etc.)
      window.potes = { pote1: [], pote2: [], pote3: [], pote4: [] };
      window.dadosGrupos = {};
      window.dadosJogos = {};
      window.jogosSegundaFase = {};
      window.jogosTerceiraFase = {};
      window.jogosQuartaFase = {};
      window.jogosFinal = {};
      window.resultados = {};
      window.historicoClassificacao = {};
      window.escudosCustomizados = {};
      window.equipeFavorita = null;
      window.ultimaFaseSorteio = 'primeiraFase';
      window.filtroAtual = 'geral';
      window.faseAtiva = 'grupo';
      window.rodadaAtiva = 1;

      // Salva o novo torneio com as cores
      salvarDadosTorneio(true, colorsToSave);
      localStorage.setItem('lastActiveTournament', window.currentTournamentName);

      document.getElementById('modal-torneio').classList.add('hidden');
      
      mostrar('potes');
      exibirPotes();
  }
}


/**
 * Opens a modal with a list of saved tournaments to choose from.
 *
 */
function abrirListaTorneiosSalvos() {
  const listaNomesTorneios = JSON.parse(localStorage.getItem('savedTournamentsList')) || [];
  const containerLista = document.getElementById('lista-torneios-salvos');
  
  if (!containerLista) return;

  containerLista.innerHTML = "";

  if (listaNomesTorneios.length === 0) {
    containerLista.innerHTML = "<p style='text-align: center; color: #ccc;'>Nenhum torneio salvo encontrado.</p>";
  } else {
    listaNomesTorneios.forEach(nome => {
      const item = document.createElement('li');
      item.textContent = nome;
      item.onclick = () => {
        carregarTorneioPorNome(nome);
        document.getElementById('modal-lista-torneios').classList.add('hidden');
      };
      containerLista.appendChild(item);
    });
  }

  document.getElementById('modal-torneio').classList.add('hidden');
  document.getElementById('modal-lista-torneios').classList.remove('hidden');
}


/**
 * Loads a specific tournament's data by its name.
 * @param {string} tournamentName - The unique name of the tournament to load.
 */
/**
 * Carrega todos os dados E o estado da interface de um torneio específico.
/**
 * Carrega todos os dados e o tema de um torneio específico a partir do localStorage.
 * @param {string} tournamentName - O nome do torneio a carregar.
 */
function carregarTorneioPorNome(tournamentName) {
  const dadosSalvos = localStorage.getItem(`tournament_${tournamentName}`);

  if (!dadosSalvos) {
    alert("Erro: Torneio não encontrado ou corrompido.");
    return;
  }

  const dados = JSON.parse(dadosSalvos);

  // 1. Aplica o tema de cores salvo ou reseta para o padrão
  if (dados.themeColors) {
    aplicarTema(dados.themeColors);
  } else {
    resetarTema();
  }

  // 2. Atribui os dados do torneio carregados às variáveis globais
  window.potes = dados.potes || { pote1: [], pote2: [], pote3: [], pote4: [] };
  window.dadosGrupos = dados.dadosGrupos || {};
  window.dadosJogos = dados.dadosJogos || {};
  window.jogosSegundaFase = dados.jogosSegundaFase || {};
  window.jogosTerceiraFase = dados.jogosTerceiraFase || {};
  window.jogosQuartaFase = dados.jogosQuartaFase || {};
  window.jogosFinal = dados.jogosFinal || {};
  window.resultados = dados.resultados || {};
  window.historicoClassificacao = dados.historicoClassificacao || {};
  window.escudosCustomizados = dados.escudosCustomizados || {};

  // 3. Carrega o estado da interface (filtros, equipe favorita, etc.)
  window.equipeFavorita = dados.equipeFavorita || null;
  window.ultimaFaseSorteio = dados.ultimaFaseSorteio || 'primeiraFase';
  window.filtroAtual = dados.filtroAtual || 'geral';
  window.faseAtiva = dados.faseAtivaJogos || 'grupo';
  window.rodadaAtiva = dados.rodadaAtivaJogos || 1;

  // 4. Atualiza a identidade visual do torneio (título e logo)
  window.currentTournamentName = dados.tournamentName;
  window.currentTournamentLogo = dados.tournamentLogo;
  document.getElementById('tournament-title').textContent = window.currentTournamentName;
  const championsLogoImg = document.querySelector('.champions-logo img');
  if (championsLogoImg) {
    championsLogoImg.src = window.currentTournamentLogo;
  }

  // 5. Define este como o último torneio ativo e fecha os modais
  localStorage.setItem('lastActiveTournament', tournamentName);
  document.getElementById('modal-lista-torneios').classList.add('hidden');
  document.getElementById('modal-torneio').classList.add('hidden');

  // 6. Atualiza todas as seções da interface com os dados carregados
  mostrar('potes'); // Sempre começa mostrando a tela de potes
  exibirPotes();
  if (typeof filtrarSorteioPorFase === 'function') {
    filtrarSorteioPorFase(window.ultimaFaseSorteio);
  }
  if (typeof filtrarClassificacao === 'function') {
    filtrarClassificacao(window.filtroAtual);
  }
  if (typeof exibirJogos === 'function') {
    exibirJogos();
  }
  if (typeof atualizarFavoritosNaTela === 'function') {
    atualizarFavoritosNaTela();
  }

  alert(`Torneio "${tournamentName}" carregado com sucesso!`);
}

/**
 * Saves current tournament state to localStorage under its unique name.
 * @param {boolean} isNewTournament - True if this is a brand new tournament being saved for the first time.
 *
 */
/**
 * Salva o estado ATUAL do torneio, incluindo os filtros e a equipe favorita.
 * @param {boolean} isNewTournament - True se for um novo torneio.
 */
function salvarDadosTorneio(isNewTournament = false, customColors = null) {
  if (!dadosUsuarioLogado) {
    alert("Por favor, faça login para salvar seu progresso.");
    return;
  }

  const nome = window.currentTournamentName;

  if (!nome || nome === "UEFA.com") {
      alert("Por favor, crie ou carregue um torneio válido antes de tentar salvar.");
      return;
  }

  const logo = window.currentTournamentLogo;

  // Se não estiver salvando cores novas, tenta manter as cores já existentes do torneio
  const themeToSave = customColors ? customColors : JSON.parse(localStorage.getItem(`tournament_${nome}`))?.themeColors;

  // Objeto completo com todos os dados, incluindo o tema
  const dadosParaSalvar = {
    potes: window.potes,
    dadosGrupos: window.dadosGrupos,
    dadosJogos: window.dadosJogos,
    jogosSegundaFase: window.jogosSegundaFase,
    jogosTerceiraFase: window.jogosTerceiraFase,
    jogosQuartaFase: window.jogosQuartaFase,
    jogosFinal: window.jogosFinal,
    resultados: window.resultados,
    historicoClassificacao: window.historicoClassificacao,
    escudosCustomizados: window.escudosCustomizados,
    tournamentName: nome,
    tournamentLogo: logo,
    equipeFavorita: window.equipeFavorita,
    ultimaFaseSorteio: window.ultimaFaseSorteio,
    filtroAtual: window.filtroAtual,
    faseAtivaJogos: window.faseAtiva,
    rodadaAtivaJogos: window.rodadaAtiva,
    themeColors: themeToSave // <<< SALVA O TEMA JUNTO
  };

  localStorage.setItem(`tournament_${nome}`, JSON.stringify(dadosParaSalvar));

  const savedTournamentsList = JSON.parse(localStorage.getItem('savedTournamentsList')) || [];
  if (!savedTournamentsList.includes(nome)) {
    savedTournamentsList.push(nome);
    localStorage.setItem('savedTournamentsList', JSON.stringify(savedTournamentsList));
  }
  
  if (!isNewTournament) {
    alert(`Torneio "${nome}" salvo com sucesso!`);
  }
  console.log(`Dados e estado do torneio "${nome}" salvos!`);
}
/**
 * Controls the display of different sections.
 *
 */
function mostrar(id) {
    document.querySelectorAll('.tela').forEach(el => el.classList.add('hidden'));
    const telaAtiva = document.getElementById(id);
    if (telaAtiva) {
        telaAtiva.classList.remove('hidden');
    }

    document.querySelectorAll(".menu-items a").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute('onclick') === `mostrar('${id}')`) {
            link.classList.add("active");
        }
    });

    const menuSorteio = document.querySelector('.menu-sorteio-superior');
    const menuClassificacao = document.querySelector('.botoes-classificacao');
    const menuJogos = document.querySelector('.botoes-jogos');
    const filtroFaseSorteio = document.querySelector('.filtro-fase-container');
    const botoesPotes = document.getElementById('botoes-potes-container');

    [menuSorteio, menuClassificacao, menuJogos, filtroFaseSorteio].forEach(menu => {
        if (menu) menu.classList.add('hidden');
    });
    if (botoesPotes) botoesPotes.classList.add('hidden');

    switch (id) {
        case 'sorteio':
            if (menuSorteio) menuSorteio.classList.remove('hidden');
            if (filtroFaseSorteio) filtroFaseSorteio.classList.remove('hidden');
            if (botoesPotes) botoesPotes.classList.remove('hidden');
            if (typeof filtrarSorteioPorFase === 'function') {
                filtrarSorteioPorFase(window.ultimaFaseSorteio || 'primeiraFase');
            }
            break;

        case 'classificacao':
            if (menuClassificacao) menuClassificacao.classList.remove('hidden');
            if (typeof filtrarClassificacao === 'function') filtrarClassificacao(window.filtroAtual);
            break;
        case 'jogos':
            if (menuJogos) menuJogos.classList.remove('hidden');
            if (typeof exibirJogos === 'function') exibirJogos();
            break;
        case 'potes':
            if (typeof exibirPotes === 'function') exibirPotes();
            break;
    }
}

// Function to open the new tournament modal explicitly
function openNewTournamentModal() {
  const modalTorneio = document.getElementById('modal-torneio');
  if (modalTorneio) {
    const tituloModal = document.getElementById('modal-torneio-titulo');
    if (tituloModal && dadosUsuarioLogado) tituloModal.innerHTML = `Criar Novo Torneio`;
    document.getElementById('nome-torneio').value = '';
    document.getElementById('imagem-torneio').value = '';
    document.getElementById('imagem-preview').src = "images/logotype_dark.svg";
    
    document.getElementById('btn-criar-torneio').onclick = criarNovoTorneio;
    document.getElementById('btn-carregar-torneio').onclick = abrirListaTorneiosSalvos;

    modalTorneio.classList.remove('hidden');
  }
}

// Function to toggle the tournament management menu
function toggleTournamentMenu(event) {
  event.stopPropagation();
  const tournamentMenu = document.getElementById('tournament-menu');
  const tournamentTitleContainer = document.getElementById('tournament-title-container');

  if (tournamentMenu) {
    tournamentMenu.classList.toggle('hidden');
    tournamentTitleContainer.classList.toggle('active', !tournamentMenu.classList.contains('hidden'));
  }
}

// Close the tournament menu if clicked outside
document.addEventListener('click', function(event) {
  const tournamentMenu = document.getElementById('tournament-menu');
  const tournamentTitleContainer = document.getElementById('tournament-title-container');

  if (tournamentMenu && !tournamentMenu.classList.contains('hidden') &&
      !tournamentTitleContainer.contains(event.target)) {
    tournamentMenu.classList.add('hidden');
    tournamentTitleContainer.classList.remove('active');
  }
});

// Add this to your `script.js` to handle the image preview in the tournament creation modal
document.addEventListener('DOMContentLoaded', () => {
    const imagemTorneioInput = document.getElementById('imagem-torneio');
    if (imagemTorneioInput) {
        imagemTorneioInput.addEventListener('change', function(event) {
            const previewImage = document.getElementById('imagem-preview');
            const file = event.target.files[0];
            if (file && previewImage) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else if (previewImage) {
                previewImage.src = "images/logotype_dark.svg";
            }
        });
    }
});


/**
 * Retorna as cores primária e secundária de uma equipe.
 * @param {string} nomeEquipe - O nome completo da equipe.
 * @returns {{primaria: string, secundaria: string}} - Objeto com as cores.
 */
function getCoresEquipe(nomeEquipe) {
  const coresDefault = { primaria: "#0232fe", secundaria: "#333333" };

  if (window.coresEquipes && window.coresEquipes[nomeEquipe]) {
    return window.coresEquipes[nomeEquipe];
  }
  
  return coresDefault;
}

