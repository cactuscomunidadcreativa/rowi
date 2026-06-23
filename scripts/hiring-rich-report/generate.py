# -*- coding: utf-8 -*-
"""
Generador del REPORTE FULL RICO de hiring (14 págs) — referencia permanente.

Reproduce el PDF validado por Eduardo (puntos verdes, óvalo del header, fichas
de afinidad por persona con dimensiones de díada + talentos/competencias en
chips, fichas benchmark con doble-marca población/top, perfil top performer,
hipótesis LVS). Consume un JSON "rico" producido por el motor TS del repo.

Uso:
  python3 scripts/hiring-rich-report/generate.py <rich.json> <out.pdf> <lang>
  lang ∈ {es, pt, en}   (en cae a es para textos sin traducir aún)

El JSON rico se genera con el smoke TS que invoca affinityEngine + calculate
+ parse-sei-csv (ver docs/entregables/HIRING_PROCESO_Y_ROWIVERSE.md). Este
script es solo la MAQUETA — no recalcula nada.
"""
import json, sys, textwrap
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

RICH = sys.argv[1] if len(sys.argv) > 1 else "/tmp/rich.json"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/report.pdf"
LANG = sys.argv[3] if len(sys.argv) > 3 else "es"
D = json.load(open(RICH))

W, H = A4
VIOLET=HexColor("#7c3aed"); VIOLET_DARK=HexColor("#5b21b6"); VIOLET_BG=HexColor("#f3eefe")
INK=HexColor("#1e1b2e"); GRAY=HexColor("#6b7280"); LIGHT=HexColor("#e9e4f5"); WHITE=HexColor("#ffffff")
WARM=HexColor("#f59e0b"); COLD=HexColor("#64748b"); GREEN=HexColor("#10b981"); GREEN_DARK=HexColor("#047857")
TEAL_BG=HexColor("#ecfdf5"); CORAL_BG=HexColor("#fff1ec"); CORAL=HexColor("#e8643c")
BAND_COLOR={"hot":VIOLET,"warm":WARM,"cold":COLD}

