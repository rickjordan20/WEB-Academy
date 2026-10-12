export const MISSIONS = [
  {id:"1A",phase:1,type:"training",title:"Ambiente Dev e Versionamento",subtitle:"Preparação do EduTech",project:"edutech",hours:4,steps:[
    {id:"intro",type:"content",title:"Briefing da missão",summary:"Conheça o objetivo da primeira missão da Jornada Web."},
    {id:"ide",type:"content",title:"Preparando o ambiente",summary:"IDE, organização do projeto e ferramentas essenciais."},
    {id:"git",type:"content",title:"Versionamento",summary:"Git, repositório e fluxo básico de versionamento."},
    {id:"guided",type:"guided",title:"Desafio Guiado — EduTech",summary:"Prepare a estrutura inicial do seu projeto individual."},
    {id:"checkpoint",type:"checkpoint",title:"Checkpoint",summary:"Registre o que aprendeu e conclua a missão."}
  ]},
  {id:"1B",phase:1,type:"guild",title:"Ambiente Dev e Versionamento",subtitle:"Preparação do Projeto Restaurante",project:"restaurante",hours:4,steps:[
    {id:"briefing",type:"content",title:"Briefing da Guilda",summary:"Entenda o desafio colaborativo desta fase."},
    {id:"roles",type:"challenge",title:"Organização da Guilda",summary:"Organize responsabilidades e ambiente colaborativo."},
    {id:"repo",type:"challenge",title:"Repositório do Projeto",summary:"Prepare o espaço versionado do Projeto Restaurante."},
    {id:"evidence",type:"evidence",title:"Evidência da Missão",summary:"Registre a participação e o resultado da Guilda."}
  ]}
];

export const getMission = id => MISSIONS.find(m => m.id === id);
export const getPhaseMissions = phase => MISSIONS.filter(m => m.phase === Number(phase));