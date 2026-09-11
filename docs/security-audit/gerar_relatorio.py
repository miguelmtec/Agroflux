#!/usr/bin/env python3
"""
Gera o relatório de auditoria de seguranca do AgroFlux em PDF.
Rode com: python3 gerar_relatorio.py
Requer: reportlab, matplotlib (ja disponiveis no ambiente do projeto)
"""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas as pdfcanvas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")

COR_CRITICA = "#B91C1C"
COR_ALTA = "#EA580C"
COR_MEDIA = "#D97706"
COR_BAIXA = "#2563EB"
COR_FORTE = "#059669"
COR_TEXTO = "#1c1917"
COR_MUTED = "#78716c"

SEVERIDADE_COR = {
    "Critica": COR_CRITICA,
    "Alta": COR_ALTA,
    "Media": COR_MEDIA,
    "Baixa": COR_BAIXA,
    "Informativa": COR_MUTED,
}

# ---------------------------------------------------------------------------
# DADOS DA AUDITORIA
# ---------------------------------------------------------------------------

ACHADOS = [
    dict(
        severidade="Critica",
        categoria="2. Permissao no navegador",
        arquivo="api/familia.ts (arquivo inteiro, linhas 35-83)",
        titulo="Endpoint de escrita nao aplica nenhuma regra de papel/permissao",
        descricao=(
            "O unico endpoint que grava dados de uma familia (PUT /api/familia) aceita e persiste "
            "o JSON inteiro enviado pelo cliente sem checar se o usuario autenticado tem permissao "
            "para as mudancas contidas nele. As regras de papel existem apenas no front-end: "
            "AdministracaoView.tsx:58 (isAdmin), BancosView.tsx:57 (canAdjust), "
            "GrupoFamiliarView.tsx:15 (canAdd) e TransacoesView.tsx:58-59 (canDelete/canEdit) "
            "escondem botoes na tela, mas nada equivalente existe no servidor."
        ),
        exploracao=(
            "Qualquer usuario autenticado da familia (mesmo com perfil 'VISUALIZACAO' ou todas as "
            "permissoes desmarcadas) pode chamar PUT /api/familia diretamente (fora da UI) com um "
            "payload alterado: promover a si mesmo a ADMINISTRADOR, aprovar seu proprio cadastro "
            "pendente, apagar lancamentos ou excluir outros usuarios da familia. A unica trava real "
            "e a sessao (cookie valido) e o status geral de acesso da familia (bloqueado/pendente) - "
            "nao ha checagem por campo ou por acao dentro da familia."
        ),
        correcao=(
            "Mover a autorizacao para o servidor: validar no PUT /api/familia quem esta fazendo a "
            "chamada (via usuarios_auth + o registro correspondente dentro de dados.usuarios) e "
            "recusar (403) alteracoes que a permissao daquele usuario nao permitiria - ou, no minimo, "
            "diferenciar endpoints por acao (ex: POST /api/usuarios/aprovar, DELETE /api/despesas/:id) "
            "cada um com sua propria checagem de papel no servidor, em vez de um unico PUT que aceita "
            "o blob inteiro."
        ),
    ),
    dict(
        severidade="Critica",
        categoria="4. Chaves expostas",
        arquivo="api/familia.ts:6, api/auth/me.ts:6, api/auth/login.ts:7, api/auth/signup.ts:7, "
                "api/admin/familias.ts:6, api/admin/backup.ts:6",
        titulo="Segredo padrao do JWT hardcoded no codigo-fonte (fallback publico)",
        descricao=(
            "As 6 funcoes que assinam ou verificam o cookie de sessao usam:\n"
            "const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'troque-esta-chave-antes-de-ir-para-producao');\n"
            "Essa string literal esta commitada no repositorio Git (privado ou nao)."
        ),
        exploracao=(
            "Se a variavel de ambiente JWT_SECRET nao estiver definida em QUALQUER ambiente de "
            "deploy (producao, preview, uma branch nova, um fork, um ambiente de teste local), o "
            "segredo real passa a ser essa string publica. Qualquer pessoa com acesso ao "
            "codigo-fonte consegue forjar um cookie 'session' valido com qualquer uid/familiaId - "
            "inclusive se passando pelo usuario master, ganhando acesso a todos os clientes."
        ),
        correcao=(
            "Remover o fallback. Se JWT_SECRET nao existir, a funcao deve lancar erro e recusar "
            "iniciar (fail-closed), nunca operar com um segredo previsivel. Centralizar a leitura do "
            "segredo em um unico modulo (ver achado de manutenibilidade abaixo) para nao repetir o "
            "mesmo bug em 6 lugares."
        ),
    ),
    dict(
        severidade="Alta",
        categoria="4. Chaves expostas (fail-open)",
        arquivo="api/cron/backup.ts:10",
        titulo="Rota de backup automatico fica sem autenticacao se CRON_SECRET nao estiver configurado",
        descricao=(
            "if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) { ... 401 }\n"
            "Quando CRON_SECRET nao esta definido, a primeira metade do 'if' e falsa e a checagem "
            "inteira e pulada - a rota responde normalmente sem exigir nenhuma autenticacao."
        ),
        exploracao=(
            "Qualquer pessoa na internet pode chamar POST/GET em /api/cron/backup e disparar a "
            "rotina de snapshot de todos os clientes sob demanda (nao vaza dados diretamente, pois "
            "nao retorna os dados, mas permite acionar carga no banco a vontade e cria linhas na "
            "tabela backups sem controle)."
        ),
        correcao=(
            "Inverter a logica para fail-closed: recusar a chamada (401) sempre que CRON_SECRET nao "
            "estiver definido, em vez de permitir. Confirmar tambem que a variavel esta configurada "
            "em producao."
        ),
    ),
    dict(
        severidade="Media",
        categoria="1. Banco sem tranca (isolamento de tenant)",
        arquivo="api/familia.ts:43-76",
        titulo="Escrita usa o familiaId do token (JWT) em vez de re-derivar do banco",
        descricao=(
            "A consulta de status/limite (linhas 43-48) busca os dados atuais da familia via JOIN "
            "por usuarios_auth.id = sessao.uid, mas o UPDATE final (linha 75) usa sessao.familiaId - "
            "o valor cru do token - em vez do familia_id devolvido nessa mesma consulta."
        ),
        exploracao=(
            "Hoje nao ha nenhuma funcionalidade que reatribua um usuario a outra familia, entao nao "
            "e explorada na pratica. Mas e uma inconsistencia de projeto: se essa funcionalidade for "
            "criada no futuro sem revisar este ponto, um usuario movido de familia continuaria "
            "escrevendo na familia antiga enquanto seu token de 30 dias nao expirar."
        ),
        correcao=(
            "Usar sempre o familia_id retornado pela consulta ao banco (fresco) como fonte da "
            "verdade para autorizacao de escrita, nunca o claim do token isoladamente."
        ),
    ),
    dict(
        severidade="Media",
        categoria="Fora das 5 categorias - Autenticacao",
        arquivo="api/auth/login.ts (arquivo inteiro)",
        titulo="Sem limite de tentativas de login (forca bruta de senha)",
        descricao=(
            "O endpoint de login compara a senha via bcrypt normalmente, mas nao ha nenhum "
            "mecanismo de rate limiting, atraso progressivo ou bloqueio temporario por tentativas "
            "erradas repetidas para o mesmo e-mail ou IP."
        ),
        exploracao=(
            "Um atacante pode tentar senhas em sequencia (forca bruta ou lista de senhas vazadas) "
            "contra qualquer e-mail conhecido sem restricao automatica, limitado apenas por "
            "eventuais protecoes de infraestrutura da Vercel (nao garantidas a nivel de aplicacao)."
        ),
        correcao=(
            "Adicionar limite de tentativas por e-mail/IP (ex: usando a propria tabela Postgres ou "
            "um servico de rate limit), com bloqueio temporario progressivo apos poucas tentativas."
        ),
    ),
    dict(
        severidade="Media",
        categoria="Fora das 5 categorias - Gestao de sessao",
        arquivo="api/auth/login.ts:22, api/auth/signup.ts:22, api/auth/logout.ts",
        titulo="Sessao de 30 dias sem mecanismo de revogacao no servidor",
        descricao=(
            "Os tokens JWT sao emitidos com setExpirationTime('30d') e o logout apenas apaga o "
            "cookie no navegador (api/auth/logout.ts) - o token em si continua criptograficamente "
            "valido ate expirar, mesmo depois do logout."
        ),
        exploracao=(
            "Se um token vazar (por exemplo, roubo de cookie via dispositivo comprometido), ele "
            "permanece utilizavel por ate 30 dias mesmo que a vitima faca logout ou troque a senha - "
            "nao existe lista de revogacao nem versao de sessao checada no servidor."
        ),
        correcao=(
            "Reduzir o tempo de vida do token, e/ou guardar uma versao de sessao por usuario no "
            "banco (incrementada no logout ou na troca de senha) que e checada em toda verificacao "
            "do token, invalidando tokens antigos imediatamente quando necessario."
        ),
    ),
    dict(
        severidade="Baixa",
        categoria="Fora das 5 categorias - Validacao de entrada",
        arquivo="api/admin/familias.ts:73-87",
        titulo="Campos do PUT administrativo aceitos sem validacao de tipo/enum",
        descricao=(
            "status, limiteUsuarios e plano vindos de req.body sao gravados via COALESCE sem checar "
            "se status pertence ao conjunto esperado ('pendente'|'ativo'|'bloqueado') ou se "
            "limiteUsuarios e um numero positivo."
        ),
        exploracao=(
            "Como o endpoint ja exige perfil master (exigirMaster confirmado como correto), o risco "
            "e baixo - trata-se de um usuario ja confiavel podendo gravar um valor inconsistente por "
            "engano, nao uma escalada de privilegio."
        ),
        correcao=(
            "Validar status contra a lista de valores permitidos e limiteUsuarios como inteiro "
            "positivo antes do UPDATE, retornando 400 em caso de valor invalido."
        ),
    ),
]

