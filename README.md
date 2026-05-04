# Gerenciador de Tickets

Sistema de gerenciamento de tickets com processamento assíncrono via fila, SLA configurável e autenticação JWT.

## Stack

**Back-end:** NestJS · Prisma · PostgreSQL · BullMQ · Redis · JWT  
**Front-end:** React · Vite · TypeScript · Tailwind CSS  
**Infra:** Docker · docker-compose

---

## Como rodar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [docker-compose](https://docs.docker.com/compose/) instalados

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd gerenciador-tickets
```

### 2. Gere o JWT_SECRET

```bash
openssl rand -hex 32
```

### 3. Crie o arquivo `.env` na raiz do projeto

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_aqui
POSTGRES_DB=gerenciador_tickets

JWT_SECRET=cole_o_valor_gerado_acima
JWT_TTL=3600

ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=senha_forte_aqui

CORS_ORIGIN=http://localhost
```

> O `.env` nunca deve ser commitado. Um usuário admin é criado automaticamente na primeira inicialização com as credenciais definidas acima.

### 4. Suba os containers

```bash
docker compose up --build -d
```

O comando sobe quatro containers: **app** (API NestJS), **fe** (React via Nginx), **db** (PostgreSQL) e **redis**. As migrations do banco e o seed do admin rodam automaticamente.

### 5. Acesse a aplicação

| Serviço | URL |
|---------|-----|
| Front-end | http://localhost |
| API | http://localhost:3000 |

### Comandos úteis

```bash
# Ver logs da API em tempo real
docker compose logs app -f

# Parar todos os containers
docker compose down

# Parar e remover volumes (apaga o banco)
docker compose down -v

# Rebuild de um serviço específico
docker compose up --build -d app
```

### Rotas da API

Todas as rotas exceto `/user/login` e `/user/register` exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /user/register | Cadastro de usuário |
| POST | /user/login | Login — retorna o access token |
| POST | /user/logout | Logout — invalida a sessão no Redis |
| GET | /tickets/getAllTickets | Lista tickets (filtros: `status`, `priority`, `title`) |
| POST | /tickets/createTicket | Cria ticket e enfileira processamento |
| PATCH | /tickets/updateTicket/:id | Atualiza título, descrição, status ou prioridade |
| DELETE | /tickets/SoftDeleteById/:id | Remove ticket (soft delete) |
| GET | /sla/configs | Lista todas as configurações de SLA |
| GET | /sla/config/:priority | Busca SLA por prioridade |
| POST | /sla/config | Cria configuração de SLA |
| PATCH | /sla/config/:priority | Atualiza prazo de SLA |
| DELETE | /sla/config/:priority | Remove configuração de SLA |

---

## Decisões técnicas e trade-offs

### NestJS com módulos separados por domínio

Escolhi NestJS pela injeção de dependência nativa e pela estrutura modular que força separação de responsabilidades desde o início. O trade-off é mais boilerplate comparado a um Express puro — mas em qualquer sistema que cresce, essa estrutura paga a conta.

Cada domínio (`tickets`, `sla`, `user`, `auth`) é um módulo isolado com suas próprias rotas, serviços e DTOs. Mudanças em um domínio não vazam para os outros.

### PostgreSQL em vez de SQLite

SQLite é prático para protótipos, mas não suporta escrita concorrente de forma confiável. Com PostgreSQL tenho transações ACID, suporte a múltiplas conexões simultâneas e constraints reais no banco. O trade-off é exigir Docker para rodar localmente — aceitável dado que o projeto já usa docker-compose.

### Redis com dois papéis

Redis está sendo usado tanto para as filas do BullMQ quanto para o armazenamento de sessões JWT. A separação é por prefixo de chave (`bull:*` para filas, `user:{id}` para sessões), sem conflito. 

O trade-off é que Redis vira um ponto crítico: se cair, tanto o processamento assíncrono quanto a autenticação são afetados. Em produção isso se resolve com Redis Cluster ou um Redis Sentinel, mas para o escopo atual um único Redis com health check já cobre.

### BullMQ para processamento assíncrono

A criação do ticket responde imediatamente ao cliente com o estado `PENDING`. O worker processa em background e atualiza para `OPEN`. Se falhar, reexecuta com backoff exponencial por até 3 tentativas; após isso marca como `FAILED` e registra no histórico.

O trade-off é complexidade operacional: agora tenho um worker rodando além da API. A vantagem é que falhas no processamento não afetam o cliente e são recuperáveis automaticamente.

### Soft delete com histórico de ações

Tickets nunca são deletados fisicamente — recebem um `deleteAt` com timestamp. Toda ação (criação, atualização, mudança de status, remoção) é registrada na tabela `TicketHistory`.

O trade-off é que as queries precisam filtrar registros deletados e a tabela de histórico cresce indefinidamente. Em produção implementaria archiving para mover histórico antigo para cold storage.

### Status como String no banco

Optei por `String` em vez de um enum nativo do PostgreSQL para o campo `status`. Isso permite adicionar novos valores (como `CONCLUDED`) sem precisar de uma migration de alteração de tipo — basta atualizar o enum no código. O trade-off é que a validação fica na camada de aplicação (DTO) em vez de no banco.

