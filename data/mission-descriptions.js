// Shared student-facing summaries; no mission scheduling or evaluation logic.
export const phaseDescriptions=[
["Prepare seu ambiente de desenvolvimento, organize arquivos e aprenda a registrar alterações com Git e GitHub enquanto inicia o EduTech.","Monte sua equipe, organize o repositório do Restaurante e pratique a colaboração com Git e GitHub."],
["Descubra a estrutura do HTML e crie a primeira página do EduTech com tags, elementos e atributos.","Construa com sua equipe a estrutura HTML inicial do site do Restaurante."],
["Aprenda HTML semântico, links e imagens para criar a página Sobre e conectar as páginas do EduTech.","Organize o conteúdo e a navegação do Restaurante com elementos semânticos e links."],
["Crie formulários com campos, rótulos e botões, aplicando validações básicas no EduTech.","Desenvolva e teste os formulários do Restaurante em equipe."],
["Conheça seletores, cores, tipografia e espaçamentos CSS para dar identidade visual ao EduTech.","Defina a identidade visual do Restaurante e padronize a aparência de suas páginas."],
["Aprenda Flexbox, Grid e media queries para adaptar o EduTech a diferentes telas.","Transforme o Restaurante em uma interface responsiva para celular e computador."],
["Dê os primeiros passos com variáveis, condições, funções, arrays e objetos em JavaScript.","Utilize lógica de programação e JavaScript para criar funcionalidades no Restaurante."],
["Aprenda a usar DOM e eventos para atualizar conteúdos e responder às ações do usuário.","Adicione interatividade ao Restaurante utilizando DOM, eventos e JavaScript."],
["Aprenda a validar informações, identificar erros e depurar o EduTech com o console e o DevTools.","Investigue bugs no Restaurante, registre problemas e teste suas correções."],
["Entenda a comunicação entre frontend e backend usando HTTP, JSON e APIs.","Conecte o Restaurante ao backend e teste a troca de dados por requisições."],
["Descubra como conectar o backend ao banco de dados para salvar e recuperar informações.","Implemente a persistência de dados do Restaurante e teste a integração entre as camadas."],
["Conheça autenticação, autorização e permissões para controlar o acesso ao EduTech.","Implemente e teste o acesso de usuários e as permissões no Restaurante."],
["Aprenda a cadastrar, consultar, atualizar e excluir dados com operações CRUD no EduTech.","Implemente as operações CRUD do Restaurante e valide os fluxos da aplicação."],
["Integre as funcionalidades do EduTech, execute os testes finais e prepare sua publicação.","Finalize o Restaurante em equipe, revise os requisitos e apresente a aplicação publicada."]
];
export function missionDescription(m){return phaseDescriptions[m.phase-1]?.[m.type==="training"?0:1]||"Explore os desafios desta etapa da jornada web."}