# ── i18n ──
T = {
 "es":{"tag":"Sé quien quieres ser","foot":"Rowi · Reporte Full + Hipótesis LVS · Recrutamento BDP — lente de relación, no veredicto","gen":"Generado el","exec":"RESUMEN EJECUTIVO","title":"Reporte Full + Hipótesis LVS",
  "t1":"El equipo alrededor de {l}, en una sola vista","s1":"Cuatro lentes sobre los mismos SEI: afinidad por contexto, lente relacional, benchmark mundial e hipótesis LVS.",
  "cols":["Persona","Afinidad","Percentil EQ","LVS inferido","Lente relacional"],"anchor":"{f} (ancla): EQ {eq} · percentil mundial {p} · LVS inferido {lvs} ({b}) · {brain} · {inf} · {st}.",
  "lectura":"Lectura de Rowi","sec_aff":"SECCIÓN 1 · AFINIDAD","aff_title":"Afinidad por contexto","aff_sub":"Motor Rowi · escala 0-135 · 6 contextos",
  "aff_h":"¿Con quién se entiende mejor {f}? (promedio de 6 contextos)","ctx_t":"Los 6 contextos del motor",
  "ctx":{"leadership":"Liderazgo","execution":"Ejecución","innovation":"Innovación","decision":"Decisión","conversation":"Conversación","relationship":"Relación"},
  "ctxd":{"leadership":"Guiar, inspirar y sostener","execution":"Sacar el trabajo adelante","innovation":"Crear y explorar ideas","decision":"Decidir bajo presión","conversation":"Conversaciones que fluyen","relationship":"Vínculo y confianza"},
  "bands":"Bandas: 108-135 alta sintonía (violeta) · 92-107 media (ámbar) · <92 baja (gris). Punto verde = mayor afinidad del contexto.",
  "fichas":"Fichas de afinidad","detalle":"Detalle por persona","aff_ctx":"Afinidad por contexto","dims":"Dimensiones de la díada",
  "dimk":{"growth":"Crecimiento","collab":"Colaboración","understand":"Entendimiento"},"styles":"Estilos de cerebro",
  "shared":"Talentos fuertes compartidos ({n} de 18)","bright":"Competencias SEI donde ambos brillan (>=100)",
  "sec_bridge":"SECCIÓN 1 · PUENTES","bridge_t":"El lente relacional","bridge_sub":"Quién aporta, quién opera parejo, dónde {f} lleva la delantera",
  "cap_rel":"Capacidad relativa por contexto (pesos reales del motor)","cap_intro":"Diferencia entre la capacidad ponderada de cada persona y la de {f} en cada contexto. ±2 = operan parejo (sync).",
  "persona":"Persona","bridge_leg":"+N = aporta por encima de {f} · sync = parejos · -N = {f} lleva la delantera (zona para acompañar o desarrollar).",
  "bridge_each":"El puente con cada persona","b_eleva":"eleva","b_par":"par estable","b_del":"{f} lleva la delantera suave","b_men":"mentoría",
  "b_l1":"Afinidad {a}/135, percentil EQ {p}. Comparte {n} talentos fuertes con {f}.","b_l2":"LVS inferido {lvs} ({b}). Nivel top en {at}/8 competencias.",
  "sec_bench":"SECCIÓN 2 · BENCHMARK","bench_t":"Benchmark Global","bench_sub":"{n} SEI del mundo (State of the Heart 2018-2024)",
  "bench_h":"¿Cómo se ven estos perfiles frente a los top performers?","bstats":["evaluaciones SEI en el benchmark","top performers (top 10% en éxito global)","umbral de outcome para ser top (p90)","perfiles del sector salud (referencia)"],
  "eqpct_t":"EQ total: percentil mundial (marcas: p25 · p50 · p75 · p90)","supera":"{role} · supera al {p}% del mundo · nivel top en {at}/8 competencias","pctEQ":"percentil EQ",
  "top_t":"El perfil del top performer","top_sub":"Top 10% en éxito global · qué los distingue","top_h":"Qué separa a un top performer del resto del mundo",
  "tcols":["Métrica","Población","Top performers","Brecha"],"distintivo":"Lo más distintivo","dist_sub":"(brecha vs población)",
  "sello":"El sello de los top performers: Metas nobles, Motivación intrínseca y Optimismo (+14 puntos cada una).","sello2":"No destacan por una sola habilidad: suben en las 8 a la vez, con el propósito y la energía propia como motor.",
  "sello3":"Referencia sector salud (n={n}): EQ medio 99.1 — el listón es prácticamente el global.",
  "perfiles_t":"Perfiles vs top performers","supera_tops":"{role} · EQ {eq} · percentil mundial {p} · supera al {pb}% de los tops","comp_lbl":"Competencias vs población (gris) y top performers (verde) · escala 60-135","niveltop":"nivel top: {n}/8 comp.","vstop":"vs top",
  "metod_t":"Metodología del benchmark","metod":["State of the Heart de Six Seconds, 273.173 evaluaciones SEI (2018-2024) — el mismo dataset que Rowi usa en producción.","Top performers según el criterio del motor Rowi: percentil 90 del outcome de éxito global \"Overall 4\" (promedio de","efectividad, relaciones, calidad de vida y bienestar), n=27.318, umbral 110.33. Percentiles contra la distribución completa.","\"Top performer\" = top 10% en éxito autorreportado, no en desempeño laboral medido."],
  "sec_vs":"SECCIÓN 3 · VITAL SIGNS","vs_t":"Hipótesis LVS","vs_sub":"Leadership Vital Signs inferido desde el SEI · NO normado","vs_h":"Cómo se vería cada persona en clave Vital Signs",
  "vs_i1":"El motor Rowi infiere los 15 pulse points desde SEI + Brain Talents y los agrega en 5 drivers. La vista LVS","vs_i2":"(cómo lideras) promedia Motivación + Cambio + Ejecución — misma proyección que usa el Pre-SEI en producción.",
  "drv":{"TRUST":"Confianza","MOTIVATION":"Motivación","CHANGE":"Cambio","TEAMWORK":"Equipo","EXECUTION":"Ejecución"},"vista_lvs":"Vista LVS",
  "vs_scale":"Escala Six Seconds 70-130 (norma 100). Bandas: <90 baja · 90-109 media · 110+ alta. Vistas TVS/OVS en la ficha de cada persona.",
  "cierre_t":"Cómo leer este reporte","honest_t":"Notas de honestidad — léeme antes de decidir",
  "honest":["· El LVS de este reporte es INFERIDO desde el SEI individual (flag inferred / no normado). El LVS real es otro instrumento,","  con evaluadores del entorno. La validación interna de Rowi muestra que el motor SEI→VS tiende a subestimar el nivel:","  trátalo como hipótesis a confirmar, no como medición. · Pesos de afinidad y matriz BBP = hipótesis v0 calibrable.","· Para un proceso de selección, esto NO reemplaza la entrevista ni el criterio técnico. Es un lente de relación y","  desarrollo: cada brecha se cierra con un puente, nunca con un veredicto. La IE no decide a quién contratar."],
  "comp":{"EL":"Alfabetización emocional","RP":"Reconocer patrones","ACT":"Pensamiento consecuente","NE":"Navegar emociones","IM":"Motivación intrínseca","OP":"Optimismo","EMP":"Empatía","NG":"Metas nobles"},
  "purs":{"K":"Conócete (Know)","C":"Elígete (Choose)","G":"Entrégate (Give)","EQ":"EQ total"},"band":{"low":"baja","mid":"media","high":"alta"},
  "principle":"Principio Rowi: esto es un lente sobre cómo trabajar, acompañar y desarrollar — no un criterio de selección.","principle2":"Cada brecha se cierra con un puente, nunca con un veredicto. Los perfiles de IE no deciden a quién contratar.",
  "lec_p":["{top} encabeza la afinidad ({a}/135) y está en el percentil {p} mundial. Comparte {n} talentos fuertes con {f}.","{lo} muestra la mayor brecha ({al}/135, p{lp}): relación de desarrollo. Lee cada ficha con la entrevista."],
 },
 "pt":{"tag":"Seja quem você quer ser","foot":"Rowi · Relatório Completo + Hipótese LVS · Recrutamento BDP — lente de relação, não veredito","gen":"Gerado em","exec":"RESUMO EXECUTIVO","title":"Relatório Completo + Hipótese LVS",
  "t1":"O time ao redor de {l}, em uma única visão","s1":"Quatro lentes sobre os mesmos SEI: afinidade por contexto, lente relacional, benchmark mundial e hipótese LVS.",
  "cols":["Pessoa","Afinidade","Percentil EQ","LVS inferido","Lente relacional"],"anchor":"{f} (âncora): EQ {eq} · percentil mundial {p} · LVS inferido {lvs} ({b}) · {brain} · {inf} · {st}.",
  "lectura":"Leitura do Rowi","sec_aff":"SEÇÃO 1 · AFINIDADE","aff_title":"Afinidade por contexto","aff_sub":"Motor Rowi · escala 0-135 · 6 contextos",
  "aff_h":"Com quem {f} se entende melhor? (média de 6 contextos)","ctx_t":"Os 6 contextos do motor",
  "ctx":{"leadership":"Liderança","execution":"Execução","innovation":"Inovação","decision":"Decisão","conversation":"Conversa","relationship":"Relacionamento"},
  "ctxd":{"leadership":"Guiar, inspirar e sustentar","execution":"Tirar o trabalho do papel","innovation":"Criar e explorar ideias","decision":"Decidir sob pressão","conversation":"Conversas que fluem","relationship":"Vínculo e confiança"},
  "bands":"Bandas: 108-135 alta sintonia (violeta) · 92-107 média (âmbar) · <92 baixa (cinza). Ponto verde = maior afinidade do contexto.",
  "fichas":"Fichas de afinidade","detalle":"Detalhe por pessoa","aff_ctx":"Afinidade por contexto","dims":"Dimensões da díade",
  "dimk":{"growth":"Crescimento","collab":"Colaboração","understand":"Entendimento"},"styles":"Estilos de cérebro",
  "shared":"Talentos fortes compartilhados ({n} de 18)","bright":"Competências SEI onde ambos brilham (>=100)",
  "sec_bridge":"SEÇÃO 1 · PONTES","bridge_t":"A lente relacional","bridge_sub":"Quem agrega, quem opera em par, onde {f} lidera",
  "cap_rel":"Capacidade relativa por contexto (pesos reais do motor)","cap_intro":"Diferença entre a capacidade ponderada de cada pessoa e a de {f} em cada contexto. ±2 = operam em par (sync).",
  "persona":"Pessoa","bridge_leg":"+N = agrega acima de {f} · sync = em par · -N = {f} lidera (zona para acompanhar ou desenvolver).",
  "bridge_each":"A ponte com cada pessoa","b_eleva":"eleva","b_par":"par estável","b_del":"{f} lidera de leve","b_men":"mentoria",
  "b_l1":"Afinidade {a}/135, percentil EQ {p}. Compartilha {n} talentos fortes com {f}.","b_l2":"LVS inferido {lvs} ({b}). Nível top em {at}/8 competências.",
  "sec_bench":"SEÇÃO 2 · BENCHMARK","bench_t":"Benchmark Global","bench_sub":"{n} SEI do mundo (State of the Heart 2018-2024)",
  "bench_h":"Como esses perfis se comparam aos top performers?","bstats":["avaliações SEI no benchmark","top performers (top 10% em sucesso global)","corte de outcome para ser top (p90)","perfis do setor saúde (referência)"],
  "eqpct_t":"EQ total: percentil mundial (marcas: p25 · p50 · p75 · p90)","supera":"{role} · supera {p}% do mundo · nível top em {at}/8 competências","pctEQ":"percentil EQ",
  "top_t":"O perfil do top performer","top_sub":"Top 10% em sucesso global · o que os distingue","top_h":"O que separa um top performer do resto do mundo",
  "tcols":["Métrica","População","Top performers","Lacuna"],"distintivo":"O mais distintivo","dist_sub":"(lacuna vs população)",
  "sello":"A marca dos top performers: Metas nobres, Motivação intrínseca e Otimismo (+14 pontos cada).","sello2":"Não se destacam por uma só habilidade: sobem nas 8 ao mesmo tempo, com o propósito e a energia própria como motor.",
  "sello3":"Referência setor saúde (n={n}): EQ médio 99.1 — a régua é praticamente a global.",
  "perfiles_t":"Perfis vs top performers","supera_tops":"{role} · EQ {eq} · percentil mundial {p} · supera {pb}% dos tops","comp_lbl":"Competências vs população (cinza) e top performers (verde) · escala 60-135","niveltop":"nível top: {n}/8 comp.","vstop":"vs top",
  "metod_t":"Metodologia do benchmark","metod":["State of the Heart da Six Seconds, 273.173 avaliações SEI (2018-2024) — o mesmo dataset que o Rowi usa em produção.","Top performers segundo o critério do motor Rowi: percentil 90 do outcome de sucesso global \"Overall 4\" (média de","efetividade, relacionamentos, qualidade de vida e bem-estar), n=27.318, corte 110.33. Percentis contra a distribuição completa.","\"Top performer\" = top 10% em sucesso autorrelatado, não em desempenho profissional medido."],
  "sec_vs":"SEÇÃO 3 · VITAL SIGNS","vs_t":"Hipótese LVS","vs_sub":"Leadership Vital Signs inferido do SEI · NÃO normatizado","vs_h":"Como cada pessoa se veria em chave Vital Signs",
  "vs_i1":"O motor Rowi infere os 15 pulse points do SEI + Brain Talents e os agrega em 5 drivers. A visão LVS","vs_i2":"(como você lidera) é a média de Motivação + Mudança + Execução — mesma projeção que o Pre-SEI usa em produção.",
  "drv":{"TRUST":"Confiança","MOTIVATION":"Motivação","CHANGE":"Mudança","TEAMWORK":"Equipe","EXECUTION":"Execução"},"vista_lvs":"Visão LVS",
  "vs_scale":"Escala Six Seconds 70-130 (norma 100). Bandas: <90 baixa · 90-109 média · 110+ alta. Visões TVS/OVS na ficha de cada pessoa.",
  "cierre_t":"Como ler este relatório","honest_t":"Notas de honestidade — leia antes de decidir",
  "honest":["· O LVS deste relatório é INFERIDO do SEI individual (flag inferred / não normatizado). O LVS real é outro instrumento,","  com avaliadores do entorno. A validação interna do Rowi mostra que o motor SEI→VS tende a subestimar o nível:","  trate como hipótese a confirmar, não como medição. · Pesos de afinidade e matriz BBP = hipótese v0 calibrável.","· Para um processo de seleção, isto NÃO substitui a entrevista nem o critério técnico. É uma lente de relação e","  desenvolvimento: cada lacuna se fecha com uma ponte, nunca com um veredito. A IE não decide quem contratar."],
  "comp":{"EL":"Alfabetização emocional","RP":"Reconhecer padrões","ACT":"Pensamento consequente","NE":"Navegar emoções","IM":"Motivação intrínseca","OP":"Otimismo","EMP":"Empatia","NG":"Metas nobres"},
  "purs":{"K":"Conheça-se (Know)","C":"Escolha-se (Choose)","G":"Entregue-se (Give)","EQ":"EQ total"},"band":{"low":"baixa","mid":"média","high":"alta"},
  "principle":"Princípio Rowi: isto é uma lente sobre como trabalhar, acompanhar e desenvolver — não um critério de seleção.","principle2":"Cada lacuna se fecha com uma ponte, nunca com um veredito. Perfis de IE não decidem quem contratar.",
  "lec_p":["{top} encabeça a afinidade ({a}/135) e está no percentil {p} mundial. Compartilha {n} talentos fortes com {f}.","{lo} mostra a maior lacuna ({al}/135, p{lp}): relação de desenvolvimento. Leia cada ficha com a entrevista."],
 },
}
t = T.get(LANG, T["es"])

