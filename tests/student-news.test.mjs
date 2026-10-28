import test from "node:test";
import assert from "node:assert/strict";
import {NEWS_START,NEWS_END,newsActive,newsDismissKey,popupIsLive,safePopupLink} from "../js/popup-utils.js";
test("campanha inicial foi programada para 72 horas",()=>{
 assert.equal(NEWS_END-NEWS_START,72*60*60*1000);
 assert.equal(newsActive(Date.parse("2026-10-30T23:59:59-03:00")),true);
 assert.equal(newsActive(Date.parse("2026-10-31T00:00:00-03:00")),false);
});
test("novos pop-ups obedecem ao período e ativação configurados",()=>{
 const p={active:true,starts_at:"2026-11-02T10:00:00-03:00",ends_at:"2026-11-05T10:00:00-03:00"};
 assert.equal(popupIsLive(p,Date.parse("2026-11-02T09:59:59-03:00")),false);
 assert.equal(popupIsLive(p,Date.parse("2026-11-03T10:00:00-03:00")),true);
 assert.equal(popupIsLive(p,Date.parse("2026-11-05T10:00:00-03:00")),false);
 assert.equal(popupIsLive({...p,active:false},Date.parse("2026-11-03T10:00:00-03:00")),false);
});
test("não mostrar novamente é individual por aluno e por comunicado",()=>{
 assert.notEqual(newsDismissKey("aluno-a","p1"),newsDismissKey("aluno-b","p1"));
 assert.notEqual(newsDismissKey("aluno-a","p1"),newsDismissKey("aluno-a","p2"));
});
test("links externos e esquemas perigosos não são permitidos",()=>{
 assert.equal(safePopupLink("angel-help.html"),"angel-help.html");
 assert.equal(safePopupLink("extras.html?id=R2"),"extras.html?id=R2");
 for(const x of ["javascript:alert(1)","https://example.com","//evil.com","../admin.html","/admin.html"])assert.equal(safePopupLink(x),null);
});