PONTOS_FORTES = [
    ("SQL Injection", "api/**/*.ts (todas as 8 rotas)",
     "100% das consultas usam tagged templates parametrizados do @vercel/postgres "
     "(sql`... ${valor} ...`). Nenhuma concatenacao de string em SQL foi encontrada."),
    ("XSS", "src/**/*.tsx (todo o front-end)",
     "Nenhum uso de dangerouslySetInnerHTML, innerHTML, eval ou new Function em todo o "
     "codigo React. Sem sanitizacao necessaria porque nao ha pontos de insercao de HTML/JS "
     "vindos do usuario."),
    ("Segredos no repositorio", ".gitignore, .env.example",
     "O arquivo .env real esta corretamente listado no .gitignore (.env*); apenas o "
     ".env.example (sem valores reais) e versionado."),
    ("Permissao no navegador (rotas administrativas)", "api/admin/familias.ts, api/admin/backup.ts",
     "exigirMaster() revalida o e-mail do usuario contra a tabela usuarios_auth no banco a "
     "cada chamada, em vez de confiar apenas no que o token ou o front-end afirmam - as duas "
     "rotas master-only estao corretamente protegidas no servidor."),
    ("Senhas", "api/auth/signup.ts, api/auth/login.ts",
     "Senhas sao armazenadas apenas como hash bcrypt (custo 10), nunca em texto puro; a "
     "comparacao usa bcrypt.compare (tempo constante), evitando timing attack trivial."),
    ("Cookies de sessao", "api/auth/login.ts:24, api/auth/signup.ts:24",
     "Cookie 'session' configurado com HttpOnly + Secure + SameSite=Lax, reduzindo risco de "
     "roubo via XSS (mitigado pela ausencia de sinks) e CSRF cross-site."),
    ("Algoritmo JWT", "todas as rotas de auth",
     "Uso da lib jose com HS256 explicito; a biblioteca nao permite algoritmo 'none', "
     "eliminando o vetor classico de bypass de assinatura."),
]

