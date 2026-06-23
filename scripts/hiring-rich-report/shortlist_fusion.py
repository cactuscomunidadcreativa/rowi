# -*- coding: utf-8 -*-
"""
Pieza FUSIONADA: short list People Inc + hallazgos Rowi.

Combina la capa HUMANA (CV, fortalezas, avaliação, remuneração — de People Inc)
con la capa CUANTITATIVA Rowi (afinidad con el manager, percentil benchmark SEI,
hipótesis LVS) en una ficha por candidato, con el lenguaje gráfico Rowi.

Honesto: los candidatos sin SEI muestran solo la capa People Inc + nota
"sin lectura Rowi aún".

Uso: python3 shortlist_fusion.py <data.json> <out.pdf> <lang>
"""
import json, sys, textwrap
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

DATA = sys.argv[1] if len(sys.argv) > 1 else "/tmp/shortlist-fusion-data.json"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/fusion.pdf"
LANG = sys.argv[3] if len(sys.argv) > 3 else "es"
D = json.load(open(DATA))

W, H = A4
VIOLET=HexColor("#7c3aed"); VIOLET_DARK=HexColor("#5b21b6"); VIOLET_BG=HexColor("#f3eefe")
INK=HexColor("#1e1b2e"); GRAY=HexColor("#6b7280"); LIGHT=HexColor("#e9e4f5"); WHITE=HexColor("#ffffff")
WARM=HexColor("#f59e0b"); COLD=HexColor("#64748b"); GREEN=HexColor("#10b981"); GREEN_DARK=HexColor("#047857")
TEAL_BG=HexColor("#ecfdf5"); CORAL_BG=HexColor("#fff1ec"); CORAL=HexColor("#e8643c")
NAVY=HexColor("#13294b")  # azul People Inc/Werfen (la capa humana viene en navy)
BAND_COLOR={"hot":VIOLET,"warm":WARM,"cold":COLD}

T = {
 "es": {"tag":"Sé quien quieres ser","cover_t":"Short list + lectura Rowi","cover_sub":"Capa humana (People Inc) + capa de datos (Rowi · SEI / Afinidad / LVS)",
   "intro":"Fusionamos la evaluación humana de People Inc (trayectoria, fortalezas, motivación) con la lectura cuantitativa de Rowi: afinidad con el manager, percentil mundial de inteligencia emocional y la hipótesis LVS. Dos lentes sobre la misma persona.",
   "leaderbox":"El manager y el ancla","human":"PERFIL · PEOPLE INC","rowi_layer":"LECTURA ROWI · DATOS","exp":"Experiencia","loc":"Ubicación",
   "strengths":"Fortalezas","eval":"Evaluación (Andreia · People Inc)","salary":"Remuneración","last":"Último","expect":"Expectativa","bonus":"Bono/PLR",
   "aff":"Afinidad con","aff_sub":"sintonía de la díada · escala 0-135","pctEQ":"Percentil EQ mundial","lvs":"LVS inferido","topc":"Nivel top en",
   "ctx":{"leadership":"Liderazgo","execution":"Ejecución","innovation":"Innovación","decision":"Decisión","conversation":"Conversación","relationship":"Relación"},
   "band":{"low":"baja","mid":"media","high":"alta"},"comps":"competencias",
   "norowi":"Sin lectura Rowi aún","norowi_sub":"Este candidato no hizo el SEI. La capa de datos (afinidad/benchmark/LVS) está disponible cuando complete la evaluación.",
   "foot":"Rowi × People Inc · Werfen — Gerente de Serviços SP · lente de relación, no veredicto",
   "principle":"Esto cruza el juicio humano del headhunter con datos de IE. NO es un criterio de selección: la decisión final es de Werfen. Cada brecha se cierra con un puente.",
   "summ_t":"Los 7 candidatos, en una vista","summ_cols":["Candidato","Exp.","Afinidad","Percentil EQ","LVS","Expectativa"],
   "aff_high":"Alta sintonía","aff_mid":"Sintonía media","aff_low":"Baja sintonía","na":"—",
 },
 "pt": {"tag":"Seja quem você quer ser","cover_t":"Short list + leitura Rowi","cover_sub":"Camada humana (People Inc) + camada de dados (Rowi · SEI / Afinidade / LVS)",
   "intro":"Fundimos a avaliação humana da People Inc (trajetória, fortalezas, motivação) com a leitura quantitativa da Rowi: afinidade com o manager, percentil mundial de inteligência emocional e a hipótese LVS. Duas lentes sobre a mesma pessoa.",
   "leaderbox":"O manager e a âncora","human":"PERFIL · PEOPLE INC","rowi_layer":"LEITURA ROWI · DADOS","exp":"Experiência","loc":"Localização",
   "strengths":"Fortalezas","eval":"Avaliação (Andreia · People Inc)","salary":"Remuneração","last":"Último","expect":"Expectativa","bonus":"Bônus/PLR",
   "aff":"Afinidade com","aff_sub":"sintonia da díade · escala 0-135","pctEQ":"Percentil EQ mundial","lvs":"LVS inferido","topc":"Nível top em",
   "ctx":{"leadership":"Liderança","execution":"Execução","innovation":"Inovação","decision":"Decisão","conversation":"Conversa","relationship":"Relacionamento"},
   "band":{"low":"baixa","mid":"média","high":"alta"},"comps":"competências",
   "norowi":"Sem leitura Rowi ainda","norowi_sub":"Este candidato não fez o SEI. A camada de dados (afinidade/benchmark/LVS) fica disponível quando completar a avaliação.",
   "foot":"Rowi × People Inc · Werfen — Gerente de Serviços SP · lente de relação, não veredito",
   "principle":"Isto cruza o julgamento humano do headhunter com dados de IE. NÃO é um critério de seleção: a decisão final é da Werfen. Cada lacuna se fecha com uma ponte.",
   "summ_t":"Os 7 candidatos, em uma visão","summ_cols":["Candidato","Exp.","Afinidade","Percentil EQ","LVS","Expectativa"],
   "aff_high":"Alta sintonia","aff_mid":"Sintonia média","aff_low":"Baixa sintonia","na":"—",
 },
}
t = T[LANG]
CTX_ORDER=["leadership","execution","innovation","decision","conversation","relationship"]
cands = D["candidates"]
c = canvas.Canvas(OUT, pagesize=A4); PAGE=[0]
def L(obj): return obj[LANG] if isinstance(obj, dict) else obj

