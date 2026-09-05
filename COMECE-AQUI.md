# Elo 2.2 — o que mudou e o que fazer

## O que mudou nesta versão

1. **Entrar na chamada agora é por código curto** (6 letras, tipo `PLR8K2`),
   não mais aquele texto gigante de SDP para copiar e colar. Quem cria a sala
   recebe o código; as outras duas pessoas só digitam ele.
2. **Corrigido o conflito de três pessoas entrando ao mesmo tempo.** Antes,
   se dois amigos colassem convite/resposta em cima da hora, dava para
   embaralhar quem era quem. Agora cada pessoa reserva sua vaga (2ª ou 3ª)
   de forma atômica num servidor — testado entrando com dois convidados
   literalmente ao mesmo instante, sem colisão.
3. **Compartilhamento de tela ganhou um seletor de verdade** (com miniaturas
   de cada tela/janela) dentro do app instalado — antes ele sempre pegava a
   tela principal sem perguntar. O áudio do sistema continua indo junto.
4. Lobby, código da sala e chat com uma leve repaginada visual.

## 1. Coloque estes arquivos na pasta do projeto

Substitua os antigos em `C:\Users\kayan\Desktop\dev\elo\` (ou onde você
mantém o projeto):

- `index.html`   ← **mudou** (código curto de sala, novo visual)
- `main.js`      ← **mudou** (seletor de tela com miniaturas)
- `preload.js`   ← **novo** (necessário para o seletor de tela funcionar)
- `vendor/`      ← **nova pasta** (cliente do PeerJS, incluído localmente)
- `package.json` ← **mudou** (versão 2.2.0, inclui os arquivos novos no instalador)
- `README.md`

Não apague `node_modules`. Ele continua servindo.

## 2. TURN continua opcional, mas ainda vale a pena

Abra o `index.html` e ache o bloco `const TURN` logo no começo do `<script>`:

```js
const TURN = {
  host:     'standard.relay.metered.ca',
  username: '',   // <-- cole aqui
  password: ''    // <-- e aqui
};
```

Credenciais grátis (20 GB/mês): dashboard.metered.ca/signup → plano Free →
Generate Credential.

Sem isso, a chamada ainda funciona na maioria das redes — mas em rede de
operadora brasileira (CGNAT) pode falhar. Já aconteceu com você antes.

## 3. Teste no Chrome ANTES de gerar o .exe

Muito mais rápido que buildar. Na pasta do projeto:

```bash
python -m http.server 8000
```

Abra http://localhost:8000, clique em "Criar uma sala", copie o código e
abra o mesmo endereço em outra aba (ou peça para um amigo abrir e digitar o
código). Se conectar a três, aí sim vale gerar o instalador.

## 4. Gere o instalador

Feche o Elo se estiver aberto (senão dá "Access is denied"):

```bash
rm -rf dist
npm run dist:win
```

Saída: `dist/Elo Setup 2.2.0.exe`. É esse arquivo — e só ele — que você manda
para os dois amigos.

## Regra de ouro

Os três precisam da **mesma versão**. Se um estiver com um `.exe` antigo
(código gigante em vez de código de sala), a sala não fecha.