# ---------------------------------------------------------------------------
# GRAFICOS
# ---------------------------------------------------------------------------

def gerar_grafico_rosca(path):
    contagem = {}
    for a in ACHADOS:
        contagem[a["severidade"]] = contagem.get(a["severidade"], 0) + 1
    ordem = ["Critica", "Alta", "Media", "Baixa", "Informativa"]
    labels = [o for o in ordem if o in contagem]
    valores = [contagem[o] for o in labels]
    cores = [SEVERIDADE_COR[o] for o in labels]

    fig, ax = plt.subplots(figsize=(4.2, 4.2), dpi=200)
    wedges, texts, autotexts = ax.pie(
        valores, colors=cores, startangle=90, counterclock=False,
        wedgeprops=dict(width=0.42, edgecolor='white', linewidth=2),
        autopct=lambda p: f'{int(round(p * sum(valores) / 100))}',
        pctdistance=0.79,
    )
    for t in autotexts:
        t.set_color('white')
        t.set_fontsize(13)
        t.set_fontweight('bold')
    ax.legend(wedges, [f"{l} ({contagem[l]})" for l in labels],
              loc='center', bbox_to_anchor=(0.5, 0.5), frameon=False, fontsize=0)
    ax.text(0, 0, str(sum(valores)), ha='center', va='center', fontsize=26, fontweight='bold', color='#1c1917')
    ax.text(0, -0.22, 'achados', ha='center', va='center', fontsize=9, color='#78716c')
    plt.figlegend(wedges, [f"{l}  ({contagem[l]})" for l in labels],
                  loc='lower center', ncol=3, frameon=False, fontsize=8.5, bbox_to_anchor=(0.5, -0.05))
    ax.set_aspect('equal')
    plt.tight_layout()
    plt.savefig(path, transparent=True, bbox_inches='tight')
    plt.close(fig)