CTX_ORDER=["leadership","execution","innovation","decision","conversation","relationship"]
COMP_ORDER=["EL","RP","ACT","NE","IM","OP","EMP","NG"]
leader=D["leader"]; cand=D["candidates"]; B=D["benchmark"]
LEADER_NAME=leader["name"]; LEADER_FIRST=LEADER_NAME.split(" ")[0]
ROLE={leader["name"]:"Líder"}
for c in cand: ROLE[c["name"]]="Cand."
c=canvas.Canvas(OUT,pagesize=A4); PAGE=[0]
fmt=lambda s,**k: s.format(**k)

def header(title,subtitle,section=""):
    PAGE[0]+=1
    c.setFillColor(VIOLET); c.rect(0,H-92,W,92,stroke=0,fill=1)
    c.setFillColor(VIOLET_DARK); c.circle(W-60,H-30,70,stroke=0,fill=1)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",26); c.drawString(40,H-48,"rowi")
    c.setFont("Helvetica",9); c.drawString(40,H-62,t["tag"])
    if section: c.setFillColor(HexColor("#a78bfa")); c.setFont("Helvetica-Bold",8); c.drawRightString(W-40,H-26,section)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",15); c.drawRightString(W-40,H-44,title)
    c.setFont("Helvetica",9.5); c.drawRightString(W-40,H-60,subtitle)
def footer():
    c.setFillColor(GRAY); c.setFont("Helvetica",8); c.drawString(40,28,t["foot"])
    c.drawRightString(W-40,28,f"{t['gen']} 23-jun-2026 · pág. {PAGE[0]}")
    c.setStrokeColor(LIGHT); c.setLineWidth(1); c.line(40,40,W-40,40)
