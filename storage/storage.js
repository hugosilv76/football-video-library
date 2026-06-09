// storage/storage.js

const StorageService = {
  // Obter todos os vídeos
  getVideos: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get({ videos: [] }, (result) => {
        resolve(result.videos);
      });
    });
  },

  // Guardar ou atualizar um vídeo
  saveVideo: async (videoData) => {
    const videos = await StorageService.getVideos();
    
    if (videoData.id) {
      // Editar existente
      const index = videos.findIndex(v => v.id === videoData.id);
      if (index !== -1) videos[index] = videoData;
    } else {
      // Criar novo
      videoData.id = Date.now().toString();
      videoData.created_at = new Date().toISOString();
      videoData.favorite = false;
      videos.push(videoData);
    }

    return new Promise((resolve) => {
      chrome.storage.local.set({ videos }, () => resolve(videoData));
    });
  },

  // Eliminar vídeo
  deleteVideo: async (id) => {
    let videos = await StorageService.getVideos();
    videos = videos.filter(v => v.id !== id);
    return new Promise((resolve) => {
      chrome.storage.local.set({ videos }, () => resolve(true));
    });
  },

  // Alternar Favorito
  toggleFavorite: async (id) => {
    const videos = await StorageService.getVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
      videos[index].favorite = !videos[index].favorite;
      await chrome.storage.local.set({ videos });
      return videos[index];
    }
    return null;
  },

  // Detetar Plataforma automaticamente através do URL
  detectPlatform: (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'X';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('vimeo.com')) return 'Vimeo';
    return 'Web';
  }
};