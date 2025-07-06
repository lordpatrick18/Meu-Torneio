// ==========================================================
// FAVORITA.JS - VERSÃO FINAL CORRIGIDA
// (Substitua todo o conteúdo do seu arquivo por este código)
// ==========================================================

let equipeFavorita = null;

/**
 * Abre o modal de seleção de equipe favorita, usando o mesmo estilo de card do modal de potes.
 * A lista de equipes é baseada nos times que já foram adicionados aos potes.
 */
// Substitua a função existente em favorita.js por esta
function abrirSelecaoFavorita() {
  const modal = document.getElementById('modal-favorita');
  if (!modal) return;

  const todasEquipesNosPotes = [...new Set(Object.values(potes).flat())];
  let modalContent = '';

  // Container principal do modal com o cabeçalho
  let baseHtml = `
    <div class="modal-conteudo">
      <div class="modal-header-card">
        <h3>Escolha sua equipe favorita</h3>
        <button class="fechar-modal" onclick="fecharSelecaoFavorita()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="custom-scroll-area">
  `;

  // VERIFICA SE EXISTEM EQUIPES NOS POTES
  if (todasEquipesNosPotes.length === 0) {
    // Se não houver equipes, exibe a mensagem de potes vazios
    baseHtml += `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255, 255, 255, 0.7); font-style: italic; font-size: 1.1rem; text-align: center; padding: 2rem;">
          Adicione equipes aos potes primeiro para poder escolher uma favorita.
        </div>
    `;
  } else {
    // Se houver equipes, exibe a lista de cards
    todasEquipesNosPotes.sort((a, b) => formatarNomeExibicao(a).localeCompare(formatarNomeExibicao(b)));
    baseHtml += `
        <div class="equipes-disponiveis-container">
          ${todasEquipesNosPotes.map(equipe => {
            const escudo = getEscudoPath(equipe);
            const nomeExibicao = formatarNomeExibicao(equipe);
            const pais = getPais(equipe);
            const cores = getCoresEquipe(equipe);
            
            // CORRIGIDO: Mantém o visual listrado, mas agora com as 3 cores.
            const backgroundStyle = `background: repeating-linear-gradient(45deg, ${cores.primaria}, ${cores.primaria} 10px, ${cores.secundaria} 10px, ${cores.secundaria} 20px, ${cores.terciaria} 20px, ${cores.terciaria} 30px);`;
            
            return `
              <div class="equipe-card-container">
                <div class="equipe-card" style="${backgroundStyle}" data-equipe="${equipe}">
                    <img 
                      src="${escudo}" 
                      class="escudo" 
                      alt="${nomeExibicao}"
                      onerror="this.onerror=null; this.src='images/default.png';"
                    >
                    <div class="nome-modal">${nomeExibicao}</div>
                    <div class="sigla-modal">${pais}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
    `;
  }

  // Fecha as tags do container
  baseHtml += `
      </div>
    </div>
  `;

  modal.innerHTML = baseHtml;
  modal.classList.remove('hidden');

  // Lógica de clique
  modal.addEventListener('click', function(event) {
      const card = event.target.closest('.equipe-card');
      if (card && card.dataset.equipe) {
          selecionarEquipeFavorita(card.dataset.equipe);
      }
  });
}
/**
 * Salva a equipe escolhida, fecha o modal e atualiza a interface.
 */
// CÓDIGO NOVO E CORRIGIDO
function selecionarEquipeFavorita(equipe) {
  // Define a nova equipe favorita na variável global
  window.equipeFavorita = equipe;

  // Fecha o modal de seleção
  fecharSelecaoFavorita();
  
  // Atualiza a interface para mostrar a nova equipe favorita destacada
  atualizarFavoritosNaTela();

  // **PASSO CRUCIAL ADICIONADO**
  // Salva imediatamente todo o estado do torneio atual.
  // Isso garante que a nova equipe favorita seja associada ao perfil correto.
  if (typeof salvarDadosTorneio === 'function') {
    // O 'false' indica que não é um torneio novo, apenas uma atualização.
    salvarDadosTorneio(false); 
  }
}
/**
 * Aplica os efeitos visuais (gradientes, etc.) na equipe favorita em todas as telas.
 */
function atualizarFavoritosNaTela() {
    // 1. Limpa todas as marcações de favoritos da execução anterior
    document.querySelectorAll('.equipe-favorita').forEach(el => el.classList.remove('equipe-favorita'));
    document.querySelectorAll('.nome-favorito').forEach(el => el.classList.remove('nome-favorito'));
    document.querySelectorAll('.pais-favorito-gradient').forEach(el => el.classList.remove('pais-favorito-gradient'));
    const favButton = document.querySelector('.favorite-button');
    if (favButton) {
        favButton.classList.remove('favorita-selecionada');
    }

    // 2. Atualiza o botão principal no cabeçalho
    if (favButton) {
        if (equipeFavorita) {
            const escudo = getEscudoPath(equipeFavorita);
            const nome = formatarNomeExibicao(equipeFavorita);
            const pais = getPais(equipeFavorita);
            favButton.innerHTML = `
                <img src="${escudo}" class="escudo-favorita" alt="${nome}" />
                <span class="nome-favorita">${nome}</span>
                <span class="pais-favorita">(${pais})</span>
            `;
            favButton.classList.add('favorita-selecionada');
        } else {
            favButton.innerHTML = `Equipa Favorita <i class="fa-solid fa-plus"></i>`;
        }
    }

    if (!equipeFavorita) return;

    // 4. Lógica para encontrar e marcar a equipe em todas as telas
    const nomeFavoritoLimpo = formatarNomeExibicao(equipeFavorita).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const seletoresDeNomes = '.pote-card-nome, .nome-sorteado, .nome-completo, .nome-equipe-partida, .nome-equipe-classificacao, .nome-equipe';
    document.querySelectorAll(seletoresDeNomes).forEach(elementoNome => {
        const nomeNaTela = elementoNome.textContent.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (nomeNaTela === nomeFavoritoLimpo) {
            elementoNome.classList.add('nome-favorito');
            const cardPrincipal = elementoNome.closest('.pote-equipe-item, .card-sorteado, .grupo-equipe, .linha-cards, .equipe-lado');
            if (cardPrincipal) {
                cardPrincipal.classList.add('equipe-favorita');
               const seletoresDePais = '.pote-card-pais, .pais-sorteado, .sigla-pais, .pais-equipe-partida, .pais-equipe-classificacao, .pais-equipe-card';
                const paisElemento = cardPrincipal.querySelector(seletoresDePais);
                if (paisElemento) {
                    paisElemento.classList.add('pais-favorito-gradient');
                }
            }
        }
    });
}

function fecharSelecaoFavorita() {
  const modal = document.getElementById('modal-favorita');
  if (modal) {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  }
}

// Funções auxiliares (devem permanecer no arquivo)
function formatarNomeComEscudo(nome, grupo = '') {
  const escudo = getEscudoPath(nome);
  const nomeFormatado = formatarNomeExibicao(nome);
  return `
    <span class="nome-equipe" data-equipe="${nome}">
      <img src="${escudo}" alt="${nomeFormatado}" class="escudo-grupo" />
      ${nomeFormatado}
    </span>
  `;
}

function getEscudoPath(equipe) {
  if (!equipe) {
    return 'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png';
  }
  const userShieldKey = getUserUploadedEscudoStorageKey(equipe);
  // A variável 'escudosCustomizados' precisa estar definida globalmente
  const userUploaded = window.escudosCustomizados ? window.escudosCustomizados[userShieldKey] : null;
  if (userUploaded && userUploaded.startsWith('data:image')) {
    return userUploaded;
  }
  const nomeBase = equipe.split(' (')[0];
  const pais = equipe.match(/\(([A-Z]{3})\)/)?.[1] || '';
  const nomeNormalizado = nomeBase.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '_');
  return `images/${nomeNormalizado}_${pais.toLowerCase()}.png`;
}

function getUserUploadedEscudoStorageKey(equipe) {
  if (!equipe) return '';
  const nomeBase = equipe.split(' (')[0];
  const cleanName = nomeBase.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '_');
  return `escudo_user_${cleanName}`;
}

function formatarNomeExibicao(equipe) {
  if (!equipe) return '';
  return equipe.split(' (')[0];
}

function getPais(equipe) {
  if (!equipe) return '';
  const match = equipe.match(/\(([^)]+)\)/);
  return match ? match[1] : '';
}

document.addEventListener('DOMContentLoaded', () => {
  const favButton = document.querySelector('.favorite-button');
  if (favButton) {
    favButton.addEventListener('click', abrirSelecaoFavorita);
  }
  atualizarFavoritosNaTela();
  document.querySelectorAll('.menu-items a').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(() => atualizarFavoritosNaTela(), 300);
    });
  });
});
