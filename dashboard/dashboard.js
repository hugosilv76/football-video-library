// dashboard/dashboard.js

const LocalStorage = {
  getVideos: () => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['videos'], (result) => {
          resolve(result.videos || []);
        });
      } else {
        const localData = localStorage.getItem('mock_videos');
        resolve(localData ? JSON.parse(localData) : []);
      }
    });
  },
  deleteVideo: async (id) => {
    let videos = await LocalStorage.getVideos();
    videos = videos.filter(v => v.id !== id);
    return new Promise((resolve) => {
      chrome.storage.local.set({ videos }, () => resolve(true));
    });
  },
  toggleFavorite: async (id) => {
    const videos = await LocalStorage.getVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
      videos[index].favorite = !videos[index].favorite;
      await chrome.storage.local.set({ videos });
      return videos[index];
    }
    return null;
  }
};

function getPlatformThumbnail(video) {
  // Se tiver miniatura guardada, usa-a
  if (video.thumbnail && video.thumbnail.startsWith('data:image')) {
    return video.thumbnail;
  }
  
  // Se for YouTube, gera dinamicamente
  if (video.platform === 'YouTube') {
    let videoId = video.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    if (videoId) return `https://img.youtube.com/vi/${videoId[1]}/hqdefault.jpg`;
  }
  
  // Fallback visual (evita o preto total)
  return 'linear-gradient(135deg, #21262d 0%, #161b22 100%)';
}

document.addEventListener('DOMContentLoaded', () => {
  let allVideos = [];
  let filterMode = 'all';

  const videoGrid = document.getElementById('video-grid');
  const modal = document.getElementById('video-modal');
  const closeModal = document.querySelector('.close-modal');

  async function loadLibrary() {
  console.log("A tentar carregar o storage...");
  
  chrome.storage.local.get(['videos'], (result) => {
    if (chrome.runtime.lastError) {
      console.error("ERRO DE STORAGE:", chrome.runtime.lastError);
      return;
    }
    
    console.log("Dados recebidos:", result);
    allVideos = result.videos || [];
    renderVideos(allVideos);
  });
}

  function renderVideos(videosToRender) {
    if (!videoGrid) return;
    videoGrid.innerHTML = '';
    
    const filtered = (Array.isArray(videosToRender) ? videosToRender : []).filter(v => filterMode === 'all' || v.favorite);

    filtered.forEach(video => {
      const thumbSource = getPlatformThumbnail(video);
      const isImgUrl = thumbSource.startsWith('http') || thumbSource.startsWith('data:image');
      // Converte array de tags numa string visual
      const tagsHtml = (video.tags || []).map(t => `<span class="tag">#${t}</span>`).join(' ');

      const card = document.createElement('div');
      card.className = 'video-card';
      card.style.border = "1px solid #30363d";
      card.style.borderRadius = "8px";
      card.style.background = "#161b22";

      card.innerHTML = `
        <div class="card-thumb" style="height: 160px; display: flex; align-items: center; justify-content: center; overflow:hidden; background: ${!isImgUrl ? thumbSource : '#000'};">
          ${isImgUrl ? `<img src="${thumbSource}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="color:#fff;">${video.platform}</span>`}
        </div>
        <div class="card-body" style="padding: 12px; color: #c9d1d9;">
          <h4 style="margin: 0 0 5px 0;">${video.title || "Sem Título"}</h4>
          <p style="font-size: 12px; color: #8b949e; margin: 5px 0;">${video.notes || "Sem notas."}</p>
          <div style="margin: 5px 0;">${tagsHtml}</div>
          <div class="card-actions" style="margin-top: 10px; display: flex; gap: 5px;">
            <button class="btn-view" data-id="${video.id}">Ver</button>
            <button class="btn-del" data-id="${video.id}">🗑️</button>
          </div>
        </div>
      `;
      videoGrid.appendChild(card);
    });
  }

  // --- FUNÇÃO DO MODAL CORRIGIDA ---
  window.openVideoModal = function(id) {
    const video = allVideos.find(v => v.id === id);
    if (!video) return;

    const modal = document.getElementById('video-modal');
    const videoBox = document.getElementById('modal-video-box');
    const titleEl = document.getElementById('modal-title');
    
    // --- 1. PREENCHIMENTO DE DADOS (O QUE FALTAVA) ---
    titleEl.textContent = video.title;
    document.getElementById('modal-notes').textContent = video.notes || "Sem notas registadas.";
    
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = (video.tags || []).map(t => 
      `<span class="tag" style="background:#21262d; padding:2px 6px; border-radius:4px; margin-right:5px; font-size:12px; color: #8b949e;">#${t}</span>`
    ).join('');
    
    document.getElementById('modal-raw-url').href = video.url;

    // --- 2. LÓGICA DE EMBED (A TUA LÓGICA ATUAL) ---
    videoBox.innerHTML = ''; 
    const container = document.createElement('div');
    container.className = "iframe-wrapper"; 
    container.style.width = "100%";
    container.style.height = "500px";

    if (video.platform === 'Instagram') {
      const embedUrl = video.url.split('?')[0].replace(/\/$/, "") + "/embed/";
      container.innerHTML = `<iframe src="${embedUrl}" style="width:100%; height:100%; border:none;" allowtransparency="true" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>`;
    } 
    else if (video.platform === 'Facebook') {
      const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=0`;
      container.innerHTML = `
        <iframe 
          src="${embedUrl}" 
          style="width:100%; height:100%; border:none; overflow:hidden;" 
          scrolling="no" 
          frameborder="0" 
          allowfullscreen="true" 
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
        </iframe>`;
    }
    else {
      container.innerHTML = `<iframe src="${video.url}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>`;
    }
    
    videoBox.appendChild(container);
    modal.style.display = 'flex'; 
  };

  // BOTÃO X: Garantir que funciona independentemente de onde o user clica
  document.querySelector('.close-modal').addEventListener('mousedown', (e) => {
    e.stopPropagation(); // Impede que o clique se propague
    document.getElementById('video-modal').style.display = 'none';
    document.getElementById('modal-video-box').innerHTML = ''; // Destrói o iFrame imediatamente
  });

  // --- CORREÇÃO DO BOTÃO FECHAR (X) ---
  if (closeModal) {
    closeModal.onclick = () => {
      document.getElementById('modal-video-box').innerHTML = ''; // Destrói o iFrame
      modal.style.display = 'none';
    };
  }
  
  // Fecha ao clicar fora
  window.onclick = (e) => { if (e.target === modal) closeModal.onclick(); };

  // --- EVENT LISTENERS ---
  if (videoGrid) {
    videoGrid.addEventListener('click', async (e) => {
      // Procura o botão mais próximo, independentemente de clicares no ícone ou no botão
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      if (!id) return;

      if (btn.classList.contains('btn-view')) {
        openVideoModal(id);
      } 
      else if (btn.classList.contains('btn-del')) {
        // Confirmação para evitar apagar por engano
        if (confirm('Desejas remover este exercício da tua biblioteca?')) {
          await LocalStorage.deleteVideo(id);
          // Recarrega os dados e renderiza a grelha novamente
          loadLibrary(); 
        }
      }
    });
  }

  loadLibrary();
});