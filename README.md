# mls-102041 — collabInitial (shell de produção do studio)

Este projeto é o **shell** (base do ambiente studio): as tags do `l2/index.html`
(`collab-page`, `collab-nav-1/2/3`, `collab-spliter`, etc.) formam a casca que
carrega o resto do sistema. Ele é publicado como site estático no S3/CDN.

## Publish / rollback pela linha de comando

O publish e o rollback rodam **fora do studio**, por
[scripts/publish/publishStudio.mjs](../scripts/publish/publishStudio.mjs).

Motivo (TASK-102041-3): o publish antigo é um service **dentro do próprio
sistema** ([servicePublish.ts](l2/servicePublish.ts)). Se uma versão quebrada for
publicada, o sistema não boota e o Publish fica inacessível → **lockout** (não dá
para publicar a correção nem voltar). O CLI ataca isso por dois lados:

- **`rollback`** — restaura uma versão anterior por cópia dentro do S3, sem
  depender de build nem do sistema estar de pé. É o socorro imediato.
- **`publish`** — faz o build **100% local a partir do git** (não do stor do
  browser) e sobe. Elimina o risco de cache de stor desatualizado e não depende
  do sistema publicado estar saudável.

O `servicePublish` dentro do studio continua existindo como conveniência de UI;
o CLI é o caminho canônico e de recuperação.

---

## 1. Configuração (uma vez)

As credenciais S3 ficam em `servers/s3.conf` (gitignored). Copie o exemplo e
preencha com os mesmos valores da aba **Config** do servicePublish:

```bash
cp servers/s3.conf.example servers/s3.conf
```

Campos (todos também aceitos como variável de ambiente, que vence o arquivo):

| Chave              | Obrigatório | Descrição |
| ------------------ | ----------- | --------- |
| `S3_BUCKET`        | sim         | Bucket de destino |
| `S3_REGION`        | sim         | Região (ex.: `us-east-1`) |
| `S3_ACCESS_KEY_ID` | sim         | Access key |
| `S3_SECRET_KEY`    | sim         | Secret key |
| `S3_ENDPOINT`      | não         | Endpoint S3-compatible custom (vazio = AWS) |
| `CDN_BASE`         | não         | Base pública gravada no `<base href>` (default `https://cdn.collab.codes`) |

> `S3_*` é **onde grava** (bucket). `CDN_BASE` é **por onde o usuário acessa**
> (CDN público). Costumam ser domínios diferentes — mantenha os dois coerentes.

---

## 2. Comandos

Todos rodam da raiz do repo (`mls-base`).

### `list` — ver o que está publicado

```bash
node scripts/publish/publishStudio.mjs list
```

Lista as versões (`datetime14`) em `www/` do bucket, marcando qual está apontada
pelo `latest.json` e qual está no `index.html` da raiz. Use para descobrir o
`datetime14` de um rollback.

### `publish` — build local + upload

```bash
# publica todos os idiomas do l5/project.json
node scripts/publish/publishStudio.mjs publish

# só alguns idiomas
node scripts/publish/publishStudio.mjs publish --langs en,pt

# build local SEM subir (inspecionar .publishStudio/out/ antes)
node scripts/publish/publishStudio.mjs publish --dry-run
```

O que o `publish` faz, em ordem:

1. **compila** (`tsc`, `noEmitOnError:false`) para `.publishStudio/dist` e injeta
   o CSS por componente (rotina mls-ci — o mesmo `if(this.loadStyle)…` que o
   service worker faz no studio). Roda só nos projetos que o shell usa.
2. **bundla** o `index.html` com esbuild nativo a partir do staging (equivalente
   ao `buildIndex` do studio, mas lendo do disco em vez de `fetch`).
3. Para cada idioma gera `www/<versão>/<lang>/index.html` com o `<base href>`
   apontando para `CDN_BASE/www/<versão>/<lang>/`.
4. **sobe os assets** de `mls-102041/l3/` para `www/<versão>/<lang>/l3/` em cada
   idioma (necessários para o site funcionar).
5. sobrescreve o `index.html` da **raiz** com o do primeiro idioma (é o que boota
   o site) e atualiza o `latest.json`.
6. valida que a raiz passou a apontar para a nova versão.

Flags do `publish`:

| Flag                 | Efeito |
| -------------------- | ------ |
| `--langs en,pt`      | Só esses idiomas (default: todos do `l5/project.json`) |
| `--dry-run`          | Gera tudo em `.publishStudio/out/<versão>/` e **não** sobe nada |
| `--skip-assets`      | Não sobe o `l3/` (só o `index.html`) |
| `--skip-compile`     | Reaproveita o `.publishStudio/dist` já compilado (pula o `tsc`) |
| `--project <id>`     | Projeto shell a publicar (default `102041`) |
| `--theme <nome>`     | Tema do design system para o CSS global (default `Default`) |

### `rollback` — voltar para uma versão anterior

```bash
# volta para uma versão específica (pegue o datetime14 no `list`)
node scripts/publish/publishStudio.mjs rollback 20260714093632

# se a versão tiver mais de um idioma, escolha qual vai para a raiz
node scripts/publish/publishStudio.mjs rollback 20260714093632 --lang en
```

Copia (server-side, dentro do S3) o `index.html` daquela versão para a raiz,
atualiza o `latest.json` e valida. Não recompila nada — recupera em segundos.

---

## 3. Fluxo recomendado

```bash
# 1. configurar credenciais (uma vez)
cp servers/s3.conf.example servers/s3.conf   # e preencher

# 2. conferir o estado atual
node scripts/publish/publishStudio.mjs list

# 3. build local e inspeção (sem subir)
node scripts/publish/publishStudio.mjs publish --dry-run
#    → abrir .publishStudio/out/<versão>/en/index.html e conferir

# 4. publicar
node scripts/publish/publishStudio.mjs publish

# 5. se algo quebrar, voltar para a versão boa anterior
node scripts/publish/publishStudio.mjs rollback <datetime14>
```

---

## 4. Estrutura publicada no S3

```
www/
  <datetime14>/            versão (nunca sobrescrita; permanece para rollback)
    en/
      index.html           base href → CDN_BASE/www/<datetime14>/en/
      l3/_100529_/...       assets deste idioma
    pt/
      index.html
      l3/_100529_/...
index.html                 = index.html do 1º idioma da última publicação (boot)
latest.json                { "www": "<datetime14>" }
```

Cada versão é imutável e fica no bucket; o rollback é só reapontar a raiz +
`latest.json` para uma pasta `www/<datetime14>/` que já existe.

---

## 5. Notas

- **Assets (`l3/`)**: vêm de `mls-102041/l3/` (no git) e sobem em cada idioma. O
  shell referencia `./l3/_100529_/…`, que resolve contra o `<base href>` de cada
  `<lang>/`. Cada publish reenvia os arquivos a partir da sua máquina.
- **Build local vs. studio**: o CLI reproduz o pós-processamento do enhancement
  (`onAfterCompileAction` → injeção de CSS) via `tsc` + mls-ci, porque fora do
  studio não há service worker. Antes do primeiro publish de produção, vale um
  **teste de paridade**: comparar o `index.html` gerado pelo `--dry-run` com o
  gerado pelo servicePublish no studio (ignorando `base href`/versão).
- **Arquivos temporários**: `.publishStudio/` e `tsconfig.publishStudio.json` são
  gitignored.
- **`pnpm build` / `publishMlsBase.py`** são **outra coisa**: aquele é o publish
  de dev dos projetos-cliente para a VM. Este README é só do shell studio no S3.