### JWT com invalidação via Redis

JWT puro é stateless — não tem como revogar um token antes de expirar. Armazenando o token no Redis com a chave `user:{id}`, consigo invalidar a sessão no logout deletando a chave. A strategy valida se o token do request ainda existe no Redis antes de autorizar.

O trade-off é que agora cada requisição autenticada faz uma consulta ao Redis, adicionando latência. Na prática, Redis responde em sub-milissegundo em rede local, então o impacto é desprezível.

---

## O que faria diferente com mais tempo ou em escala de 1 milhão de acessos

### Com mais tempo

**Testes automatizados:** unitários nas services (lógica de negócio) e e2e nas rotas críticas (criação de ticket, login, SLA). Hoje a cobertura é zero — funciona, mas qualquer refatoração é no escuro.

**Paginação:** a listagem de tickets retorna tudo de uma vez. Com volume real isso é inviável. Implementaria paginação baseada em cursor para listagens eficientes mesmo com milhões de registros.

**Refresh token:** hoje o token expira e o usuário precisa fazer login novamente. Implementaria um refresh token de longa duração para renovar o access token de forma transparente.

**Rate limiting:** proteger as rotas públicas (`/user/login`, `/user/register`) com throttling por IP para evitar força bruta e abuso.

**Permissões granulares:** hoje o controle é binário (autenticado ou não). Adicionaria RBAC com roles definidas (`ADMIN`, `AGENT`, `VIEWER`) e guards específicos por ação.

### Em escala de 1 milhão de acessos

**Escalabilidade horizontal da API:** como a sessão fica no Redis (não em memória local), a API é stateless — posso subir N instâncias atrás de um load balancer sem alteração no código.

**Workers separados da API:** o processamento de filas rodaria em containers independentes, escaláveis separadamente da API HTTP. Picos de criação de tickets não afetariam a latência das demais rotas.

**Read replicas no PostgreSQL:** leituras (listagem de tickets, histórico) iriam para réplicas; escritas para o primário. Reduz carga no banco principal sem mudar a lógica de negócio.

**Cache na listagem:** resultados de `getAllTickets` com os mesmos filtros poderiam ser cacheados no Redis por alguns segundos. A maioria das requisições de leitura é idêntica — cache elimina queries repetidas ao banco.

**Connection pooling:** com múltiplas instâncias da API, cada uma abre seu próprio pool de conexões com o Postgres. PgBouncer na frente centraliza e limita as conexões reais ao banco.

**Observabilidade:** structured logging (JSON), distributed tracing com OpenTelemetry e métricas expostas para Prometheus/Grafana. Sem isso, debugar problemas em produção com volume alto é praticamente impossível.

**CDN para o front-end:** os assets estáticos do React ficam em CDN com cache agressivo. O Nginx local não consegue escalar para servir estáticos com esse volume.

---

## Perguntas Técnicas

### 1. Integração Resiliente

> Como você desenharia uma integração com uma API externa que possui rate limiting e instabilidade ocasional?

Desacoplaria a integração da requisição HTTP usando uma fila (BullMQ, RabbitMQ). O fluxo seria: a API recebe o pedido, persiste o estado como `PENDENTE` e enfileira o job — a resposta ao cliente é imediata, sem depender da API externa.

O worker consome a fila com retry automático e backoff exponencial. Se a API externa retornar 429 (rate limit), o job aguarda e tenta novamente; se retornar 5xx, reexecuta até esgotar as tentativas. Após todas as tentativas, o ticket vai para dead-letter e um alerta é disparado.

Para o rate limiting especificamente, mantenho um contador no Redis com TTL alinhado à janela da API externa — antes de cada chamada, verifico se ainda tenho cota. Se não tiver, o job é recolocado na fila com delay calculado. O sistema continua funcional para o usuário final independente da estabilidade da integração.

Esse é exatamente o padrão que apliquei neste projeto para o processamento de tickets: criação síncrona + ativação assíncrona via BullMQ com 3 tentativas e backoff exponencial de 2s.

---

### 2. Refinamento de Requisito

> Ao receber uma demanda vaga da área de negócio, quais etapas você segue para transformá-la em uma especificação técnica pronta para desenvolvimento?

Primeiro entendo o problema real, não a solução sugerida. Faço perguntas objetivas: quem usa, qual dor resolve, qual o critério de sucesso, o que acontece se não fizermos.

Com isso em mãos, escrevo os casos de uso em linguagem simples — o que o usuário pode fazer, o que o sistema deve fazer em resposta, o que acontece nos casos de erro. Cada caso de uso vira um critério de aceite verificável.

Depois decomponho em tarefas técnicas priorizadas por dependência: modelo de dados primeiro, depois regras de negócio, depois interface. Qualquer ambiguidade que surgir vira uma pergunta de volta para o negócio antes de codar — nunca assuma intenção, sempre valide.

A especificação só está pronta quando consigo responder: "como vou saber que isso está funcionando corretamente?"

---

### 3. Idempotência