def band_chip(x,y,band,w=86,h=16,label=None):
    col=BAND_COLOR[band]; c.setFillColor(col); c.roundRect(x,y,w,h,h/2,stroke=0,fill=1)
    lbl=label or ({"hot":{"es":"Alta sintonía","pt":"Alta sintonia"},"warm":{"es":"Sintonía media","pt":"Sintonia média"},"cold":{"es":"Baja sintonía","pt":"Baixa sintonia"}}[band].get(LANG,"—"))
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",8); c.drawCentredString(x+w/2,y+4.5,lbl)
def score_bar(x,y,w,h,value,maxv=135,col=VIOLET,marks=(92,108)):
    c.setFillColor(LIGHT); c.roundRect(x,y,w,h,h/2,stroke=0,fill=1)
    c.setFillColor(col); c.roundRect(x,y,max(h,w*min(value,maxv)/maxv),h,h/2,stroke=0,fill=1)
    c.setStrokeColor(WHITE); c.setLineWidth(1)
    for m in marks: mx=x+w*m/maxv; c.line(mx,y,mx,y+h)
def pct_bar(x,y,w,h,p):
    c.setFillColor(LIGHT); c.roundRect(x,y,w,h,h/2,stroke=0,fill=1)
    col=VIOLET if p>=90 else (GREEN if p>=70 else (WARM if p>=40 else COLD))
    c.setFillColor(col); c.roundRect(x,y,max(h,w*p/100.0),h,h/2,stroke=0,fill=1)
    for m in (25,50,75,90): mx=x+w*m/100.0; c.setStrokeColor(WHITE); c.setLineWidth(1); c.line(mx,y,mx,y+h)
def comp_bar(x,y,w,h,value,pm,tm):
    sc=lambda v:x+w*(max(60,min(135,v))-60)/75.0
    c.setFillColor(LIGHT); c.roundRect(x,y,w,h,h/2,stroke=0,fill=1)
    col=VIOLET if value>=tm else (WARM if value>=pm else COLD)
    c.setFillColor(col); c.roundRect(x,y,max(h,sc(value)-x),h,h/2,stroke=0,fill=1)
    c.setStrokeColor(HexColor("#9ca3af")); c.setLineWidth(1.4); c.line(sc(pm),y-2.5,sc(pm),y+h+2.5)
    c.setStrokeColor(GREEN_DARK); c.setLineWidth(1.6); c.line(sc(tm),y-2.5,sc(tm),y+h+2.5)
def chips(x,y,words,maxw,fill=VIOLET_BG,txt=VIOLET_DARK,fs=8):
    cx,cy=x,y; c.setFont("Helvetica",fs)
    for w in words:
        tw=c.stringWidth(w,"Helvetica",fs)+12
        if cx+tw>x+maxw: cx=x; cy-=15
        c.setFillColor(fill); c.roundRect(cx,cy,tw,13,6.5,stroke=0,fill=1); c.setFillColor(txt); c.drawString(cx+6,cy+3.5,w); cx+=tw+5
    return cy
def lectura(x,yt,w,lines,title):
    h=26+len(lines)*13+10; c.setFillColor(VIOLET); c.roundRect(x,yt-h,w,h,10,stroke=0,fill=1)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",11.5); c.drawString(x+16,yt-20,title); c.setFont("Helvetica",9.5)
    for j,l in enumerate(lines): c.drawString(x+16,yt-36-j*13,l)
    return yt-h

VSB={"low":COLD,"mid":WARM,"high":GREEN_DARK}

