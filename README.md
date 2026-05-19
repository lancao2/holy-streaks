# 🌹 Holy Streaks — Desafio Diário do Terço ✨

Bem-vindo ao **Holy Streaks**, um aplicativo web moderno e premium projetado para incentivar a constância na oração diária do Santo Terço. Através dele, os fiéis podem criar e participar de desafios em grupos, acompanhar o calendário mariano, meditar nos mistérios do dia e ofertar "rosas espirituais" diárias por meio de registros com foto de seus terços.

O design segue uma estética **Chunky/Neo-brutalista acolhedora**, com cantos arredondados, bordas grossas pretas, sombras sólidas marcantes e uma paleta de cores terrosa harmoniosa (Terracota, Creme de Areia e Verde-Esmeralda).

---

## 🚀 Funcionalidades Principais

- **📅 Mistérios de Hoje**: Widget na página inicial indicando os mistérios do dia da semana (Gozosos, Dolorosos, Gloriosos ou Luminosos) com emojis correspondentes.
- **🗂️ Checklist Compactável**: Permite expandir para ver as explicações das 5 dezenas ou recolher para uma visualização enxuta com **5 bolinhas circulares reativas**.
- **🔒 Trava de Segurança**: Assim que o terço do dia é registrado por foto, todos os mistérios são marcados como concluídos (`5/5`) e travados para leitura, impedindo cliques acidentais até o dia seguinte.
- **🏆 Ranking Chunky (Leaderboard)**: Membros do grupo são ordenados de forma justa: quem tem o maior streak de rosas fica na frente e, em caso de empate, quem rezou (enviou a foto) **mais cedo no dia** assume a liderança, ganhando uma coroa de destaque `👑`.
- **📸 Registro do Terço com Foto**: Upload validado via Cloudinary onde o usuário deve enviar uma foto segurando seu terço para validar o log de oração.
- **👤 Perfil customizável**: Permite alterar o nickname de guerreiro e enviar/editar fotos de perfil em tempo real.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Estilização**: Tailwind CSS v4 (Vanilla CSS tokens para layout Neo-brutalista premium)
- **Banco de Dados**: PostgreSQL com [Prisma ORM](https://www.prisma.io/)
- **Armazenamento de Mídia**: [Cloudinary API](https://cloudinary.com/) (para fotos de terços e fotos de perfil)
- **Autenticação**: Integração com login social da Google
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Configuração do Ambiente (`.env`)

Crie um arquivo `.env` na raiz do projeto e preencha as seguintes chaves de configuração:

```env
# Banco de Dados (Pooler para conexões do servidor e Conexão Direta para migrações)
DATABASE_URL="sua-url-do-pooler-postgresql"
DIRECT_URL="sua-url-direta-postgresql"

# Autenticação Google (Google Cloud Console)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Credenciais do Cloudinary (Armazenamento de Imagens)
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"
```

---

## 🏃 Como Rodar o Projeto Localmente

Siga os passos abaixo para preparar e iniciar a aplicação em sua máquina:

### 1. Instalar as Dependências
Abra o terminal na pasta raiz e execute:
```bash
npm install
```

### 2. Configurar o Prisma ORM (Banco de Dados)
Gere os tipos do Prisma Client e envie as tabelas para o seu banco de dados PostgreSQL executando:
```bash
# Gera o código TypeScript do cliente Prisma
npx prisma generate

# Sincroniza a estrutura do schema.prisma diretamente com o banco de dados
npx prisma db push
```

### 3. Rodar o Servidor de Desenvolvimento
Inicie o Next.js localmente:
```bash
npm run dev
```

Abra o seu navegador em [http://localhost:3000](http://localhost:3000) para ver e usar a aplicação.

---

## 📁 Estrutura de Arquivos Relevantes

- `/app/components/GroupsDashboard.tsx`: O painel principal do usuário contendo a listagem de desafios, leaderboard com coroa `👑`, perfil e o **widget compacto de Mistérios de Hoje**.
- `/app/components/DailyRosaryWidget.tsx`: O diário espiritual mariano, contendo o calendário de rosas (`🌹`), histórico de envio e o pop-up de upload com regras.
- `/prisma/schema.prisma`: A modelagem de dados contendo as entidades de `User`, `Group`, `Member` e `RosaryLog`.

---

## 📜 Licença e Propósito

Este projeto foi construído para o aprofundamento da vida espiritual e devoção Mariana no cotidiano. Sinta-se à vontade para expandir, sugerir melhorias e criar novos desafios de dezenas com seus amigos! 🌹📿
