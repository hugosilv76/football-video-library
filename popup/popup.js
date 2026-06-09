// popup/popup.js

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('save-video-form');
  if (!form) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const titleInput = document.getElementById('title');
  if (titleInput) titleInput.value = tab.title ? tab.title.split('-')[0].trim() : "Vídeo de Futebol";

  // FUNÇÃO EM FALTA: Obrigatória para evitar o erro de execução
  const detectPlatform = (url) => {
    if (!url) return 'Web';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com')) return 'Facebook';
    return 'Web';
  };

  const dashboardBtn = document.getElementById('open-dashboard');
if (dashboardBtn) {
  dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });
}

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const payload = {
      title: document.getElementById('title')?.value || "Exercício",
      url: tab.url,
      platform: detectPlatform(tab.url),
      category: document.getElementById('category')?.value || "Geral",
      ageGroup: document.getElementById('age-group')?.value || "Sub-12",
      tags: document.getElementById('tags')?.value.split(',').filter(t => t.trim().length > 0).map(t => t.trim()) || [],
      notes: document.getElementById('notes')?.value || ""
    };

    chrome.runtime.sendMessage({ action: "capturar_gravar_video", payload }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Erro na comunicação:", chrome.runtime.lastError.message);
        alert("Erro: Não foi possível comunicar com o background.");
      } else if (response?.success) {
        // A LINHA ABAIXO FOI REMOVIDA OU COMENTADA:
        // alert("Vídeo guardado com sucesso!");
        // Opcional: Podes fechar apenas a janela silenciosamente
        window.close();
      } else {
        alert("Falha ao guardar o vídeo.");
      }
    });
  });
});