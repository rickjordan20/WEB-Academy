import assert from "node:assert/strict";
import {visualDocument, visualTemplate} from "../js/visual-content.js";

const template = visualTemplate();
assert.ok(template.html.includes("Conceito principal"));
assert.ok(template.css.includes("conceito"));
const doc = visualDocument("<h1>Git e GitHub</h1>", "body{color:red}");
assert.ok(doc.includes("<h1>Git e GitHub</h1>"));
assert.ok(doc.includes("script-src 'none'"));
assert.ok(doc.includes("form-action 'none'"));
assert.ok(doc.includes("body{color:red}"));
const injection = visualDocument("<p>Teste</p>", "</style><script>alert(1)</script>");
assert.ok(!injection.includes("</style><script>"));
console.log("Conteúdo visual: testes de isolamento e modelo concluídos.");
