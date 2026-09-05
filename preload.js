// ============================================================================
// ELO — ponte seguura entre a página (renderer, sem Node) e o processo
// principal (main.js, com Node). contextIsolation:true bloqueia o acesso
// direto do renderer ao Electron/Node — esta é a única porta liberada, e só
// para o que a página realmente precisa: escolher qual tela/janela compartilhar.
// ============================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('eloDesktop', {
  // main.js chama isso quando getDisplayMedia() foi pedido e precisa que
  // o usuário escolha qual tela/janela compartilhar.
  onPickScreenSource: (callback) => {
    ipcRenderer.on('elo:pick-screen-source', (_e, sources) => callback(sources));
  },
  // A página devolve o id escolhido (ou null se a pessoa cancelou).
  chooseScreenSource: (id) => ipcRenderer.send('elo:screen-source-chosen', id),
});