def gerar_grafico_barras(path):
    contagem = {}
    for a in ACHADOS:
        cat_curta = a["categoria"].split(".")[0].strip()
        label_map = {
            "1": "1. Isolamento\nde tenant",
            "2": "2. Permissao\nno navegador",
            "3": "3. IDOR",
            "4": "4. Chaves\nexpostas",
            "5": "5. XSS",
        }
        label = label_map.get(cat_curta, "Outros\n(fora das 5)")
        contagem[label] = contagem.get(label, 0) + 1

    ordem = ["1. Isolamento\nde tenant", "2. Permissao\nno navegador", "3. IDOR",
             "4. Chaves\nexpostas", "5. XSS", "Outros\n(fora das 5)"]
    labels = [o for o in ordem if o in contagem]
    valores = [contagem[o] for o in labels]

    fig, ax = plt.subplots(figsize=(6.6, 3.4), dpi=200)
    bars = ax.bar(labels, valores, color="#44403c", width=0.55)
    for b, v in zip(bars, valores):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.05, str(v), ha='center', fontsize=10, fontweight='bold')
    ax.set_ylim(0, max(valores) + 1)
    ax.set_yticks(range(0, max(valores) + 2))
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#d6d3d1')
    ax.tick_params(axis='x', labelsize=8, colors='#44403c')
    ax.tick_params(axis='y', labelsize=8, colors='#78716c')
    plt.tight_layout()
    plt.savefig(path, transparent=True, bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------

def cabecalho_rodape(c: pdfcanvas.Canvas, doc):
    c.saveState()
    c.setFont('Helvetica', 8)
    c.setFillColor(colors.HexColor(COR_MUTED))
    c.drawString(2 * cm, 1.3 * cm, "Relatorio de Auditoria de Seguranca - AgroFlux")
    c.drawRightString(A4[0] - 2 * cm, 1.3 * cm, f"Pagina {doc.page}")
    c.setStrokeColor(colors.HexColor("#e7e5e4"))
    c.line(2 * cm, 1.6 * cm, A4[0] - 2 * cm, 1.6 * cm)
    c.restoreState()


def build_pdf():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Titulo1', fontSize=15, leading=19, spaceAfter=10,
                               textColor=colors.HexColor(COR_TEXTO), fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='Titulo2', fontSize=12, leading=15, spaceBefore=14, spaceAfter=6,
                               textColor=colors.HexColor(COR_TEXTO), fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='CorpoP', fontSize=9.3, leading=13.2,
                               textColor=colors.HexColor(COR_TEXTO), fontName='Helvetica'))
    styles.add(ParagraphStyle(name='CorpoPequeno', fontSize=8, leading=11,
                               textColor=colors.HexColor(COR_MUTED), fontName='Helvetica'))
    styles.add(ParagraphStyle(name='Mono', fontSize=7.6, leading=10.5, fontName='Courier',
                               textColor=colors.HexColor("#292524"), backColor=colors.HexColor("#f5f5f4")))
    styles.add(ParagraphStyle(name='CapaTitulo', fontSize=24, leading=29, alignment=TA_CENTER,
                               textColor=colors.HexColor(COR_TEXTO), fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='CapaSub', fontSize=12, leading=16, alignment=TA_CENTER,
                               textColor=colors.HexColor(COR_MUTED), fontName='Helvetica'))

    doc = SimpleDocTemplate(
        OUT_PDF, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
        title="Relatorio de Auditoria de Seguranca - AgroFlux",
    )
    story = []

    # ---------------- CAPA ----------------
    story.append(Spacer(1, 4 * cm))
    story.append(Paragraph("Relatorio de Auditoria de Seguranca", styles['CapaTitulo']))
    story.append(Paragraph("AgroFlux - Gestao Financeira Agricola (SaaS)", styles['CapaSub']))
    story.append(Spacer(1, 1.2 * cm))
    story.append(HRFlowable(width="40%", thickness=1.2, color=colors.HexColor(COR_CRITICA), hAlign='CENTER'))
    story.append(Spacer(1, 1.2 * cm))

    meta_data = [
        ["Data da auditoria:", "11 de setembro de 2026"],
        ["Escopo:", "Codigo-fonte completo do repositorio (front-end React/Vite + funcoes\n"
                    "serverless da Vercel + esquema Postgres), 8 rotas de API auditadas linha a linha"],
        ["Stack detectada:", "React + TypeScript + Vite (front-end)\n"
                              "Vercel Serverless Functions em Node.js (back-end, sem framework)\n"
                              "@vercel/postgres com tagged templates (sem ORM)\n"
                              "Autenticacao propria: JWT via 'jose' + bcryptjs, cookie httpOnly"],
    ]
    t = Table(meta_data, colWidths=[3.6 * cm, 11 * cm])
    t.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor(COR_TEXTO)),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(
        "<b>Nota metodologica:</b> cada uma das 5 categorias solicitadas foi mapeada para o "
        "equivalente real desta stack antes da analise: (1) isolamento de tenant = coluna "
        "familia_id derivada da sessao (JWT) em cada consulta, ja que o projeto nao usa Supabase/RLS; "
        "(2) permissao no navegador = comparacao entre os gates de papel/perfil no React e a ausencia "
        "ou presenca de checagem equivalente nas funcoes serverless; (3) IDOR = cada handler de rota "
        "que aceita um ID de objeto (familiaId, produtoId etc.) foi verificado individualmente; "
        "(4) chaves expostas = varredura por segredos hardcoded em todo o codigo-fonte, configs e "
        ".env versionado; (5) XSS = varredura por sinks de renderizacao de HTML/JS no front-end React "
        "e por geracao de HTML no back-end.",
        styles['CorpoPequeno']
    ))
    story.append(PageBreak())

    # ---------------- RESUMO EXECUTIVO ----------------
    story.append(Paragraph("Resumo Executivo", styles['Titulo1']))

    total = len(ACHADOS)
    criticos = sum(1 for a in ACHADOS if a["severidade"] == "Critica")
    story.append(Paragraph(
        f"Foram identificados <b>{total} achados</b> ao longo da auditoria, sendo "
        f"<b>{criticos} de severidade critica</b>. As 8 rotas de API do projeto foram lidas "
        f"integralmente, linha por linha (nao por amostragem). O achado mais grave e estrutural: "
        f"o sistema de permissoes por papel (administrador/visualizacao, e as permissoes "
        f"granulares por acao) existe apenas na interface - o servidor aceita qualquer alteracao "
        f"de um usuario autenticado da familia, independente do papel dele.",
        styles['CorpoP']
    ))
    story.append(Spacer(1, 0.4 * cm))

    grafico_rosca = os.path.join(HERE, "_grafico_rosca.png")
    grafico_barras = os.path.join(HERE, "_grafico_barras.png")
    gerar_grafico_rosca(grafico_rosca)
    gerar_grafico_barras(grafico_barras)

    tbl_graficos = Table(
        [[Image(grafico_rosca, width=7.2 * cm, height=7.2 * cm),
          Image(grafico_barras, width=8.2 * cm, height=4.6 * cm)]],
        colWidths=[7.4 * cm, 8.4 * cm]
    )
    tbl_graficos.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    story.append(tbl_graficos)
    story.append(Paragraph("Achados por severidade (esquerda) e por categoria (direita)", styles['CorpoPequeno']))
    story.append(PageBreak())

    # ---------------- PONTOS FORTES / FRACOS ----------------
    story.append(Paragraph("Pontos Fortes", styles['Titulo1']))
    story.append(Paragraph(
        "O que foi verificado no codigo e esta corretamente protegido:", styles['CorpoP']
    ))
    story.append(Spacer(1, 0.2 * cm))
    for titulo, arquivo, texto in PONTOS_FORTES:
        story.append(KeepTogether([
            Paragraph(f'<font color="{COR_FORTE}">&#9679;</font> <b>{titulo}</b> '
                      f'<font color="{COR_MUTED}" size=8>({arquivo})</font>', styles['CorpoP']),
            Paragraph(texto, styles['CorpoPequeno']),
            Spacer(1, 0.22 * cm),
        ]))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Pontos Fracos (risco central)", styles['Titulo1']))
    story.append(Paragraph(
        "Autorizacao por papel/permissao existe apenas no front-end (Critica); segredo de sessao "
        "com valor padrao previsivel se a variavel de ambiente faltar (Critica); rota de backup "
        "automatico sem autenticacao caso a variavel correspondente nao esteja configurada (Alta); "
        "ausencia de protecao contra forca bruta e de revogacao de sessao (Media).",
        styles['CorpoP']
    ))
    story.append(PageBreak())

    # ---------------- TABELA DE ACHADOS ----------------
    story.append(Paragraph("Achados Detalhados", styles['Titulo1']))

    for i, a in enumerate(ACHADOS, 1):
        cor = SEVERIDADE_COR[a["severidade"]]
        chip = Table([[a["severidade"].upper()]], colWidths=[2.6 * cm])
        chip.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(cor)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))

        header_tbl = Table([[chip, Paragraph(f"<b>#{i}. {a['titulo']}</b>", styles['CorpoP'])]],
                            colWidths=[2.8 * cm, 12.2 * cm])
        header_tbl.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))

        bloco = [
            header_tbl,
            Spacer(1, 0.15 * cm),
            Paragraph(f'<font color="{COR_MUTED}" size=8><b>Categoria:</b> {a["categoria"]}</font>', styles['CorpoPequeno']),
            Paragraph(f'<font color="{COR_MUTED}" size=8><b>Local:</b> {a["arquivo"]}</font>', styles['CorpoPequeno']),
            Spacer(1, 0.1 * cm),
            Paragraph(f'<b>O que foi encontrado:</b> {a["descricao"]}'.replace("\n", "<br/>"), styles['CorpoP']),
            Spacer(1, 0.08 * cm),
            Paragraph(f'<b>Por que e explorável / impacto:</b> {a["exploracao"]}'.replace("\n", "<br/>"), styles['CorpoP']),
            Spacer(1, 0.08 * cm),
            Paragraph(f'<b>Correcao sugerida:</b> {a["correcao"]}'.replace("\n", "<br/>"), styles['CorpoP']),
            Spacer(1, 0.35 * cm),
            HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#e7e5e4")),
            Spacer(1, 0.3 * cm),
        ]
        story.append(KeepTogether(bloco[:6]))
        story.extend(bloco[6:])

    story.append(PageBreak())

    # ---------------- RECOMENDACOES PRIORIZADAS ----------------
    story.append(Paragraph("Recomendacoes Priorizadas", styles['Titulo1']))
    prioridades = [
        ("P1 - Fazer antes de qualquer venda comercial", [
            "Remover o valor padrao hardcoded do JWT_SECRET nos 6 arquivos; falhar a inicializacao se a variavel nao existir.",
            "Corrigir api/cron/backup.ts para negar acesso (fail-closed) quando CRON_SECRET nao estiver definido.",
            "Adicionar checagem de papel/permissao no servidor antes de aceitar escritas sensiveis em /api/familia (aprovar usuario, mudar perfil, excluir lancamento).",
        ]),
        ("P2 - Fazer no proximo ciclo", [
            "Adicionar rate limiting no login (por e-mail e por IP).",
            "Implementar revogacao de sessao (versao de sessao no banco) e reduzir a validade do token.",
            "Usar o familia_id retornado pela consulta ao banco, nao o claim do JWT, na escrita de /api/familia.",
        ]),
        ("P3 - Melhoria continua", [
            "Validar tipos/enum dos campos administrativos recebidos em api/admin/familias.ts.",
            "Extrair a logica de secret/verificacao de sessao para um unico modulo compartilhado, para evitar que a mesma falha se repita em varios arquivos no futuro.",
        ]),
    ]
    for titulo, itens in prioridades:
        story.append(Paragraph(titulo, styles['Titulo2']))
        for item in itens:
            story.append(Paragraph(f"&#8226; {item}", styles['CorpoP']))
        story.append(Spacer(1, 0.15 * cm))

    story.append(PageBreak())

    # ---------------- ISSUES PARA O GITHUB ----------------
    story.append(Paragraph("Issues para o GitHub", styles['Titulo1']))
    story.append(Paragraph(
        "Texto pronto para colar em issues do GitHub, uma por bloco delimitado.",
        styles['CorpoPequeno']
    ))
    story.append(Spacer(1, 0.2 * cm))

    issues_md = gerar_issues_markdown()
    for idx, bloco in enumerate(issues_md, 1):
        story.append(Paragraph(f"--- ISSUE {idx} ---", styles['CorpoPequeno']))
        story.append(Paragraph(bloco.replace("\n", "<br/>").replace(" ", "&nbsp;" if False else " "), styles['Mono']))
        story.append(Paragraph(f"--- FIM ISSUE {idx} ---", styles['CorpoPequeno']))
        story.append(Spacer(1, 0.3 * cm))

    doc.build(story, onFirstPage=cabecalho_rodape, onLaterPages=cabecalho_rodape)

    # limpar imagens temporarias
    for p in (grafico_rosca, grafico_barras):
        if os.path.exists(p):
            os.remove(p)


