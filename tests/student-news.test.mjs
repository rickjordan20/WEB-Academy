import test from "node:test";
import assert from "node:assert/strict";
import {NEWS_START,NEWS_END,NEWS_ITEMS,newsActive,newsDismissKey} from "../js/student-news.js";
test("aviso ativo durante três dias no fuso de Brasília",()=>{
 assert.equal(newsActive(Date.parse("2026-10-27T23:59:59-03:00")),false);
 assert.equal(newsActive(Date.parse("2026-10-28T00:00:00-03:00")),true);
 assert.equal(newsActive(Date.parse("2026-10-30T23:59:59-03:00")),true);
 assert.equal(newsActive(Date.parse("2026-10-31T00:00:00-03:00")),false);
 assert.equal(NEWS_END-NEWS_START,72*60*60*1000);
});
test("cada novidade contém localização e acesso direto",()=>{
 assert.equal(NEWS_ITEMS.length,4);
 for(const item of NEWS_ITEMS){assert.ok(item.title&&item.description&&item.where&&item.url&&item.action)}
});
test("preferência de não mostrar novamente é individual",()=>{
 assert.notEqual(newsDismissKey("aluno-a"),newsDismissKey("aluno-b"));
});
