# Gerenciador de Tickets

Sistema de gerenciamento de tickets com processamento assíncrono via fila, SLA configurável e autenticação JWT.

## Stack

**Back-end:** NestJS · Prisma · PostgreSQL · BullMQ · Redis · JWT  
**Front-end:** React · Vite · TypeScript · Tailwind CSS  
**Infra:** Docker · docker-compose

## Como rodar

### Pré-requisitos
- Docker e docker-compose instalados

### 1. Configure o `.env` na raiz do projeto

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=gerenciador_tickets

JWT_SECRET=gere_com_openssl_rand_hex_32
JWT_TTL=3600

ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=senha_forte_aqui

CORS_ORIGIN=http://localhost
```

### 2. Suba os containers

```bash
docker compose up --build -d
```

A aplicação estará disponível em:
- **API:** http://localhost:3000
- **Front-end:** http://localhost

### Rotas principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /user/register | Cadastro de usuário |
| POST | /user/login | Login |
| POST | /user/logout | Logout (invalida sessão no Redis) |
| GET | /tickets/getAllTickets | Lista todos os tickets |
| POST | /tickets/createTicket | Cria ticket (processamento via fila) |
| PATCH | /tickets/updateTicket/:id | Atualiza ticket |
| DELETE | /tickets/SoftDeleteById/:id | Remove ticket (soft delete) |
| GET | /sla/configs | Lista configurações de SLA |
| POST | /sla/config | Cria configuração de SLA |
| PATCH | /sla/config/:priority | Atualiza SLA por prioridade |

---

## Perguntas Técnicas

### 1. Integração Resiliente

> Como você desenharia uma integração com uma API externa que possui rate limiting e instabilidade ocasional?

Desacoplaria a integração da requisição HTTP usando uma fila (BullMQ, RabbitMQ). O fluxo seria: a API recebe o pedido, persiste o estado como `PENDENTE` e enfileira o job — a resposta ao cliente é imediata, sem depender da API externa.

O worker consome a fila com retry automático e backoff exponencial. Se a API externa retornar 429 (rate limit), o job aguarda e tenta novamente; se retornar 5xx, reexecuta até esgotar as tentativas. Após todas as tentativas, o ticket vai para dead-letter e uma alerta é disparado.

Para o rate limiting especificamente, mantenho um contador no Redis com TTL alinhado à janela da API externa — antes de cada chamada, verifico se ainda tenho cota. Se não tiver, o job é recolocado na fila com delay calculado. O sistema continua funcional para o usuário final independente da estabilidade da integração.

Esse é exatamente o padrão que apliquei neste projeto para o processamento de tickets: criação síncrona + ativação assíncrona via BullMQ com 3 tentativas e backoff exponencial de 2s.

---

### 2. Refinamento de Requisito

> Ao receber uma demanda vaga da área de negócio, quais etapas você segue para transformá-la em uma especificação técnica pronta para desenvolvimento?

Primeiro entendo o problema real, não a solução sugerida. Faço perguntas objetivas: quem usa, qual dor resolve, qual o critério de sucesso, o que acontece se não fizermos.

Com isso em mãos, escrevo os casos de uso em linguagem simples — o que o usuário pode fazer, o que o sistema deve fazer em resposta, o que acontece nos casos de erro. Cada caso de uso vira um critério de aceite verificável.

Depois decomponho em tarefas técnicas priorizadas por dependência: modelo de dados primeiro, depois regras de negócio, depois interface. Qualquer ambiguidade que surgir vira uma pergunta de volta para o negócio antes de codar — nunca assumas intenção, sempre valide.

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

**Princípio do menor privilégio:** rotas administrativas com guard de role, usuário comum não acessa o que não precisa.

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
