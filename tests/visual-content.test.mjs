import assert from "node:assert/strict";
import {visualDocument,visualTemplate} from "../js/visual-content.js";

const template=visualTemplate();
assert.match(template.html,/Conceito principal/);
assert.match(template.css,/conceito/);
const doc=visualDocument('<h1>Git e GitHub</h1>','body{color:red}');
assert.match(doc,/<h1>Git e GitHub<\\/h1>/);
assert.match(doc,/script-src 'none'/);
assert.match(doc,/form-action 'none'/);
assert.match(doc,/body\\{color:red\\}/);
const injection=visualDocument('<p>Teste</p>','</style><script>alert(1)</script>');
assert.ok(!injection.includes('</style><script>'));
console.log("Conteúdo visual: testes de isolamento e modelo concluídos.");
