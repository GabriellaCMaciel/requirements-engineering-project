# JC Resolve — Plataforma de Serviços de Manutenção Residencial

> Site institucional + loja + sistema de agendamento online para a **JC Resolve**, empresa de serviços de manutenção residencial que atende **Valparaíso de Goiás e região**.

A aplicação reúne, em um único produto, a apresentação dos serviços, uma loja de materiais, um fluxo de checkout com agendamento de visita técnica e um painel administrativo para gestão da agenda, dos pedidos e do catálogo.

---

## ✨ Principais funcionalidades

### Para o cliente
- **Página inicial** com apresentação das áreas de atuação (Elétrica, Hidráulica, Refrigeração, Reparos gerais e Instalações).
- **Assistente inteligente (quiz)** que, a partir da descrição do problema, sugere o serviço e materiais adequados.
- **Loja de materiais** com listagem, página de detalhe do produto e carrinho de compras.
- **Checkout em etapas**: Revisão → Identificação → Pagamento → Endereço → Agendamento → Confirmação.
- **Agendamento de visita técnica** com verificação de conflito de horário em tempo real por profissional.
- **Área do cliente** (`/conta`) com histórico de pedidos e agendamentos.
- **Autenticação** por e-mail e senha, cadastro e recuperação de acesso.

### Para o administrador
- **Painel administrativo** (`/admin`) com visão geral e indicadores.
- **Agenda** em visualizações por dia, semana e lista, com criação e edição de agendamentos.
- **Gestão de pedidos** e **gestão de produtos e serviços**.

### Regras de negócio relevantes
- **Desconto de 10%** aplicado automaticamente quando o pedido combina **produtos + serviço** (recalculado no servidor).
- **Prevenção de conflito de agenda** validada tanto no cliente quanto no servidor (bloqueio por transação).
- Os valores e durações de serviço, bem como alguns produtos, são **demonstrativos** e centralizados em `lib/constants.ts` para fácil manutenção.

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** |
| Linguagem | **TypeScript** |
| Estilização | **Tailwind CSS** + componentes **Radix UI** |
| Banco de dados | **PostgreSQL** via **Prisma ORM** |
| Autenticação | **Auth.js (NextAuth)** |
| Gráficos | **Plotly** |
| Tipografia | DM Sans (texto) e Manrope (títulos) |

---

## 📁 Estrutura do projeto

```
.
├── app/                  # Rotas (App Router): páginas e rotas de API
│   ├── admin/            # Painel administrativo
│   ├── api/              # Rotas de API (auth, pedidos, agenda, etc.)
│   ├── carrinho/         # Carrinho de compras
│   ├── checkout/         # Fluxo de checkout em etapas
│   ├── conta/            # Área do cliente
│   ├── loja/             # Loja e detalhe de produto
│   ├── pedido/[id]/      # Confirmação/detalhe do pedido
│   └── page.tsx          # Página inicial
├── components/           # Componentes reutilizáveis (UI, header, footer, quiz...)
├── lib/                  # Regras de negócio e utilidades
│   ├── constants.ts      # Constantes de negócio (serviços, contatos, etc.)
│   ├── pricing.ts        # Cálculo de preços e desconto
│   ├── scheduling*.ts    # Regras de conflito de agenda
│   └── db.ts             # Instância do Prisma
├── prisma/
│   └── schema.prisma     # Modelagem do banco de dados
├── scripts/              # Scripts de seed do banco
└── public/               # Imagens e assets estáticos
```

---

## 🚀 Como executar localmente

### Pré-requisitos
- **Node.js 18+**
- **Yarn**
- Uma instância de **PostgreSQL** acessível

### Passo a passo

```bash
# 1. Instale as dependências
yarn install

# 2. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env preenchendo DATABASE_URL, NEXTAUTH_SECRET e AUTH_SECRET

# 3. Gere o cliente do Prisma e aplique o schema ao banco
yarn prisma generate
yarn prisma db push

# 4. (Opcional) Popule o banco com dados iniciais
yarn prisma db seed

# 5. Inicie o servidor de desenvolvimento
yarn dev
```

A aplicação ficará disponível em **http://localhost:3000**.

> Para gerar um segredo seguro para `NEXTAUTH_SECRET` / `AUTH_SECRET`, use:
> ```bash
> openssl rand -base64 32
> ```

---

## 🔐 Acesso administrativo (ambiente de demonstração)

O administrador é criado pelo seed a partir de variáveis de ambiente (as credenciais **não** ficam no código):

```bash
# no .env
ADMIN_EMAIL=seu-email@exemplo.com
ADMIN_PASSWORD=uma-senha-forte-com-10-ou-mais-caracteres
```

Depois rode `yarn prisma db seed` e entre em `/admin` com esse e-mail e senha.

> Senhas que já foram publicadas em versões anteriores deste repositório devem ser consideradas comprometidas: ao subir esta mudança, rode o seed com uma senha nova.

---

## 📜 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `yarn dev` | Inicia o ambiente de desenvolvimento |
| `yarn build` | Gera a build de produção |
| `yarn start` | Executa a build de produção |
| `yarn lint` | Executa a verificação de lint |
| `yarn prisma db seed` | Popula o banco com dados iniciais |

---

## ⚠️ Observações

- O arquivo `.env` **não deve ser versionado** — ele contém segredos. Use sempre o `.env.example` como referência.
- Valores de serviços, link de pagamento (PagBank) e parte dos produtos são **demonstrativos**, centralizados em `lib/constants.ts`.
- O carrinho de compras é mantido no navegador (armazenamento local) neste protótipo.

---

## 📄 Licença

Projeto desenvolvido para a JC Resolve. Uso e distribuição conforme definição da proprietária do projeto.
