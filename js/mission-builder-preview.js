import {BLOCK_TYPES,normalizeMissionDefinition,validateMissionDefinition,missionProgress,revisionBlocks} from "./mission-builder-core.js";
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
/** Pré-visualização sem gravação. Usada pelo futuro construtor visual. */
export function renderMissionOutline(mission,root){
 const def=normalizeMissionDefinition(mission),errors=validateMissionDefinition(def);
 root.innerHTML='<section class="card"><h2>'+esc(def.title||"Nova missão")+'</h2><p>'+esc(def.subtitle||"")+'</p>'+(errors.length?'<div role="alert"><strong>Verifique a configuração:</strong><ul>'+errors.map(e=>'<li>'+esc(e)+'</li>').join("")+'</ul></div>':"")+'<ol>'+def.blocks.filter(b=>b.visible!==false).map(b=>'<li><strong>'+esc(b.title)+'</strong> <small>('+esc(BLOCK_TYPES[b.kind]?.label||b.kind)+')</small>'+(b.required?'<span> · obrigatório</span>':"")+'</li>').join("")+'</ol></section>';
 return {definition:def,errors};
}
export function inspectMission(mission,records={},grades={}){
 const def=normalizeMissionDefinition(mission);
 return {definition:def,errors:validateMissionDefinition(def),progress:missionProgress(def,records),blocks:revisionBlocks(def,grades)};
}
