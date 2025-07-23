# TaskFlow

TaskFlow é uma aplicação de gerenciamento de tarefas e notas, projetada para ajudar usuários a organizar suas atividades diárias, definir metas e acompanhar seu progresso de forma intuitiva e eficiente. Com uma interface limpa e funcionalidades robustas, o TaskFlow visa aumentar a produtividade e a organização pessoal.

## 🚀 Funcionalidades

*   **Gerenciamento de Tarefas:** Crie, edite, marque como concluída e exclua tarefas.
*   **Priorização:** Defina diferentes níveis de prioridade (baixa, média, alta, urgente) para suas tarefas.
*   **Datas e Horários:** Associe datas e horários de vencimento às suas tarefas.
*   **Recorrência:** Configure tarefas recorrentes (diárias, semanais, mensais).
*   **Subtarefas:** Organize tarefas complexas em subtarefas para um controle mais granular.
*   **Notas:** Crie notas coloridas, fixe as mais importantes e adicione datas de lembrete.
*   **Métricas e Insights:** Visualize seu progresso com gráficos de taxa de conclusão e distribuição de tarefas por prioridade.
*   **Sistema de Níveis e XP:** Ganhe pontos de experiência (XP) ao completar tarefas e suba de nível, desbloqueando novas cores de tema.
*   **Personalização de Tema:** Escolha entre diversas cores de tema para personalizar a interface.
*   **Modo Escuro:** Alterne entre o modo claro e escuro para uma experiência de visualização confortável.
*   **Autenticação de Usuário:** Sistema de login e cadastro seguro.
*   **Perfis de Usuário:** Gerencie seu nome, email e foto de perfil.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite (para o ambiente de desenvolvimento)
    *   Tailwind CSS (para estilização)
    *   React Router DOM (para roteamento)
    *   Zustand (para gerenciamento de estado)
    *   Recharts (para gráficos)
    *   React Hot Toast (para notificações)
    *   Lucide React (para ícones)
    *   Date-fns (para manipulação de datas)
*   **Backend & Banco de Dados:**
    *   Supabase (Backend as a Service - BaaS)
        *   Autenticação
        *   Banco de Dados PostgreSQL
        *   Armazenamento (Storage) para anexos e avatares
        *   Funções de Banco de Dados (para cálculo de XP e níveis)

## ⚙️ Configuração e Instalação

Siga os passos abaixo para configurar e rodar o projeto localmente.

### Pré-requisitos

*   Node.js (versão 18 ou superior)
*   npm (gerenciador de pacotes do Node.js)
*   Uma conta Supabase e um projeto configurado.

### 1. Clonar o Repositório

No terminal, navegue até o diretório onde deseja clonar o projeto e execute:

```bash
git clone <URL_DO_SEU_REPOSITORIO>

Em seguida, entre no diretório do projeto:

cd TaskFlow

2. Instalar Dependências

No diretório raiz do projeto, instale as dependências do Node.js:

npm install

3. Configurar Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto com suas credenciais do Supabase. Você pode encontrar essas informações no painel do seu projeto Supabase, em Settings > API.

VITE_SUPABASE_URL=SUA_URL_SUPABASE
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE

4. Configurar o Banco de Dados Supabase

O projeto utiliza um esquema de banco de dados específico. As migrações SQL estão localizadas na pasta supabase/migrations. Você precisará aplicá-las ao seu projeto Supabase.

Tabelas:

    tasks: Para armazenar as tarefas dos usuários.
    notes: Para armazenar as notas dos usuários.
    user_profiles: Para armazenar informações de perfil, níveis, XP e configurações de tema.

Funções e Triggers:

    add_experience: Função para adicionar pontos de experiência aos usuários.
    calculate_level: Função para calcular o nível do usuário com base na experiência.
    update_level: Trigger que atualiza o nível do usuário automaticamente.

Configuração de Storage (Armazenamento):
O projeto utiliza um bucket de armazenamento para avatares e anexos de tarefas. Você precisará criar um bucket chamado attachments e avatars no Supabase Storage e configurar as políticas de RLS (Row Level Security) para permitir uploads, atualizações, exclusões e visualização pública.

Para o bucket avatars (para fotos de perfil):

    Nome: avatars
    Público: Sim (marcado)
    Limite de tamanho: 5MB (sugestão)
    Tipos MIME permitidos: image/jpeg, image/png, image/gif, image/webp

Políticas de RLS para avatars:

    Policy 1: "Users can upload their own avatars"
        Operation: INSERT
        Target roles: authenticated
        Policy definition: bucket_id = 'avatars'
    Policy 2: "Users can update their own avatars"
        Operation: UPDATE
        Target roles: authenticated
        Policy definition: bucket_id = 'avatars'
    Policy 3: "Users can delete their own avatars"
        Operation: DELETE
        Target roles: authenticated
        Policy definition: bucket_id = 'avatars'
    Policy 4: "Public can view avatars"
        Operation: SELECT
        Target roles: public
        Policy definition: bucket_id = 'avatars'

5. Rodar a Aplicação

Após configurar o Supabase e instalar as dependências, inicie o servidor de desenvolvimento:

npm run dev

A aplicação estará disponível em http://localhost:5173 (ou outra porta disponível).
🤝 Contribuição

Sinta-se à vontade para contribuir com o projeto! Se você encontrar bugs, tiver sugestões de melhoria ou quiser adicionar novas funcionalidades, por favor, abra uma issue ou envie um pull request.
