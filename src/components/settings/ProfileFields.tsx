"use client";
import { useState } from "react";

export function Row({ label, children }:{label:string; children:React.ReactNode}){
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-3 items-center">
      <div className="text-sm rowi-muted">{label}</div>
      <div>{children}</div>
    </div>
  );
}
export function Toggle({checked,onChange}:{checked:boolean; onChange:(v:boolean)=>void}){
  return (
    <button
      onClick={()=>onChange(!checked)}
      className={"inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs "+(checked?"rowi-btn-primary":"rowi-btn")}
      type="button"
    >{checked?"On":"Off"}</button>
  );
}
export function Select({value,onChange,options}:{value:string; onChange:(v:string)=>void; options:string[]}){
  return (
    <select className="rounded-md border px-3 py-2 bg-transparent" value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(op=><option key={op} value={op}>{op}</option>)}
    </select>
  );
}
export function Text({value,onChange,placeholder}:{value:string; onChange:(v:string)=>void; placeholder?:string}){
  return <input className="w-full rounded-md border px-3 py-2 bg-transparent" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />;
}
export function TextArea({value,onChange,rows=3,placeholder}:{value:string; onChange:(v:string)=>void; rows?:number; placeholder?:string}){
  return <textarea className="w-full rounded-md border px-3 py-2 bg-transparent" rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />;
}
export function Chips({value,onChange,placeholder}:{value:string[]; onChange:(v:string[])=>void; placeholder?:string}){
  const [inp,setInp]=useState("");
  function add(){
    const k=inp.trim();
    if(!k) return;
    if(!value.includes(k)) onChange([...value,k]);
    setInp("");
  }
  function del(k:string){ onChange(value.filter(v=>v!==k)); }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map(k=><span key={k} className="rowi-chip inline-flex items-center gap-2">{k}<button className="text-xs" onClick={()=>del(k)}>×</button></span>)}
      <input className="rounded-md border px-2 py-1 bg-transparent" value={inp} placeholder={placeholder||"Agregar…"} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}}/>
      <button className="rowi-btn" type="button" onClick={add}>+ Añadir</button>
    </div>
  );
}
