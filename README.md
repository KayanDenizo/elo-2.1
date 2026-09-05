# Elo

Chamada de vídeo em malha para até **três pessoas**, com câmera, microfone,
compartilhamento de tela (com áudio do sistema) e chat de texto. O vídeo e o
áudio vão direto de uma máquina para a outra (P2P via WebRTC) — nenhum
servidor nosso fica no meio da chamada.

---

## Testar em 30 segundos (sem instalar nada)

Abra o `index.html` em até três computadores — no Chrome ou no Edge.

Se a câmera não abrir ao clicar direto no arquivo, sirva por `localhost`
(que o navegador trata como contexto seguro):

```bash
cd elo
python -m http.server 8000
# abra http://localhost:8000
```

**Como entrar:**

1. Quem cria a chamada clica em **"Criar uma sala"** e recebe um código de
   6 letras (tipo `PLR8K2`).
2. Manda esse código para as outras duas pessoas por qualquer canal
   (WhatsApp, SMS, voz).
3. Cada uma delas clica em **"Entrar com um código"**, digita o código e
   pronto — a chamada abre sozinha nos três lados.

Não tem código gigante para copiar e colar. Por trás dos panos, os três só
precisam se *encontrar* — isso usa o broker público e gratuito do
[PeerJS](https://peerjs.com) só para essa apresentação inicial; o vídeo, o
áudio e o chat continuam 100% ponto a ponto depois disso. Se dois convidados
digitarem o código ao mesmo tempo, cada um cai numa vaga diferente
automaticamente — sem briga de sala.

---

## Instalar de verdade (gerar o `.exe`)

Isso é o que transforma a pasta num app instalável que seu amigo abre pelo
menu Iniciar.

```bash
cd elo
npm install
npm start          # roda em modo desenvolvimento
npm run dist:win   # gera o instalador em dist/
```

O instalador sai em `dist/Elo Setup 2.2.0.exe`. Só mandar esse arquivo para ele.

- macOS: `npm run dist:mac` → `.dmg`
- Linux: `npm run dist:linux` → `.AppImage`

Um detalhe honesto: o instalador não vai ser assinado digitalmente. O Windows
vai mostrar "Editor desconhecido" e seu amigo precisa clicar em
*Mais informações → Executar assim mesmo*. Certificado de code signing custa
dinheiro (uns US$ 100–400/ano) e só vale a pena se você for distribuir de verdade.

---

## Limitações reais (leia antes de prometer pro seu amigo)

**1. Sem TURN, a conexão falha em muitas redes.** O STUN só descobre seu IP
público. Em CGNAT de operadora, rede de faculdade ou NAT simétrica não existe
caminho direto entre as duas máquinas, e a chamada morre em "negociando".
A solução é um servidor **TURN**, que retransmite o vídeo.

Como configurar (grátis, 20 GB por mês):

1. Crie conta em [dashboard.metered.ca/signup](https://dashboard.metered.ca/signup)
2. Dê um nome ao app e escolha o plano **Free**
3. Clique em **Generate Credential**
4. Abra o `index.html`, ache o bloco `const TURN` logo no começo do `<script>`
   e cole usuário e senha:

```js
const TURN = {
  host:     'standard.relay.metered.ca',
  username: 'seu_usuario_aqui',
  password: 'sua_senha_aqui'
};
```

Os dois lados precisam da versão com as credenciais. Depois de conectar, o canto
superior direito mostra se foi **conexão direta** ou **via relay (TURN)** — bom
para saber se você está gastando a cota.

Alternativa sem depender de terceiro: subir um
[coturn](https://github.com/coturn/coturn) numa VPS.

**2. O código da sala passa por um servidor de terceiro (PeerJS).** É o broker
público gratuito `0.peerjs.com`, usado só para os três participantes se
encontrarem — ele nunca vê vídeo, áudio ou chat, só os três IDs
`elo-<código>-A/B/C`. Para não depender dele (ou se ele estiver fora do ar),
dá para subir seu próprio [PeerServer](https://github.com/peers/peerjs-server)
de graça no Render/Fly.io e apontar `host`/`port`/`key` no `new Peer(...)`
dentro do `index.html`.

**3. Até três pessoas.** A malha P2P (cada um manda vídeo para os outros dois)
não escala além disso: uma quarta pessoa dobraria de novo o tráfego de saída
de todo mundo. Para 4+ pessoas ao mesmo tempo entra uma SFU
(mediasoup, LiveKit, Janus) — arquitetura bem diferente.

**4. Ainda não tem criptografia de aplicação.** O WebRTC já criptografa a mídia
em trânsito por padrão (DTLS-SRTP), então ninguém no caminho vê o vídeo. Mas
quem descobrir o código da sala entra como se fosse a terceira pessoa — mande
o código por um canal em que você confia, e não em público.

---

## Onde mexer

| Arquivo | O que faz |
|---|---|
| `index.html` | O app inteiro: interface, CSS e toda a lógica WebRTC/PeerJS |
| `main.js` | Casca Electron: janela, permissão de mídia, seletor de tela/janela |
| `preload.js` | Ponte segura entre a página e o Electron (só o seletor de tela passa por aqui) |
| `vendor/peerjs.min.js` | Cliente do PeerJS, baixado do npm e incluído localmente |
| `package.json` | Scripts e configuração do instalador |

Os pontos-chave no `index.html` estão numerados em comentários (1. mídia local,
2. mixer de áudio tela+mic, 3. sala/PeerJS, 4. grade de vídeo, 5. controles,
6. chat, 7. seletor de tela, 8. lobby, 9. utilitários).

---

## Por que isso vale como projeto de portfólio

Chamada de vídeo é um dos poucos temas em que dá para demonstrar de uma vez:
negociação de SDP, ICE/NAT traversal, manipulação de `MediaStreamTrack`,
`replaceTrack` sem renegociar, `RTCDataChannel` e empacotamento desktop.
É bem mais convincente numa entrevista do que mais um CRUD.
