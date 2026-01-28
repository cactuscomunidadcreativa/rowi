"use client";
import useSWR from "swr";
const fx=(u:string)=>fetch(u).then(r=>r.json());
export default function LogsPage(){
  const { data } = useSWR("/api/hub/logs/interactions", fx);
  return (<pre className="p-4 bg-white rounded-lg border overflow-auto text-sm">{JSON.stringify(data,null,2)}</pre>);
}
