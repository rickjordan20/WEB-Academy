import {missionWindow} from "./mission-window.js";
import {getSupabase} from "./supabase-client.js";
import "./cloud-bootstrap.js";import {MISSIONS,missionStatus,STATUS} from "./mission-engine.js";import {getState} from "./storage.js";
const state=getState();if(!state?.student?.name)location.replace("index.html");const root=document.querySelector("#missionsCatalog"),labels={locked:"Bloqueada",available:"Disponível","in-progress":"Em andamento",completed:"Concluída"},pad=n=>String(n).padStart(2,"0");
let scheduleByMission=new Map(),accessByMission=new Map();async function loadAccess(){const result=await Promise.all(MISSIONS.map(async m=>{try{return [m.id,await missionWindow(m.id)]}catch{return [m.id,{state:"error",message:"Falha ao verificar publicação"}]}}));accessByMission=new Map(result);render()}
const lessonLabel=row=>{if(!row)return "Aguardando associação ao cronograma";const [y,m,d]=row.lesson_date.split("-");return `📅 ${d}/${m}/${y} · Aula ${String(row.lesson_number).padStart(2,"0")} · ${row.execution_mode}${row.start&&row.end?" · "+row.start+"–"+row.end:""}`};
async function loadMissionSchedule(){try{const sb=await getSupabase();if(!sb)return;const {data:auth}=await sb.auth.getUser();if(!auth?.user)return;const {data:members}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active").limit(1);const classId=members?.[0]?.class_id;if(!classId)return;const {data,error}=await sb.from("class_schedule").select("mission_id,lesson_number,lesson_date,execution_mode,start_time_override,end_time_override").eq("class_id",classId).eq("uc","UC7").not("mission_id","is",null).order("lesson_date");if(error)throw error;const {data:classData}=await sb.from("classes").select("lesson_start_time,lesson_end_time").eq("id",classId).maybeSingle();scheduleByMission=new Map((data||[]).map(row=>[row.mission_id,{...row,start:String(row.start_time_override||classData?.lesson_start_time||"").slice(0,5),end:String(row.end_time_override||classData?.lesson_end_time||"").slice(0,5)}]));render()}catch(error){console.warn("Cronograma das missões indisponível:",error)}}

const phaseDescriptions=[
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
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let catalogFilter="all",catalogQuery="";
function render(){
 const s=getState(),done=s.journey?.completedMissions||[];
 document.querySelector("#missionCount").textContent=`${done.length}/28`;
 const options=[["all","Todas"],["available","Disponíveis"],["upcoming","Aguardando"],["training","EduTech"],["guild","Restaurante"],["completed","Concluídas"]];
 const filtered=MISSIONS.filter(m=>{
  const access=accessByMission.get(m.id),status=missionStatus(m.id);
  const match=catalogFilter==="all"||catalogFilter==="available"&&(access?.state==="open"||access?.state==="closed")||catalogFilter==="upcoming"&&!(access?.state==="open"||access?.state==="closed")||catalogFilter==="training"&&m.type==="training"||catalogFilter==="guild"&&m.type!=="training"||catalogFilter==="completed"&&status==="completed";
  const desc=phaseDescriptions[m.phase-1]?.[m.type==="training"?0:1]||"Explore os desafios desta etapa da jornada web.";
  return match&&(`${m.id} ${m.subtitle} ${m.title||""} ${desc}`.toLocaleLowerCase("pt-BR").includes(catalogQuery));
 });
 root.innerHTML=`<div class="mission-explorer"><div class="mission-explorer-heading"><div><span class="eyebrow">ESCOLHA SEU PRÓXIMO DESAFIO</span><h2>Mapa de missões</h2><p>Aprenda, pratique e avance na sua jornada de desenvolvimento web.</p></div><strong>${filtered.length} de 28</strong></div><div class="mission-explorer-controls"><label class="mission-explorer-search"><span class="sr-only">Buscar missão</span><input id="catalogSearch" type="search" placeholder="Buscar por assunto ou missão..." value="${esc(catalogQuery)}" autocomplete="off"></label><div class="mission-explorer-filters" role="group" aria-label="Filtrar missões">${options.map(([key,label])=>`<button type="button" data-catalog-filter="${key}" aria-pressed="${catalogFilter===key}" class="${catalogFilter===key?"active":""}">${label}</button>`).join("")}</div></div></div><div class="mission-explorer-grid">${filtered.map(m=>{
  const status=missionStatus(m.id),access=accessByMission.get(m.id),editable=access?.state==="open"||access?.state==="closed",locked=!editable;
  const guided=m.type==="training",desc=phaseDescriptions[m.phase-1]?.[guided?0:1]||"Explore os desafios desta etapa da jornada web.";
  const stateLabel=access?.state==="closed"?"Prazo vencido · justificativa necessária":access?.state==="open"?"Missão liberada":access?.state==="upcoming"?"Aguardando publicação":access?.state==="unconfigured"?"Aguardando configuração":access?.message||"Verificando disponibilidade";
  return `<article class="mission-explorer-card ${guided?"guided":"guild"} ${esc(status)} ${locked?"is-locked":""}"><div class="mission-explorer-card-top"><span class="mission-explorer-index">MISSÃO ${pad(m.number)}</span><span class="mission-explorer-type">${guided?"📘 EduTech":"⚔️ Restaurante"}</span></div><div class="mission-explorer-symbol" aria-hidden="true">${["⌘","◈","◇","✦","◉","▦","⚡","◎","⚙","⇄","▤","⛨","✚","★"][m.phase-1]||"✦"}</div><p class="mission-explorer-phase">FASE ${pad(m.phase)} · ${guided?"PRÁTICA GUIADA":"PRÁTICA AUTÔNOMA"}</p><h3>${esc(m.subtitle)}</h3><p class="mission-explorer-description">${esc(desc)}</p><div class="mission-explorer-bottom"><p class="mission-explorer-date">${esc(lessonLabel(scheduleByMission.get(m.id)))}</p><span class="mission-explorer-state">${locked?"🔒 ":""}${esc(stateLabel)}</span>${locked?`<span class="btn btn-secondary" aria-disabled="true">🔒 Aguardando liberação</span>`:`<a class="btn btn-primary" href="mission.html?id=${encodeURIComponent(m.id)}">${access?.state==="closed"?"Realizar com atraso":"Abrir missão"} →</a>`}</div></article>`
 }).join("")||'<p class="mission-explorer-empty">Nenhuma missão encontrada para este filtro.</p>'}</div>`;
 root.querySelector("#catalogSearch")?.addEventListener("input",e=>{const input=e.target,pos=input.selectionStart;catalogQuery=input.value.toLocaleLowerCase("pt-BR");render();const next=root.querySelector("#catalogSearch");next.focus();next.setSelectionRange(pos,pos)});
 root.querySelectorAll("[data-catalog-filter]").forEach(btn=>btn.addEventListener("click",()=>{catalogFilter=btn.dataset.catalogFilter;render()}));
}

Promise.all([loadMissionSchedule(),loadAccess()]);

setInterval(()=>{if(!document.hidden)loadAccess().catch(error=>console.warn("Atualização do cronograma:",error))},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadAccess().catch(error=>console.warn("Atualização do cronograma:",error))});