def header(title, subtitle, eyebrow=""):
    PAGE[0]+=1
    c.setFillColor(VIOLET); c.rect(0,H-92,W,92,stroke=0,fill=1)
    c.setFillColor(VIOLET_DARK); c.circle(W-60,H-30,70,stroke=0,fill=1)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",26); c.drawString(40,H-48,"rowi")
    c.setFont("Helvetica",9); c.drawString(40,H-62,t["tag"])
    if eyebrow: c.setFillColor(HexColor("#a78bfa")); c.setFont("Helvetica-Bold",8); c.drawRightString(W-40,H-26,eyebrow)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",15); c.drawRightString(W-40,H-44,title)
    c.setFont("Helvetica",9.5); c.drawRightString(W-40,H-60,subtitle)
def footer():
    c.setFillColor(GRAY); c.setFont("Helvetica",8); c.drawString(40,28,t["foot"])
    c.drawRightString(W-40,28,f"pág. {PAGE[0]}"); c.setStrokeColor(LIGHT); c.setLineWidth(1); c.line(40,40,W-40,40)
def wrap(txt,fs,maxw,font="Helvetica"):
    words=txt.split(); lines=[]; cur=""
    for w in words:
        if c.stringWidth((cur+" "+w).strip(),font,fs)<=maxw: cur=(cur+" "+w).strip()
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines
def para(txt,x,y,maxw,fs=8.5,color=INK,font="Helvetica",lead=11):
    c.setFillColor(color); c.setFont(font,fs)
    for ln in wrap(txt,fs,maxw,font): c.drawString(x,y,ln); y-=lead
    return y
def score_bar(x,y,w,h,value,maxv=135,col=VIOLET,norm=100):
    c.setFillColor(LIGHT); c.roundRect(x,y,w,h,h/2,stroke=0,fill=1)
    c.setFillColor(col); c.roundRect(x,y,max(h,w*min(value,maxv)/maxv),h,h/2,stroke=0,fill=1)
    if norm: nx=x+w*norm/maxv; c.setStrokeColor(WHITE); c.setLineWidth(1); c.line(nx,y,nx,y+h)

