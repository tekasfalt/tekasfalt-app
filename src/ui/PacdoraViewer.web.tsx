import { createElement, useEffect, useRef, useState } from "react";
import { Image } from "react-native";

const loadingMark = Image.resolveAssetSource(require("../../assets/icon-a-white.png")).uri;

export default function PacdoraViewer({
  url = "https://www.pacdora.com/de/share?filter_url=ps5ubjiic1",
  title = "TEK ASFALT 3D ürün modeli",
  onInteractionChange,
}: {
  url?: string;
  title?: string;
  onInteractionChange?: (active: boolean) => void;
}) {
  const [loading,setLoading]=useState(true);
  const [failed,setFailed]=useState(false);
  const [reloadKey,setReloadKey]=useState(0);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  return createElement("div", {
    style:{position:"relative",width:"100%",height:"100%",overflow:"hidden",background:"#FFFFFF"},
  },
    createElement("iframe", {
      key:reloadKey,
      src: url,
      title,
      allowFullScreen: true,
      onLoad:()=>{
        setFailed(false);
        if(timer.current)clearTimeout(timer.current);
        timer.current=setTimeout(()=>setLoading(false),3200);
      },
      onError:()=>{if(timer.current)clearTimeout(timer.current);setLoading(false);setFailed(true)},
      onPointerDown:()=>onInteractionChange?.(true),
      onPointerUp:()=>onInteractionChange?.(false),
      onPointerLeave:()=>onInteractionChange?.(false),
      style:{width:"100%",height:"100%",border:"none",background:"#FFFFFF"},
    }),
    failed&&createElement("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"#FFFFFF",fontFamily:"Vodafone,Arial,sans-serif"}},
      createElement("div",{style:{color:"#1B2E53",fontSize:17,fontWeight:700}},"3D model açılamadı"),
      createElement("div",{style:{color:"#68758A",fontSize:13,lineHeight:"18px",marginTop:7,textAlign:"center"}},"Bağlantıyı kontrol edip modeli yeniden deneyin."),
      createElement("button",{onClick:()=>{setFailed(false);setLoading(true);setReloadKey(value=>value+1)},style:{border:0,marginTop:18,height:42,padding:"0 17px",borderRadius:21,background:"#E74022",color:"#fff",fontWeight:700,cursor:"pointer"}},"Yeniden dene"),
    ),
    loading&&!failed&&createElement("div", {
      style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"#FFFFFF",fontFamily:"Vodafone,Arial,sans-serif"},
    },
      createElement("img",{src:loadingMark,alt:"",style:{width:58,height:58,objectFit:"contain",marginBottom:12}}),
      createElement("div",{style:{color:"#68758A",fontSize:13,lineHeight:"18px",textAlign:"center"}},`${title.replace(" 3D ürün modeli","")} · 3D model yükleniyor…`),
      createElement("div",{style:{width:22,height:22,border:"3px solid #F8C5A8",borderTopColor:"#E74022",borderRadius:"50%",marginTop:18,animation:"tekPacdoraSpin .8s linear infinite"}}),
      createElement("style",null,"@keyframes tekPacdoraSpin{to{transform:rotate(360deg)}}"),
    ),
  );
}
