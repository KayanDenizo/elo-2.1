// ============================================================================
// ELO — processo principal do Electron.
//
// O Electron é só a "casca": ele abre uma janela Chromium que carrega o
// index.html. Toda a lógica de chamada continua sendo WebRTC do navegador.
// O que precisa ser resolvido AQUI são coisas que o Chrome normal já faz
// sozinho e o Electron não:
//   1. conceder permissão de câmera/microfone;
//   2. deixar a pessoa ESCOLHER qual tela/janela compartilhar (com miniaturas);
//   3. capturar o áudio do sistema junto com a tela (loopback, no Windows).
// ============================================================================

const { app, BrowserWindow, ipcMain, session, desktopCapturer } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 420,
    minHeight: 520,
    backgroundColor: '#0E1116',
    title: 'Elo',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,   // renderer isolado — a página não acessa Node
      nodeIntegration: false,   // e não precisa: só usa APIs de navegador
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  return win;
}

app.whenReady().then(() => {
  const s = session.defaultSession;

  // ---- 1. Permissões de mídia -------------------------------------------
  // No navegador aparece aquele popup "permitir câmera?". No Electron o app
  // é seu, então liberamos direto o que a página realmente usa.
  s.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'display-capture', 'clipboard-sanitized-write'];
    callback(allowed.includes(permission));
  });

  // ---- 2. Compartilhamento de tela, com escolha real de tela/janela ------
  // getDisplayMedia() no Electron não abre sozinho um seletor. Em macOS 15+
  // existe um seletor nativo do sistema (useSystemPicker); em todo o resto
  // (Windows, Linux, macOS mais antigo) esse handler roda e SOMOS NÓS quem
  // decide o que aparece — então construímos nosso próprio seletor com
  // miniaturas, pedindo à página (index.html) para mostrá-lo e esperando
  // a pessoa clicar em uma tela/janela.
  //
  // 'loopback' é o que captura o som do que está tocando na tela — sem ele,
  // o compartilhamento sai mudo mesmo marcando "compartilhar áudio".
  let pendingPick = null;
  ipcMain.on('elo:screen-source-chosen', (_e, sourceId) => {
    if (pendingPick) { pendingPick(sourceId); pendingPick = null; }
  });

  let mainWindow = null;

  try {
    s.setDisplayMediaRequestHandler(
      (request, callback) => {
        desktopCapturer
          .getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 300, height: 200 },
            fetchWindowIcons: true,
          })
          .then(async (sources) => {
            if (!sources.length) return callback({});
            if (!mainWindow || mainWindow.isDestroyed()) return callback({});

            mainWindow.webContents.send(
              'elo:pick-screen-source',
              sources.map((src) => ({
                id: src.id,
                name: src.name,
                thumbnail: src.thumbnail.isEmpty() ? null : src.thumbnail.toDataURL(),
                appIcon: src.appIcon && !src.appIcon.isEmpty() ? src.appIcon.toDataURL() : null,
                isScreen: src.id.startsWith('screen:'),
              }))
            );

            const chosenId = await new Promise((resolve) => { pendingPick = resolve; });
            const source = chosenId && sources.find((s2) => s2.id === chosenId);
            if (!source) return callback({}); // cancelado

            const wantsAudio = request.audioRequested;
            callback({
              video: source,
              // 'loopback' só existe para captura de tela inteira no Windows.
              audio: wantsAudio && process.platform === 'win32' ? 'loopback' : undefined,
            });
          })
          .catch(() => callback({}));
      },
      { useSystemPicker: true }
    );
  } catch (err) {
    console.warn('Seletor de tela indisponível:', err.message);
  }

  mainWindow = createWindow();

  // No macOS o app segue vivo depois de fechar a janela.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