# ============ PORTADA ============
header(t["cover_t"], t["cover_sub"], "WERFEN · GERENTE DE SERVIÇOS SP")
y=H-122; c.setFillColor(INK); c.setFont("Helvetica-Bold",17); c.drawString(40,y,L(D["process"]) if isinstance(D["process"],dict) else D["process"])
y-=20; y=para(t["intro"],40,y,W-80,9.5,GRAY,lead=13)-6
# caja del manager (navy = capa humana, violeta = Rowi)
c.setFillColor(VIOLET_BG); c.roundRect(40,y-58,W-80,58,10,stroke=0,fill=1)
c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",10); c.drawString(56,y-20,t["leaderbox"]+": "+D["leaderName"])
c.setFillColor(INK); c.setFont("Helvetica",8.5)
para(L(D["leaderNote"]),56,y-34,W-112,8.5,INK,lead=11)
y-=70
# tabla resumen de los 7
c.setFillColor(INK); c.setFont("Helvetica-Bold",13); c.drawString(40,y,t["summ_t"]); y-=8
tx=40; cw=[150,52,90,86,78,(W-80-150-52-90-86-78)]; rh=30
c.setFillColor(VIOLET); c.roundRect(tx,y-22,sum(cw),22,5,stroke=0,fill=1); c.setFillColor(WHITE); c.setFont("Helvetica-Bold",8)
xa=tx
for i,hd in enumerate(t["summ_cols"]): c.drawString(xa+6,y-15,hd); xa+=cw[i]
# ordenar: con Rowi por afinidad desc, luego sin Rowi
order=sorted(cands,key=lambda x:(-(x["rowi"]["affinity"] if x["rowi"] else -1)))
for r,cd in enumerate(order):
    yy=y-22-(r+1)*rh; c.setFillColor(WHITE if r%2==0 else HexColor("#faf8ff")); c.rect(tx,yy,sum(cw),rh,stroke=0,fill=1)
    c.setFillColor(INK); c.setFont("Helvetica-Bold",8.5); c.drawString(tx+6,yy+rh/2+1,cd["name"].split(" (")[0])
    c.setFillColor(GRAY); c.setFont("Helvetica",6.5); c.drawString(tx+6,yy+rh/2-9,cd["company"])
    xa=tx+cw[0]
    c.setFillColor(INK); c.setFont("Helvetica",8); c.drawString(xa+6,yy+rh/2-2,cd["experience"]); xa+=cw[1]
    rw=cd["rowi"]
    if rw:
        c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",8.5); c.drawString(xa+6,yy+rh/2-2,f"{rw['affinity']}/135"); xa+=cw[2]
        c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",8.5); c.drawString(xa+6,yy+rh/2-2,f"p{rw['eqPercentile']}"); xa+=cw[3]
        c.setFillColor(INK); c.setFont("Helvetica",8); c.drawString(xa+6,yy+rh/2-2,f"{rw['lvs']} ({t['band'][rw['lvsBand']]})"); xa+=cw[4]
    else:
        c.setFillColor(GRAY); c.setFont("Helvetica-Oblique",7.5)
        for j,k in enumerate([cw[2],cw[3],cw[4]]):
            c.drawString(xa+6,yy+rh/2-2,t["na"]); xa+=k
    c.setFillColor(INK); c.setFont("Helvetica",7.5); c.drawString(xa+6,yy+rh/2-2,cd["salary"]["expectation"])
y2=y-22-len(order)*rh-14
c.setFillColor(CORAL_BG); c.roundRect(40,y2-44,W-80,44,9,stroke=0,fill=1)
c.setFillColor(HexColor("#9a3412")); c.setFont("Helvetica",8.5)
para(t["principle"],56,y2-16,W-112,8.5,HexColor("#9a3412"),lead=11)
footer(); c.showPage()

