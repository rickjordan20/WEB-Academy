// Fundamentos F3: apresentação progressiva e checks formativos.
export const F3_SLIDES=[
  {
    "id": "f3-slide-01",
    "title": "Bem-vindo à evolução da EduTech",
    "explanation": "Você já construiu header, nav, main e footer. Agora vai preencher as páginas Início, Sobre e Cursos com conteúdo HTML. Nesta aula, não precisamos de CSS ou JavaScript.",
    "code": "<main><h1>Bem-vindo à EduTech</h1></main>",
    "question": "O foco desta aula é: ",
    "options": [
      "Criar a estrutura e o conteúdo HTML",
      "Aplicar cores com CSS",
      "Programar formulários com JavaScript"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-02",
    "title": "O que é HTML semântico?",
    "explanation": "Semântica significa escolher elementos que explicam o papel do conteúdo. Como placas que identificam salas na escola, as tags ajudam a entender cada região da página.",
    "code": "<main><h1>Nossos cursos</h1></main>",
    "question": "Qual tag indica o conteúdo principal?",
    "options": [
      "footer",
      "main",
      "div"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-03",
    "title": "div ou tag semântica?",
    "explanation": "A div agrupa elementos, mas não explica sozinha sua função. A tag main indica conteúdo principal; nav indica navegação. Ambas podem receber CSS depois.",
    "code": "<div>...</div>\n<main>...</main>",
    "question": "Por que preferir main para o conteúdo principal?",
    "options": [
      "Porque informa a função da região",
      "Porque aplica cor automaticamente",
      "Porque cria um banco de dados"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-04",
    "title": "header: o cabeçalho",
    "explanation": "O header apresenta informações de abertura, como nome, identidade e título da página. Um header pode conter um nav, mas não é a mesma coisa que um menu.",
    "code": "<header><h1>EduTech</h1></header>",
    "question": "O que caracteriza header?",
    "options": [
      "É o conteúdo principal",
      "É uma região de cabeçalho",
      "É um campo de formulário"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-05",
    "title": "nav: a navegação",
    "explanation": "A tag nav reúne links importantes para navegar. Cada link usa a tag a; o atributo href informa o destino.",
    "code": "<nav><a href=\"cursos.html\">Cursos</a></nav>",
    "question": "Qual elemento identifica a região de navegação?",
    "options": [
      "nav",
      "main",
      "footer"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-06",
    "title": "main: conteúdo principal",
    "explanation": "O main contém o assunto central da página. Na página Cursos, por exemplo, é a lista de cursos, não o menu repetido ou o rodapé.",
    "code": "<main><h1>Cursos disponíveis</h1></main>",
    "question": "O que deve ficar em main na página Cursos?",
    "options": [
      "O rodapé",
      "A lista de cursos",
      "O menu global"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-07",
    "title": "section: dividir por assunto",
    "explanation": "Uma section agrupa conteúdo de um mesmo tema e normalmente possui um título. Na EduTech, podemos criar uma seção para cursos e outra para depoimentos.",
    "code": "<section><h2>Nossos cursos</h2></section>",
    "question": "Quando usar section?",
    "options": [
      "Para separar assuntos relacionados",
      "Para armazenar senhas",
      "Para substituir todos os links"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-08",
    "title": "article: conteúdo independente",
    "explanation": "Um article representa conteúdo que pode fazer sentido isoladamente, como uma notícia, publicação ou apresentação individual de curso. Nem todo cartão precisa ser article.",
    "code": "<article><h3>Curso de HTML</h3><p>Aprenda estrutura web.</p></article>",
    "question": "Qual exemplo pode ser um article?",
    "options": [
      "Um curso apresentado individualmente",
      "Uma cor do site",
      "Um atributo href"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-09",
    "title": "footer e aside",
    "explanation": "Footer reúne informações de encerramento, como créditos e contatos. Aside representa conteúdo complementar, como uma dica relacionada. Nem toda página precisa de aside.",
    "code": "<footer><p>© 2026 EduTech</p></footer>",
    "question": "Qual tag é mais apropriada para créditos finais?",
    "options": [
      "aside",
      "footer",
      "nav"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-10",
    "title": "Títulos: h1, h2 e h3",
    "explanation": "Títulos organizam a hierarquia do assunto: h1 apresenta o tema principal, h2 abre seções e h3 subdivide essas seções. Não escolha o nível apenas pelo tamanho visual.",
    "code": "<h1>EduTech</h1>\n<h2>Cursos</h2>\n<h3>HTML básico</h3>",
    "question": "Qual tag é adequada para o título de uma seção?",
    "options": [
      "h2",
      "img",
      "li"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-11",
    "title": "Parágrafos e listas",
    "explanation": "Use p para textos em parágrafos. ul cria listas sem ordem obrigatória, ol cria sequências numeradas e li representa cada item da lista.",
    "code": "<ul><li>HTML</li><li>CSS</li></ul>",
    "question": "Qual tag cria uma lista numerada?",
    "options": [
      "ul",
      "ol",
      "p"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-12",
    "title": "Combinando texto e estrutura",
    "explanation": "Uma página legível combina regiões semânticas, títulos coerentes, parágrafos e listas. Pense no significado do conteúdo antes da aparência.",
    "code": "<section><h2>Objetivos</h2><p>Aprender web.</p><ul><li>HTML</li></ul></section>",
    "question": "Qual sequência está mais coerente?",
    "options": [
      "h2, p e ul dentro de section",
      "li solto fora de uma lista",
      "h3 antes do título principal sem contexto"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-13",
    "title": "Imagem: img e src",
    "explanation": "A tag img insere uma imagem; src aponta para o arquivo. Se o arquivo não existir ou o caminho estiver incorreto, a imagem não carregará.",
    "code": "<img src=\"../assets/images/curso.jpg\" alt=\"Estudante programando\">",
    "question": "Qual atributo indica o arquivo da imagem?",
    "options": [
      "href",
      "src",
      "class"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-14",
    "title": "Acessibilidade: alt",
    "explanation": "O atributo alt fornece uma alternativa textual para imagens que transmitem informação. Descreva o que importa no contexto; imagens puramente decorativas podem usar alt vazio.",
    "code": "<img src=\"equipe.jpg\" alt=\"Equipe da EduTech reunida\">",
    "question": "Qual alternativa descreve melhor uma foto informativa da equipe?",
    "options": [
      "alt=\"imagem\"",
      "alt=\"Equipe da EduTech reunida\"",
      "sem alt"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-15",
    "title": "Links: a e href",
    "explanation": "A tag a cria links; href indica o destino. Links internos apontam para arquivos ou seções do projeto; externos levam a outros sites.",
    "code": "<a href=\"pages/cursos.html\">Ver cursos</a>",
    "question": "Qual atributo indica o destino do link?",
    "options": [
      "alt",
      "src",
      "href"
    ],
    "correct": 2
  },
  {
    "id": "f3-slide-16",
    "title": "Pastas do projeto",
    "explanation": "Na estrutura prevista, index.html fica na raiz; sobre.html e cursos.html ficam em pages/; imagens ficam em assets/images/. A localização de cada arquivo define seu caminho.",
    "code": "index.html\npages/sobre.html\npages/cursos.html\nassets/images/curso.jpg",
    "question": "Onde fica o arquivo sobre.html?",
    "options": [
      "Na pasta pages",
      "Na pasta assets/images",
      "Na raiz"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-17",
    "title": "Caminhos relativos",
    "explanation": "De index.html, use pages/sobre.html para entrar na pasta. De pages/sobre.html, use ../index.html para voltar à raiz. ../ significa subir um nível.",
    "code": "<a href=\"../index.html\">Início</a>",
    "question": "O que significa ../ ?",
    "options": [
      "Criar pasta",
      "Subir uma pasta",
      "Abrir link externo"
    ],
    "correct": 1
  },
  {
    "id": "f3-slide-18",
    "title": "Comentários HTML",
    "explanation": "Comentários explicam decisões no código e não aparecem como texto na página. Porém, podem ser vistos no código-fonte: nunca coloque senhas ou segredos neles.",
    "code": "<!-- Início da seção de cursos -->",
    "question": "Qual informação não deve ficar em comentários?",
    "options": [
      "Uma explicação da seção",
      "Uma anotação de manutenção",
      "Uma senha de acesso"
    ],
    "correct": 2
  },
  {
    "id": "f3-slide-19",
    "title": "Semântica e acessibilidade",
    "explanation": "Títulos bem organizados, regiões semânticas e alternativas textuais facilitam a compreensão e a navegação, inclusive com tecnologias assistivas. Semântica não substitui todas as práticas de acessibilidade.",
    "code": "<main><h1>Cursos</h1><section><h2>HTML</h2></section></main>",
    "question": "O que a estrutura semântica ajuda a comunicar?",
    "options": [
      "A função e a hierarquia do conteúdo",
      "A senha do usuário",
      "As cores automáticas da página"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-20",
    "title": "Diagnóstico de código",
    "explanation": "Antes de avançar, confira se há um h1 principal, títulos de seções coerentes, links com href correto, imagens com alt adequado e caminhos que apontem para arquivos existentes.",
    "code": "<main><h1>Cursos</h1><section><h2>HTML</h2></section></main>",
    "question": "Qual problema deve ser corrigido primeiro?",
    "options": [
      "Um link que aponta para arquivo inexistente",
      "Uma página ainda sem CSS nesta aula",
      "Um h2 dentro de section"
    ],
    "correct": 0
  },
  {
    "id": "f3-slide-21",
    "title": "Preparação para a prática guiada",
    "explanation": "Você vai transformar os protótipos de Início, Sobre e Cursos em HTML. Preserve header, nav e footer já criados; preencha main com títulos, seções, textos, listas, imagens e links. Não antecipe CSS, JS ou formulários.",
    "code": "<main><h1>EduTech</h1><section><h2>Cursos</h2><p>Conheça nossas formações.</p></section></main>",
    "question": "Qual é o próximo passo correto?",
    "options": [
      "Aplicar animações JS",
      "Preencher o HTML conforme os protótipos",
      "Criar autenticação"
    ],
    "correct": 1
  }
];