# P1
header(t["title"],"Recrutamento BDP · SEI Adult v4 · 23-jun-2026",t["exec"])
y=H-122; c.setFillColor(INK); c.setFont("Helvetica-Bold",17); c.drawString(40,y,fmt(t["t1"],l=LEADER_NAME))
c.setFillColor(GRAY); c.setFont("Helvetica",10); c.drawString(40,y-16,t["s1"])
y-=50; tx=40; cw=[150,85,85,85,110]; rh=38
c.setFillColor(VIOLET); c.roundRect(tx,y-24,sum(cw),24,6,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",8.5)
xa=tx
for i,hd in enumerate(t["cols"]): c.drawString(xa+8,y-16,hd); xa+=cw[i]
for r,cd in enumerate(cand):
    yy=y-24-(r+1)*rh
    c.setFillColor(WHITE if r%2==0 else HexColor("#faf8ff")); c.rect(tx,yy,sum(cw),rh,stroke=0,fill=1)
    vals=[cd["name"],f"{cd['avg135']}/135",f"p{cd['pct']:.0f}",f"{cd['lvs']['score']} ({t['band'][cd['lvs']['band']]})","—"]
    xa=tx
    for i,v in enumerate(vals):
        if i==0:
            c.setFillColor(INK); c.setFont("Helvetica-Bold",8.5); c.drawString(xa+8,yy+rh/2+2,cd["name"])
            c.setFillColor(GRAY); c.setFont("Helvetica",7); c.drawString(xa+8,yy+rh/2-9,f"EQ {cd['eq']}")
        else: c.setFillColor(VIOLET_DARK); c.setFont("Helvetica",9); c.drawString(xa+8,yy+rh/2-3,v)
        xa+=cw[i]
y2=y-24-len(cand)*rh-18; c.setFillColor(GRAY); c.setFont("Helvetica",8.5)
c.drawString(40,y2,fmt(t["anchor"],f=LEADER_FIRST,eq=leader["eq"],p=f"{leader['pct']:.0f}",lvs=leader["lvs"]["score"],b=t["band"][leader["lvs"]["band"]],brain=leader["brain"],inf=leader["leadProfile"],st=leader["style"]))
y2-=24; top=cand[0]; lo=cand[-1]
y2=lectura(40,y2,W-80,[fmt(t["lec_p"][0],top=top["name"].split(" ")[0],a=top["avg135"],p=f"{top['pct']:.0f}",n=len(top["shared"]),f=LEADER_FIRST),fmt(t["lec_p"][1],lo=lo["name"].split(" ")[0],al=lo["avg135"],lp=f"{lo['pct']:.0f}")],t["lectura"])
y2-=18; c.setFillColor(CORAL_BG); c.roundRect(40,y2-50,W-80,50,10,stroke=0,fill=1)
c.setFillColor(HexColor("#9a3412")); c.setFont("Helvetica-Bold",9.5); c.drawString(56,y2-18,t["principle"])
c.setFont("Helvetica",9); c.drawString(56,y2-33,t["principle2"]); footer(); c.showPage()

# P2 afinidad + matriz puntos verdes
header(t["aff_title"],t["aff_sub"],t["sec_aff"])
y=H-118; c.setFillColor(INK); c.setFont("Helvetica-Bold",14); c.drawString(40,y,fmt(t["aff_h"],f=LEADER_FIRST))
ry=y-16
for i,cd in enumerate(cand):
    yy=ry-i*44; c.setFillColor(WHITE); c.setStrokeColor(LIGHT); c.setLineWidth(1.2); c.roundRect(40,yy-38,W-80,40,8,stroke=1,fill=1)
    col=VIOLET if i==0 else (VIOLET_DARK if i==1 else GRAY); c.setFillColor(col); c.circle(60,yy-18,10,stroke=0,fill=1)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",10); c.drawCentredString(60,yy-21.5,str(i+1))
    c.setFillColor(INK); c.setFont("Helvetica-Bold",10.5); c.drawString(80,yy-14,cd["name"])
    c.setFillColor(GRAY); c.setFont("Helvetica",7.5); c.drawString(80,yy-25,f"EQ {cd['eq']} · {cd['brain']} · {cd['style']} · {cd['leadProfile']}")
    score_bar(80,yy-34,300,7,cd["avg135"]); c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",14); c.drawRightString(W-144,yy-25,str(cd["avg135"]))
    c.setFillColor(GRAY); c.setFont("Helvetica",7); c.drawRightString(W-144,yy-34,"/ 135"); band_chip(W-132,yy-28,"warm" if cd["avg135"]<108 else "hot")
my=ry-len(cand)*44-22; c.setFillColor(INK); c.setFont("Helvetica-Bold",14); c.drawString(40,my,t["ctx_t"])
tx,ty=40,my-14; nC=len(cand); fc=120; rest=(W-80-fc)/nC; cw=[fc]+[rest]*nC; rh=44; ns=[cd["name"].split(" ")[0] for cd in cand]
c.setFillColor(VIOLET); c.roundRect(tx,ty-22,sum(cw),22,6,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",8.5); c.drawString(tx+10,ty-15,t["ctx"]["leadership"][:0] or "")
c.setFont("Helvetica-Bold",8.5); c.setFillColor(WHITE); c.drawString(tx+10,ty-15,"" )
c.drawString(tx+10,ty-15, t["persona"] if False else "")
c.drawString(tx+10,ty-15, "")
# header contexto
c.setFillColor(WHITE); c.setFont("Helvetica-Bold",8.5); c.drawString(tx+10,ty-15,({"es":"Contexto","pt":"Contexto"}).get(LANG,"Contexto"))
for i in range(nC):
    cxp=tx+cw[0]+sum(cw[1:i+1]); c.drawCentredString(cxp+cw[i+1]/2,ty-15,ns[i])
for r,ctx in enumerate(CTX_ORDER):
    yy=ty-22-(r+1)*rh; c.setFillColor(WHITE if r%2==0 else HexColor("#faf8ff")); c.rect(tx,yy,sum(cw),rh,stroke=0,fill=1)
    c.setFillColor(INK); c.setFont("Helvetica-Bold",9); c.drawString(tx+10,yy+rh-16,t["ctx"][ctx])
    c.setFillColor(GRAY); c.setFont("Helvetica",6.5); c.drawString(tx+10,yy+rh-26,t["ctxd"][ctx][:34])
    best=max(cd["ctxs"][ctx]["heat135"] for cd in cand)
    for i,cd in enumerate(cand):
        v=cd["ctxs"][ctx]; cxp=tx+cw[0]+sum(cw[1:i+1]); cwi=cw[i+1]
        c.setFillColor(BAND_COLOR[v["band"]]); c.setFont("Helvetica-Bold",12); c.drawCentredString(cxp+cwi/2,yy+rh-22,str(v["heat135"]))
        score_bar(cxp+10,yy+8,cwi-20,4,v["heat135"],col=BAND_COLOR[v["band"]])
        if v["heat135"]==best: c.setFillColor(GREEN); c.circle(cxp+cwi/2+16,yy+rh-18,3.5,stroke=0,fill=1)
ly=ty-22-6*rh-12; c.setFillColor(GRAY); c.setFont("Helvetica",8); c.drawString(40,ly,t["bands"]); footer(); c.showPage()

# P3+ fichas afinidad (2 por página)
def ficha_aff(cd,rank,top_y):
    ch=322; x0,y0=40,top_y; cardw=W-80
    c.setFillColor(WHITE); c.setStrokeColor(LIGHT); c.setLineWidth(1.2); c.roundRect(x0,y0-ch,cardw,ch,12,stroke=1,fill=1)
    c.setFillColor(VIOLET_BG); c.roundRect(x0,y0-54,cardw,54,12,stroke=0,fill=1); c.rect(x0,y0-54,cardw,20,stroke=0,fill=1)
    c.setFillColor(VIOLET); c.circle(x0+28,y0-27,14,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",11); c.drawCentredString(x0+28,y0-31,str(rank))
    c.setFillColor(INK); c.setFont("Helvetica-Bold",12.5); c.drawString(x0+50,y0-22,cd["name"])
    c.setFillColor(GRAY); c.setFont("Helvetica",8.5); c.drawString(x0+50,y0-36,f"EQ {cd['eq']} · {cd['brain']} · {cd['style']} · {cd['leadProfile']}")
    c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",20); c.drawRightString(x0+cardw-110,y0-34,str(cd["avg135"]))
    c.setFillColor(GRAY); c.setFont("Helvetica",7.5); c.drawRightString(x0+cardw-110,y0-46,"/ 135"); band_chip(x0+cardw-98,y0-40,"warm" if cd["avg135"]<108 else "hot",w=86,h=15)
    bx,by=x0+20,y0-76; c.setFillColor(INK); c.setFont("Helvetica-Bold",9.5); c.drawString(bx,by,t["aff_ctx"])
    for i,ctx in enumerate(CTX_ORDER):
        v=cd["ctxs"][ctx]; yy=by-18-i*19; c.setFillColor(GRAY); c.setFont("Helvetica",8.5); c.drawString(bx,yy+1,t["ctx"][ctx])
        score_bar(bx+78,yy,120,8,v["heat135"],col=BAND_COLOR[v["band"]]); c.setFillColor(INK); c.setFont("Helvetica-Bold",8.5); c.drawString(bx+204,yy+1,str(v["heat135"]))
    dx=x0+280; c.setFillColor(INK); c.setFont("Helvetica-Bold",9.5); c.drawString(dx,by,t["dims"])
    for i,(k,lbl) in enumerate(t["dimk"].items()):
        yy=by-18-i*19; c.setFillColor(GRAY); c.setFont("Helvetica",8.5); c.drawString(dx,yy+1,lbl)
        score_bar(dx+78,yy,100,8,cd["dims"][k]); c.setFillColor(INK); c.setFont("Helvetica-Bold",8.5); c.drawString(dx+184,yy+1,str(cd["dims"][k]))
    c.setFillColor(GRAY); c.setFont("Helvetica",8.5); c.drawString(dx,by-18-3*19+1,t["styles"])
    c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",8.5); c.drawString(dx+78,by-18-3*19+1,f"{leader['brain']} × {cd['brain']} = {cd['bbp']:.0f}/100")
    ty2=by-138; c.setFillColor(INK); c.setFont("Helvetica-Bold",9.5); c.drawString(bx,ty2,fmt(t["shared"],n=len(cd["shared"])))
    last=chips(bx,ty2-17,cd["shared"] or ["—"],W-160); cy2=last-22
    c.setFillColor(INK); c.setFont("Helvetica-Bold",9.5); c.drawString(bx,cy2,t["bright"]); chips(bx,cy2-17,cd["bright"] or ["—"],W-160,fill=TEAL_BG,txt=GREEN_DARK)
for pi in range(0,len(cand),2):
    n=pi//2+1; tot=(len(cand)+1)//2; header(f"{t['fichas']} ({n}/{tot})",t["detalle"],t["sec_aff"])
    ficha_aff(cand[pi],pi+1,H-112)
    if pi+1<len(cand): ficha_aff(cand[pi+1],pi+2,H-112-340)
    footer(); c.showPage()

# P puentes (deltas via comp del JSON)
CTX_W={"leadership":0.35,"execution":0.25,"innovation":0.40,"decision":0.30,"conversation":0.20,"relationship":0.25}
leaderRaw=D["leaderRaw"]; candRaw={x["name"]:x for x in D["candidatesRaw"]}
def wcap(comps,W):
    v=[comps.get(k) for k in COMP_ORDER if comps.get(k) is not None]; a=sum(v)/len(v) if v else 100; return a*(0.8+0.4*W)
def deltas(name): return {ctx:round(wcap(candRaw[name]["comp"],CTX_W[ctx])-wcap(leaderRaw["comp"],CTX_W[ctx]),1) for ctx in CTX_ORDER}
header(t["bridge_t"],fmt(t["bridge_sub"],f=LEADER_FIRST),t["sec_bridge"])
y=H-120; c.setFillColor(INK); c.setFont("Helvetica-Bold",14); c.drawString(40,y,t["cap_rel"])
c.setFillColor(GRAY); c.setFont("Helvetica",9); c.drawString(40,y-14,fmt(t["cap_intro"],f=LEADER_FIRST))
tx,ty=40,y-38; cw=[120]+[(W-80-120)/6]*6; rh=28
c.setFillColor(VIOLET); c.roundRect(tx,ty-22,sum(cw),22,6,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",8); c.drawString(tx+8,ty-15,t["persona"])
for i,ctx in enumerate(CTX_ORDER):
    cxp=tx+cw[0]+sum(cw[1:i+1]); c.drawCentredString(cxp+cw[i+1]/2,ty-15,t["ctx"][ctx])
for r,cd in enumerate(cand):
    name=cd["name"]; yy=ty-22-(r+1)*rh; dd=deltas(name)
    c.setFillColor(WHITE if r%2==0 else HexColor("#faf8ff")); c.rect(tx,yy,sum(cw),rh,stroke=0,fill=1)
    c.setFillColor(INK); c.setFont("Helvetica-Bold",8.5); c.drawString(tx+8,yy+11,name.split(" ")[0])
    for i,ctx in enumerate(CTX_ORDER):
        d=dd[ctx]; cxp=tx+cw[0]+sum(cw[1:i+1]); cwi=cw[i+1]
        if abs(d)<2: bg,fg,tt=VIOLET_BG,VIOLET_DARK,"sync"
        elif d>0: bg,fg,tt=TEAL_BG,GREEN_DARK,f"+{d:.0f}"
        else: bg,fg,tt=CORAL_BG,CORAL,f"{d:.0f}"
        c.setFillColor(bg); c.roundRect(cxp+8,yy+6,cwi-16,18,5,stroke=0,fill=1); c.setFillColor(fg); c.setFont("Helvetica-Bold",8.5); c.drawCentredString(cxp+cwi/2,yy+11.5,tt)
yl=ty-22-len(cand)*rh-12; c.setFillColor(GRAY); c.setFont("Helvetica",8); c.drawString(40,yl,fmt(t["bridge_leg"],f=LEADER_FIRST))
py=yl-22; c.setFillColor(INK); c.setFont("Helvetica-Bold",14); c.drawString(40,py,t["bridge_each"]); by=py-14
for cd in cand:
    dd=deltas(cd["name"]); dm=sum(dd.values())/6
    if dm>=2: col,bg,vd=GREEN_DARK,TEAL_BG,t["b_eleva"]
    elif dm>-2: col,bg,vd=VIOLET_DARK,VIOLET_BG,t["b_par"]
    elif dm>-10: col,bg,vd=CORAL,CORAL_BG,fmt(t["b_del"],f=LEADER_FIRST)
    else: col,bg,vd=COLD,HexColor("#f1f5f9"),t["b_men"]
    lines=[fmt(t["b_l1"],a=cd["avg135"],p=f"{cd['pct']:.0f}",n=len(cd["shared"]),f=LEADER_FIRST),fmt(t["b_l2"],lvs=cd["lvs"]["score"],b=t["band"][cd["lvs"]["band"]],at=cd["atTop"])]
    h=22+len(lines)*12+8; c.setFillColor(bg); c.roundRect(40,by-h,W-80,h,8,stroke=0,fill=1); c.setFillColor(col); c.rect(40,by-h,4,h,stroke=0,fill=1)
    c.setFont("Helvetica-Bold",9.5); c.setFillColor(col); c.drawString(56,by-16,f"{cd['name'].split(' ')[0]} · {vd}")
    c.setFillColor(INK); c.setFont("Helvetica",8.5)
    for j,l in enumerate(lines): c.drawString(56,by-29-j*12,l)
    by-=h+8
footer(); c.showPage()

# P benchmark intro
header(t["bench_t"],fmt(t["bench_sub"],n=f"{B['n_benchmark']:,}".replace(",",".")),t["sec_bench"])
y=H-120; c.setFillColor(INK); c.setFont("Helvetica-Bold",15); c.drawString(40,y,t["bench_h"])
y-=28; c.setFillColor(VIOLET_BG); c.roundRect(40,y-70,W-80,70,10,stroke=0,fill=1)
stats=[(f"{B['n_benchmark']:,}".replace(",","."),t["bstats"][0]),(f"{B['n_top']:,}".replace(",","."),t["bstats"][1]),(f"{B['threshold_p90_overall4']}",t["bstats"][2]),(f"{B['n_healthcare']:,}".replace(",","."),t["bstats"][3])]
cwx=(W-80)/4
for i,(num,lbl) in enumerate(stats):
    cx=40+i*cwx; c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",16); c.drawCentredString(cx+cwx/2,y-30,num)
    c.setFillColor(GRAY); c.setFont("Helvetica",7.5)
    for j,seg in enumerate(textwrap.wrap(lbl,width=26)): c.drawCentredString(cx+cwx/2,y-44-j*9,seg)
y-=100; c.setFillColor(INK); c.setFont("Helvetica-Bold",13); c.drawString(40,y,t["eqpct_t"]); ry=y-16
allp=[{"name":leader["name"],"pct":leader["pct"],"atTop":leader["atTop"],"role":"Líder"}]+[{"name":x["name"],"pct":x["pct"],"atTop":x["atTop"],"role":"Cand."} for x in cand]
allp.sort(key=lambda x:-x["pct"])
for p in allp:
    c.setFillColor(WHITE); c.setStrokeColor(LIGHT); c.setLineWidth(1.2); c.roundRect(40,ry-44,W-80,46,9,stroke=1,fill=1)
    c.setFillColor(INK); c.setFont("Helvetica-Bold",10.5); c.drawString(56,ry-15,p["name"])
    c.setFillColor(GRAY); c.setFont("Helvetica",8); c.drawString(56,ry-26,fmt(t["supera"],role=p["role"],p=f"{p['pct']:.0f}",at=p["atTop"]))
    pct_bar(56,ry-39,330,9,p["pct"]); c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",15); c.drawRightString(W-64,ry-26,f"p{p['pct']:.0f}")
    c.setFillColor(GRAY); c.setFont("Helvetica",7.5); c.drawRightString(W-64,ry-38,t["pctEQ"]); ry-=54
footer(); c.showPage()

# P top performer
header(t["top_t"],t["top_sub"],t["sec_bench"]); pop=B["population"]; topp=B["top_performers"]
y=H-122; c.setFillColor(INK); c.setFont("Helvetica-Bold",15); c.drawString(40,y,t["top_h"])
rows=[("EQ","EQ total")]+[(k,t["purs"][k]) for k in ["K","C","G"]]+[(k,t["comp"][k]) for k in COMP_ORDER]
tx,ty=40,y-30; cw=[170,95,95,80]; rh=26
c.setFillColor(VIOLET); c.roundRect(tx,ty-24,sum(cw),24,6,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",9)
c.drawString(tx+10,ty-16,t["tcols"][0]); c.drawCentredString(tx+cw[0]+cw[1]/2,ty-16,t["tcols"][1]); c.drawCentredString(tx+cw[0]+cw[1]+cw[2]/2,ty-16,t["tcols"][2]); c.drawCentredString(tx+sum(cw[:3])+cw[3]/2,ty-16,t["tcols"][3])
for r,(key,lbl) in enumerate(rows):
    yy=ty-24-(r+1)*rh; c.setFillColor(WHITE if r%2==0 else HexColor("#faf8ff")); c.rect(tx,yy,sum(cw),rh,stroke=0,fill=1)
    pm,tm=pop[key],topp[key]; c.setFillColor(INK); c.setFont("Helvetica-Bold" if key=="EQ" else "Helvetica",9); c.drawString(tx+10,yy+9,lbl)
    c.setFillColor(GRAY); c.setFont("Helvetica",9.5); c.drawCentredString(tx+cw[0]+cw[1]/2,yy+9,f"{pm:.1f}")
    c.setFillColor(GREEN_DARK); c.setFont("Helvetica-Bold",9.5); c.drawCentredString(tx+cw[0]+cw[1]+cw[2]/2,yy+9,f"{tm:.1f}")
    c.setFillColor(VIOLET_DARK); c.drawCentredString(tx+sum(cw[:3])+cw[3]/2,yy+9,f"+{tm-pm:.1f}")
dx=tx+sum(cw)+18; c.setFillColor(INK); c.setFont("Helvetica-Bold",10); c.drawString(dx,ty-16,t["distintivo"])
c.setFillColor(GRAY); c.setFont("Helvetica",7.5); c.drawString(dx,ty-27,t["dist_sub"])
dist=list(B["distinctive"].items()); maxd=dist[0][1]
for i,(k,v) in enumerate(dist):
    yy=ty-48-i*30; c.setFillColor(INK); c.setFont("Helvetica-Bold",7); c.drawString(dx,yy+10,t["comp"][k])
    c.setFillColor(LIGHT); c.roundRect(dx,yy,56,7,3.5,stroke=0,fill=1); c.setFillColor(VIOLET if i<3 else HexColor("#a78bfa")); c.roundRect(dx,yy,max(7,56*v/maxd),7,3.5,stroke=0,fill=1)
    c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",7.5); c.drawString(dx+60,yy+0.5,f"+{v:.1f}")
by=ty-24-len(rows)*rh-20; c.setFillColor(VIOLET_BG); c.roundRect(40,by-56,W-80,56,10,stroke=0,fill=1)
c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",10); c.drawString(56,by-18,t["sello"])
c.setFillColor(GRAY); c.setFont("Helvetica",9); c.drawString(56,by-33,t["sello2"]); c.drawString(56,by-46,fmt(t["sello3"],n=f"{B['n_healthcare']:,}".replace(",",".")))
footer(); c.showPage()

# P fichas benchmark doble-marca
allb=[{"name":leader["name"],"comps":[{"key":k,"score":B["candidates"][leader["name"]]["comps"][k]["score"],"pctl":round(B["candidates"][leader["name"]]["comps"][k]["pctl"]),"vsTop":B["candidates"][leader["name"]]["comps"][k]["vs_top"]} for k in COMP_ORDER],"pct":leader["pct"],"atTop":leader["atTop"],"pctBelow":B["candidates"][leader["name"]]["pct_of_top_below"],"eq":leader["eq"],"role":"Líder"}]
for cd in cand: allb.append({"name":cd["name"],"comps":cd["comps"],"pct":cd["pct"],"atTop":cd["atTop"],"pctBelow":cd["pctBelow"],"eq":cd["eq"],"role":"Cand."})
allb.sort(key=lambda x:-x["pct"])
def ficha_b(p,top_y):
    ch=296; x0,y0=40,top_y; cardw=W-80; c.setFillColor(WHITE); c.setStrokeColor(LIGHT); c.setLineWidth(1.2); c.roundRect(x0,y0-ch,cardw,ch,12,stroke=1,fill=1)
    c.setFillColor(VIOLET_BG); c.roundRect(x0,y0-52,cardw,52,12,stroke=0,fill=1); c.rect(x0,y0-52,cardw,18,stroke=0,fill=1)
    c.setFillColor(VIOLET); c.circle(x0+26,y0-26,13,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",9); c.drawCentredString(x0+26,y0-29.5,"".join(w[0] for w in p["name"].split()[:2]))
    c.setFillColor(INK); c.setFont("Helvetica-Bold",12); c.drawString(x0+46,y0-22,p["name"])
    c.setFillColor(GRAY); c.setFont("Helvetica",8); c.drawString(x0+46,y0-35,fmt(t["supera_tops"],role=p["role"],eq=p["eq"],p=f"{p['pct']:.0f}",pb=f"{p['pctBelow']:.0f}"))
    c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",18); c.drawRightString(x0+cardw-100,y0-32,f"p{p['pct']:.0f}")
    n=p["atTop"]; cc=VIOLET if n>=5 else (GREEN if n>=3 else (WARM if n>=1 else COLD)); c.setFillColor(cc); c.roundRect(x0+cardw-92,y0-39,82,15,7.5,stroke=0,fill=1)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",7.5); c.drawCentredString(x0+cardw-51,y0-34.5,fmt(t["niveltop"],n=n))
    bx,by=x0+20,y0-72; c.setFillColor(INK); c.setFont("Helvetica-Bold",9); c.drawString(bx,by,t["comp_lbl"])
    for i,cm in enumerate(p["comps"]):
        yy=by-18-i*23; c.setFillColor(GRAY); c.setFont("Helvetica",8.5); c.drawString(bx,yy+1,t["comp"][cm["key"]])
        comp_bar(bx+128,yy,240,8,cm["score"],pop[cm["key"]],topp[cm["key"]])
        c.setFillColor(INK); c.setFont("Helvetica-Bold",8.5); c.drawString(bx+374,yy+1,f"{cm['score']:.0f}")
        c.setFillColor(GRAY); c.setFont("Helvetica",7.5); c.drawString(bx+400,yy+1,f"p{cm['pctl']:.0f}")
        d=cm["vsTop"]; c.setFillColor(GREEN_DARK if d>=0 else COLD); c.setFont("Helvetica-Bold",7.5); c.drawString(bx+428,yy+1,f"{d:+.1f} {t['vstop']}")
for pi in range(0,len(allb),2):
    n=pi//2+1; tot=(len(allb)+1)//2; header(f"{t['perfiles_t']} ({n}/{tot})",t["detalle"],t["sec_bench"])
    ficha_b(allb[pi],H-112)
    if pi+1<len(allb): ficha_b(allb[pi+1],H-112-318)
    if pi+2>=len(allb):
        yk=H-112-318-30 if pi+1<len(allb) else H-112-318; c.setFillColor(INK); c.setFont("Helvetica-Bold",12); c.drawString(40,yk,t["metod_t"])
        c.setFillColor(GRAY); c.setFont("Helvetica",9)
        for j,l in enumerate(t["metod"]): c.drawString(40,yk-16-j*12,l)
    footer(); c.showPage()

# P LVS
header(t["vs_t"],t["vs_sub"],t["sec_vs"])
y=H-120; c.setFillColor(INK); c.setFont("Helvetica-Bold",15); c.drawString(40,y,t["vs_h"])
c.setFillColor(GRAY); c.setFont("Helvetica",9); c.drawString(40,y-14,t["vs_i1"]); c.drawString(40,y-26,t["vs_i2"])
DO=["TRUST","MOTIVATION","CHANGE","TEAMWORK","EXECUTION"]; ALL=[leader]+cand
tx,ty=40,y-50; fc=115; rest=(W-80-fc)/len(ALL); cw=[fc]+[rest]*len(ALL); rh=32
c.setFillColor(VIOLET); c.roundRect(tx,ty-22,sum(cw),22,6,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",8); c.drawString(tx+8,ty-15,"Driver")
for i,p in enumerate(ALL): cxp=tx+cw[0]+sum(cw[1:i+1]); c.drawCentredString(cxp+cw[i+1]/2,ty-15,p["name"].split(" ")[0])
def dsc(p,code):
    for d in p["lvs"]["drivers"]:
        if d["code"]==code: return d
    return None
for r,dc in enumerate(DO):
    yy=ty-22-(r+1)*rh; c.setFillColor(WHITE if r%2==0 else HexColor("#faf8ff")); c.rect(tx,yy,sum(cw),rh,stroke=0,fill=1)
    c.setFillColor(INK); c.setFont("Helvetica-Bold",9); c.drawString(tx+8,yy+12,t["drv"][dc])
    for i,p in enumerate(ALL):
        d=dsc(p,dc); cxp=tx+cw[0]+sum(cw[1:i+1]); cwi=cw[i+1]
        if d: c.setFillColor(VSB[d["band"]]); c.setFont("Helvetica-Bold",11); c.drawCentredString(cxp+cwi/2,yy+15,f"{d['score']:.0f}"); c.setFont("Helvetica",6.5); c.drawCentredString(cxp+cwi/2,yy+6,t["band"][d["band"]])
yy=ty-22-6*rh; c.setFillColor(HexColor("#efe9fc")); c.rect(tx,yy,sum(cw),rh,stroke=0,fill=1); c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",9); c.drawString(tx+8,yy+12,t["vista_lvs"])
for i,p in enumerate(ALL):
    v=p["lvs"]; cxp=tx+cw[0]+sum(cw[1:i+1]); cwi=cw[i+1]; c.setFillColor(VSB[v["band"]]); c.setFont("Helvetica-Bold",12); c.drawCentredString(cxp+cwi/2,yy+15,f"{v['score']}"); c.setFont("Helvetica",6.5); c.drawCentredString(cxp+cwi/2,yy+6,t["band"][v["band"]])
yl=yy-18; c.setFillColor(GRAY); c.setFont("Helvetica",8); c.drawString(40,yl,t["vs_scale"]); footer(); c.showPage()

# P honestidad
header(t["vs_t"],t["cierre_t"],t["sec_vs"]); y=H-120; c.setFillColor(INK); c.setFont("Helvetica-Bold",14); c.drawString(40,y,t["cierre_t"]); y-=20
h=110; c.setFillColor(HexColor("#fff7ed")); c.roundRect(40,y-h,W-80,h,10,stroke=0,fill=1)
c.setFillColor(HexColor("#9a3412")); c.setFont("Helvetica-Bold",10.5); c.drawString(56,y-18,t["honest_t"]); c.setFont("Helvetica",8.5)
for j,l in enumerate(t["honest"]): c.drawString(56,y-36-j*13,l)
footer(); c.save()
print("OK", OUT, "| páginas:", PAGE[0])
