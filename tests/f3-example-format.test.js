import test from "node:test";
import assert from "node:assert/strict";
import {formatF3Example,f3ExampleNote} from "../js/f3-example-format.js";
import {F3_SLIDES} from "../data/f3-slides.js";
test("todos os 21 slides possuem comentario didatico",()=>{
 assert.equal(F3_SLIDES.length,21);
 for(const slide of F3_SLIDES)assert.ok(f3ExampleNote(slide).length>20,slide.id);
});
test("indenta tags e destaca atributos e valores",()=>{
 const result=formatF3Example('<nav><a href="cursos.html">Cursos</a></nav>');
 assert.match(result,/\\n  /);
 assert.match(result,/f3-syntax-tag/);
 assert.match(result,/f3-syntax-attr/);
 assert.match(result,/f3-syntax-value/);
 assert.match(result,/cursos.html/);
});
test("escapa conteudo de exemplo sem executar HTML",()=>{
 const result=formatF3Example('<main><h1>EduTech</h1></main>');
 assert.ok(!result.includes('<main>'));
 assert.ok(result.includes('&lt;'));
 assert.ok(result.includes('EduTech'));
});
test("preserva comentarios e estrutura de pastas",()=>{
 assert.match(formatF3Example('<!-- comentário -->'),/f3-syntax-comment/);
 assert.match(formatF3Example('index.html\\npages/cursos.html'),/pages\\/cursos.html/);
});
