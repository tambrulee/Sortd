"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export default function UploadedCover({path}:{path:string}) {
  const [url,setUrl]=useState<string>();
  useEffect(()=>{
    let alive=true;
    async function load(){
      const {data,error}=await supabase.storage.from("project-covers").createSignedUrl(path,3600);
      if(alive) setUrl(error?undefined:data.signedUrl);
    }
    load();return ()=>{alive=false};
  },[path]);
  return url?<img src={url} alt="" className="h-full w-full object-cover"/>:<div className="h-full w-full bg-gradient-to-br from-[#1f0825] to-[#477b73]"/>;
}
