/// background/service-worker.js

chrome.runtime.onInstalled.addListener(async () => {
  console.log('A inicializar regras de rede...');
  await setupRules();
});

async function setupRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);

    // Regra simples: apenas para remover cabeçalhos restritivos
    const newRules = [{
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "X-Frame-Options", operation: "remove" },
          { header: "Content-Security-Policy", operation: "remove" }
        ]
      },
      condition: { urlFilter: "*instagram.com/*", resourceTypes: ["sub_frame"] }
    }];

    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds, addRules: newRules });
  } catch (err) {
    console.log('Regras geridas pelo sistema.');
  }
}

// Handler para capturar vídeo
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capturar_gravar_video") {
    // 1. Tira a captura
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 50 }, (dataUrl) => {
      const newVideo = {
        ...message.payload,
        id: Date.now().toString(),
        thumbnail: dataUrl || '',
        created_at: new Date().toISOString(),
        favorite: false
      };

      // 2. Guarda no storage
      chrome.storage.local.get({ videos: [] }, (result) => {
        const videos = result.videos || [];
        videos.push(newVideo);
        chrome.storage.local.set({ videos }, () => {
          sendResponse({ success: true, id: newVideo.id });
        });
      });
    });
    return true; 
  }
});