def gerar_issues_markdown():
    issues = []

    issues.append(f"""# [Seguranca] Segredo de JWT com valor padrao hardcoded (6 arquivos)

**Labels:** security, critica

## Problema
As funcoes de autenticacao usam `process.env.JWT_SECRET || 'troque-esta-chave-antes-de-ir-para-producao'`.
Se a variavel de ambiente nao estiver definida em algum ambiente de deploy, esse valor publico vira o segredo real usado para assinar e verificar os cookies de sessao.

## Evidencia
- api/familia.ts:6
- api/auth/me.ts:6
- api/auth/login.ts:7
- api/auth/signup.ts:7
- api/admin/familias.ts:6
- api/admin/backup.ts:6

```ts
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'troque-esta-chave-antes-de-ir-para-producao'
);
```

## Impacto
Qualquer pessoa com acesso ao codigo-fonte pode forjar um token de sessao valido para qualquer usuario, incluindo o master, se o ambiente rodar sem JWT_SECRET configurado.

## Sugestao de correcao
Remover o fallback. Lancar erro na inicializacao se `process.env.JWT_SECRET` nao existir. Centralizar essa logica em um unico modulo importado pelos 6 arquivos.

## Criterios de aceite
- [ ] Nenhum arquivo contem um valor de segredo literal como fallback
- [ ] A aplicacao recusa iniciar/responder se JWT_SECRET nao estiver definido
- [ ] Testado localmente removendo a variavel de ambiente e confirmando a falha controlada
""")

    issues.append(f"""# [Seguranca] Rota de backup automatico sem autenticacao quando CRON_SECRET nao esta definido

**Labels:** security, alta

## Problema
Em `api/cron/backup.ts`, a checagem de autenticacao so roda se `CRON_SECRET` existir:

```ts
if (process.env.CRON_SECRET && auth !== `Bearer ${{process.env.CRON_SECRET}}`) {{
  res.status(401).json({{ error: 'Nao autorizado.' }});
  return;
}}
```

Se a variavel nao estiver configurada, a condicao inteira e falsa e a rota fica publica.

## Evidencia
api/cron/backup.ts:10

## Impacto
Qualquer pessoa na internet pode chamar a rota e disparar a geracao de snapshots de todos os clientes sob demanda.

## Sugestao de correcao
Inverter a logica para fail-closed: recusar sempre que `CRON_SECRET` nao estiver definido.

## Criterios de aceite
- [ ] A rota retorna 401 quando CRON_SECRET nao esta definido
- [ ] A rota so aceita chamadas com o header Authorization correto quando o secret existe
- [ ] CRON_SECRET confirmado como configurado em producao
""")

    issues.append(f"""# [Seguranca] Permissoes de papel nao sao verificadas no servidor (api/familia.ts)

**Labels:** security, critica

## Problema
O front-end esconde botoes com base no papel do usuario (AdministracaoView.tsx:58, BancosView.tsx:57, GrupoFamiliarView.tsx:15, TransacoesView.tsx:58-59), mas o unico endpoint de escrita (`PUT /api/familia`) aceita e grava qualquer JSON enviado por um usuario autenticado da familia, sem checar se a acao contida ali e permitida para o papel/permissoes daquele usuario.

## Evidencia
api/familia.ts, linhas 35-83 (arquivo inteiro)

## Impacto
Um usuario com perfil 'VISUALIZACAO' ou com todas as permissoes desmarcadas pode, chamando a API diretamente (fora da interface), promover a si mesmo a ADMINISTRADOR, aprovar seu proprio acesso, excluir outros usuarios ou apagar/alterar qualquer lancamento financeiro da familia.

## Sugestao de correcao
Adicionar verificacao de papel/permissao no servidor antes de persistir mudancas sensiveis, ou dividir o endpoint unico em rotas especificas por acao, cada uma com sua propria checagem de autorizacao no back-end.

## Criterios de aceite
- [ ] Uma requisicao de um usuario sem permissao de administrador e rejeitada ao tentar alterar papeis/aprovar usuarios
- [ ] Uma requisicao de um usuario sem permissao de exclusao e rejeitada ao tentar remover lancamentos
- [ ] Testes automatizados cobrindo pelo menos os 4 gates de papel identificados no front-end
""")

    issues.append(f"""# [Seguranca] Escrita em /api/familia usa familiaId do token em vez do banco

**Labels:** security, media

## Problema
O UPDATE final usa `sessao.familiaId` (valor do JWT) em vez do `familia_id` retornado pela consulta que ja foi feita ao banco (via JOIN por `usuarios_auth.id = sessao.uid`).

## Evidencia
api/familia.ts:43-48 (consulta) e linha 75 (uso de sessao.familiaId no UPDATE)

## Impacto
Nao explorado hoje (nao existe funcionalidade de mover usuario entre familias), mas e uma inconsistencia de projeto que pode causar escrita na familia errada se essa funcionalidade for adicionada sem revisar este ponto.

## Sugestao de correcao
Extrair o `familia_id` da propria consulta ja feita ao banco e usa-lo no UPDATE, em vez do claim do token.

## Criterios de aceite
- [ ] O UPDATE usa o familia_id vindo da consulta ao banco, nao do payload do JWT
- [ ] Comentario no codigo explicando por que essa fonte e preferida
""")

    issues.append(f"""# [Seguranca] Sem rate limiting no login e sem revogacao de sessao

**Labels:** security, media

## Problema
`api/auth/login.ts` nao limita tentativas de senha por e-mail/IP. Os tokens JWT tem validade de 30 dias (`api/auth/login.ts:22`, `api/auth/signup.ts:22`) e o logout (`api/auth/logout.ts`) apenas apaga o cookie do navegador, sem invalidar o token no servidor.

## Evidencia
- api/auth/login.ts (arquivo inteiro)
- api/auth/login.ts:22, api/auth/signup.ts:22 (setExpirationTime('30d'))
- api/auth/logout.ts (nao invalida o token, so limpa o cookie local)

## Impacto
Forca bruta de senha sem restricao automatica. Um token vazado continua valido por ate 30 dias mesmo apos logout ou troca de senha.

## Sugestao de correcao
Adicionar rate limiting por e-mail/IP no login. Implementar uma versao de sessao por usuario no banco, checada a cada validacao de token, para permitir revogacao imediata.

## Criterios de aceite
- [ ] Login bloqueia temporariamente apos N tentativas erradas seguidas
- [ ] Logout invalida o token no servidor (nao so remove o cookie)
- [ ] Troca de senha invalida sessoes antigas
""")

    return issues


if __name__ == "__main__":
    build_pdf()
    print(f"PDF gerado em: {OUT_PDF}")