> Em uma API de pagamentos ou pedidos, como você evita processamento duplicado em caso de retentativas do cliente?

O cliente gera uma chave de idempotência (UUID v4) e envia no header `Idempotency-Key` de toda requisição de escrita. No servidor, antes de processar, verifico essa chave no Redis com TTL de 24 horas.

Se a chave não existe: processo normalmente, persisto o resultado no Redis junto com a chave e retorno a resposta.  
Se a chave já existe: retorno o resultado que estava armazenado, sem reprocessar nada.

Isso garante que mesmo que o cliente envie a mesma requisição 10 vezes (por timeout, falha de rede ou bug), o efeito colateral acontece apenas uma vez. Para pagamentos, combino isso com uma constraint única no banco na combinação `(pedido_id, status = 'PAGO')` — dupla proteção em camadas diferentes.

---

### 4. Síncrono vs. Assíncrono

> Quais critérios definem se um fluxo deve ser resolvido imediatamente ou processado em fila?

Uso três perguntas para decidir:

**O cliente precisa do resultado agora para continuar?** Login, consulta de saldo, validação de formulário — tudo isso precisa de resposta imediata. Vai síncrono.

**O processamento pode falhar e precisa de retry?** Envio de e-mail, integração com API externa, geração de relatório — qualquer coisa que depende de terceiros ou que seja demorada vai para fila. Erro em worker não afeta o cliente.

**O volume pode criar gargalo na API?** Se 1000 usuários criarem um pedido ao mesmo tempo e cada pedido disparar 5 operações pesadas, o sistema trava. Fila distribui essa carga no tempo.

Neste projeto, a criação de ticket é síncrona (persiste imediato, responde ao cliente), mas a ativação é assíncrona (BullMQ muda status para OPEN em background). O cliente vê o ticket criado instantaneamente; o processamento acontece sem bloqueio.

---

### 5. Segurança

> Quais controles mínimos de segurança você aplica em uma API exposta publicamente?

**Autenticação e sessão:** JWT com secret forte (nunca hardcoded), sessão armazenada no Redis para permitir invalidação imediata no logout — JWT puro não tem revogação, por isso o Redis é essencial.

**Senhas:** bcrypt com fator 10+. Nunca armazeno senha em plaintext ou com hash reversível.

**Entrada de dados:** Validação estrita com whitelist (class-validator + `whitelist: true` no NestJS) — campo não declarado no DTO é descartado antes de chegar na service.

**CORS:** restrito ao domínio real da aplicação, nunca `*` em produção.

**Segredos:** tudo em variáveis de ambiente, nunca commitado. JWT_SECRET, senhas de banco, API keys — todos no `.env` fora do repositório.

**Princípio do menor privilégio:** rotas protegidas com guard de autenticação, usuário não autenticado não acessa nada além do login e registro.

Esses são os controles base. Dependendo do contexto, adiciono rate limiting por IP, auditoria de ações sensíveis e rotação periódica de secrets.

---

### 6. Qualidade e Entrega

> Como você decide o que é essencial para o MVP e o que vira débito técnico?

MVP é o menor conjunto de funcionalidades que permite validar se o produto resolve o problema real do usuário. Tudo que não bloqueia essa validação pode esperar.

Minha régua: **se o sistema não funciona sem isso, é MVP**. Se funciona mas de forma menos elegante ou menos escalável, é débito técnico.

Exemplos práticos neste projeto:
- Criar, listar, atualizar e remover tickets com SLA — **MVP**
- Autenticação e controle de acesso — **MVP** (segurança não é opcional)
- Testes automatizados — **débito técnico** (valida lógica, mas não impede entrega inicial)
- Paginação na listagem — **débito técnico** (funciona sem, mas vai travar com volume)
- Observabilidade (métricas, tracing) — **débito técnico**

O débito técnico não é problema se for consciente e documentado. O problema é acumular débito sem saber que ele existe.

---

### 7. Governança e IA

> Como utilizar IA para acelerar o desenvolvimento sem comprometer segurança dos dados e qualidade do código?

IA é uma ferramenta de aceleração, não de substituição. Uso para boilerplate, pesquisa de padrões, revisão de código e geração de casos de teste — mas o entendimento e a responsabilidade são sempre meus.

Algumas regras que sigo:

**Nunca colocar no contexto da IA:** secrets, dados de produção, PII de clientes, credenciais. O que entra no prompt pode sair de formas inesperadas.

**Todo código gerado passa pela minha revisão:** entendo o que foi gerado antes de commitar. Código que não entendo não vai para produção — IA pode gerar código funcional mas inseguro ou que não escala.

**Validação de tipos e testes são meus:** a IA ajuda a escrever, mas quem define os critérios de correção sou eu. `any` e ausência de `Promise<T>` são exemplos do que ela deixa passar se você não revisar.

**Propriedade do código é da equipe:** uso IA para acelerar, não para terceirizar o raciocínio. O time precisa entender o que está no repositório — código gerado sem compreensão vira débito técnico invisível.

O ganho real está em reduzir o tempo nas partes repetitivas e ter mais energia para as decisões que realmente importam.
