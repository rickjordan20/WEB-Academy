// Estrutura-base da Jornada Web. O Motor de Missões será implementado na Fase 2.
export const JOURNEY = [
  ["Preparando o Ambiente","IDE, Git e GitHub"],
  ["Construindo a Web","HTML"],
  ["Dando Significado às Páginas","HTML semântico e navegação"],
  ["Coletando Informações","Formulários"],
  ["Criando uma Identidade","CSS"],
  ["Adaptando Interfaces","Layout e responsividade"],
  ["Dando Vida à Aplicação","JavaScript"],
  ["DOMinando a Interatividade","DOM e eventos"],
  ["Caçando Bugs","Validação e depuração"],
  ["Conectando os Mundos","Cliente-servidor, HTTP, JSON e APIs"],
  ["Persistindo Dados","SGBD e persistência"],
  ["Protegendo o Acesso","Autenticação e controle de acesso"],
  ["Dominando o CRUD","CRUD e testes"],
  ["Rumo à Produção","Integração e publicação"]
].map((item,index)=>({ phase:index+1, title:item[0], axis:item[1] }));