# ============ FICHA POR CANDIDATO ============
def ficha(cd):
    header(cd["name"].split(" (")[0], f"{cd['company']} · {cd['experience']}", "WERFEN · GERENTE DE SERVIÇOS SP")
    y=H-110
    # banda meta
    meta=[]
    if cd.get("age"): meta.append(f"{cd['age']} anos" if LANG=='pt' else f"{cd['age']} años")
    if cd.get("location") and cd["location"]!="—": meta.append(cd["location"])
    if meta:
        c.setFillColor(GRAY); c.setFont("Helvetica",9); c.drawString(40,y," · ".join(meta)); y-=16
    # ── CAPA HUMANA (People Inc) ──
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold",9); c.drawString(40,y,t["human"]); y-=4
    c.setStrokeColor(NAVY); c.setLineWidth(2); c.line(40,y,W-40,y); y-=14
    y=para(L(cd["summary"]),40,y,W-80,9,INK,lead=12)-6
    # fortalezas (chip box)
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold",9); c.drawString(40,y,t["strengths"]); y-=12
    y=para(L(cd["strengths"]),40,y,W-80,8.5,HexColor("#374151"),lead=11)-4
    # evaluación
    if cd.get("evaluation"):
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold",9); c.drawString(40,y,t["eval"]); y-=12
        y=para(L(cd["evaluation"]),40,y,W-80,8.5,HexColor("#374151"),lead=11)-6
    # remuneração inline
    s=cd["salary"]
    c.setFillColor(VIOLET_BG); c.roundRect(40,y-22,W-80,22,5,stroke=0,fill=1)
    c.setFillColor(VIOLET_DARK); c.setFont("Helvetica-Bold",8.5)
    c.drawString(50,y-15,f"{t['salary']}:  {t['last']} {s['last']}  ·  {t['bonus']} {s['bonus']}  ·  {t['expect']} {s['expectation']}")
    y-=34
    # ── CAPA ROWI ──
    c.setFillColor(VIOLET); c.setFont("Helvetica-Bold",9); c.drawString(40,y,t["rowi_layer"]); y-=4
    c.setStrokeColor(VIOLET); c.setLineWidth(2); c.line(40,y,W-40,y); y-=16
    rw=cd["rowi"]
    if not rw:
        c.setFillColor(HexColor("#fff7ed")); c.roundRect(40,y-44,W-80,44,9,stroke=0,fill=1)
        c.setFillColor(HexColor("#9a3412")); c.setFont("Helvetica-Bold",10); c.drawString(56,y-18,t["norowi"])
        c.setFont("Helvetica",8.5); para(t["norowi_sub"],56,y-32,W-112,8.5,HexColor("#9a3412"),lead=11)
        footer(); c.showPage(); return
    # 3 KPIs Rowi
    kpis=[(f"{rw['affinity']}/135",f"{t['aff']} {D['leaderName'].split(' ')[0]}", VIOLET_DARK),
          (f"p{rw['eqPercentile']}",t["pctEQ"], GREEN_DARK if rw['eqPercentile']>=70 else WARM),
          (f"{rw['lvs']}",f"{t['lvs']} ({t['band'][rw['lvsBand']]})", VIOLET_DARK)]
    kw=(W-80-20)/3
    for i,(num,lbl,col) in enumerate(kpis):
        x=40+i*(kw+10); c.setFillColor(VIOLET_BG); c.roundRect(x,y-52,kw,52,8,stroke=0,fill=1)
        c.setFillColor(col); c.setFont("Helvetica-Bold",20); c.drawCentredString(x+kw/2,y-26,num)
        c.setFillColor(GRAY); c.setFont("Helvetica",7.5)
        for j,seg in enumerate(wrap(lbl,7.5,kw-12)): c.drawCentredString(x+kw/2,y-38-j*9,seg)
    y-=64
    # afinidad por contexto
    c.setFillColor(INK); c.setFont("Helvetica-Bold",9.5); c.drawString(40,y,f"{t['aff']} {D['leaderName'].split(' ')[0]} · {t['aff_sub']}"); y-=16
    bx=40
    for ctx in CTX_ORDER:
        v=rw["byContext"][ctx]; band="hot" if v>=108 else ("warm" if v>=92 else "cold")
        c.setFillColor(GRAY); c.setFont("Helvetica",8.5); c.drawString(bx,y+1,t["ctx"][ctx])
        score_bar(bx+110,y,260,8,v,col=BAND_COLOR[band])
        c.setFillColor(INK); c.setFont("Helvetica-Bold",8.5); c.drawString(bx+378,y+1,str(v))
        y-=17
    # nota nivel top
    c.setFillColor(GRAY); c.setFont("Helvetica-Oblique",8); c.drawString(40,y-2,f"{t['topc']} {rw['topComps']}/8 {t['comps']} · benchmark {D['rowiBenchmark']['nTotal']:,} SEI".replace(",","."))
    footer(); c.showPage()

for cd in cands: ficha(cd)
c.save()
print("OK", OUT, "| páginas:", PAGE[0])
