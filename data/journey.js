import {MISSIONS} from "./missions.js";
export const JOURNEY = [
  ["Preparando o Ambiente","IDE, Git e GitHub","🛠️"],
  ["Construindo a Web","HTML","🧱"],
  ["Dando Significado às Páginas","HTML semântico e navegação","🧭"],
  ["Coletando Informações","Formulários","📝"],
  ["Criando uma Identidade","CSS","🎨"],
  ["Adaptando Interfaces","Layout e responsividade","📱"],
  ["Dando Vida à Aplicação","JavaScript","⚡"],
  ["DOMinando a Interatividade","DOM e eventos","🕹️"],
  ["Caçando Bugs","Validação e depuração","🐛"],
  ["Conectando os Mundos","Cliente-servidor, HTTP, JSON e APIs","🔌"],
  ["Persistindo Dados","SGBD e persistência","🗄️"],
  ["Protegendo o Acesso","Autenticação e controle de acesso","🔐"],
  ["Dominando o CRUD","CRUD e testes","♻️"],
  ["Rumo à Produção","Integração e publicação","🚀"]
].map((item,index)=>({
  phase:index+1,
  id:`fase-${String(index+1).padStart(2,"0")}`,
  title:item[0], axis:item[1], icon:item[2],
  missions:MISSIONS.filter(m=>m.phase===index+1).map(m=>m.id)
}));