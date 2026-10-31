(() => {
  "use strict";
  const CONFIG = {
    // La hoja debe permitir lectura pública o estar publicada como CSV.
    // Si la pestaña principal no usa gid=0, cambia ese número por el gid de la pestaña correcta.
    SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/1eMXgoVm_JjMmzh6xPGFYDVmIyujttinF3bCrQWg29c0/export?format=csv&gid=0",
    REFRESH_MS: 60000,
    DEMO_COVER: "img/canciones/portada-demo.svg"
  };
  const $ = id => document.getElementById(id);
  const els = {
    stage:$("stage"), sleeveWrap:$("sleeveWrap"), coverArt:$("coverArt"), recordArt:$("recordArt"),
    title:$("songTitle"), artist:$("songArtist"), play:$("playBtn"), playIcon:$("playIcon"),
    playText:$("playText"), next:$("nextBtn"), status:$("statusText"), videoCard:$("videoCard"),
    videoFrame:$("videoFrame"), videoCaption:$("videoCaption"), playlist:$("playlist"),
    trackCount:$("trackCount"), updatedAt:$("updatedAt")
  };
  const demo = [{id:"demo",titulo:"Una canción para ti",artista:"Artista invitado",portada:CONFIG.DEMO_COVER,youtube_url:"",activa:"SI",orden:"1"}];
  let tracks = [...demo], current = 0, playing = false, loadedFromSheet = false;
  const accents = ["#b88cff","#ff7aa8","#5adbd0","#ffb86b","#7ca7ff","#f5e76e"];
  function csvRows(text) {
    const rows=[]; let row=[], cell="", quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c==='"' && quoted && n==='"'){cell+='"';i++;}
      else if(c==='"') quoted=!quoted;
      else if(c==="," && !quoted){row.push(cell.trim());cell="";}
      else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell.trim());if(row.some(v=>v!==""))rows.push(row);row=[];cell="";}
      else cell+=c;
    }
    row.push(cell.trim());if(row.some(v=>v!==""))rows.push(row);
    if(!rows.length)return [];
    const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,"").toLowerCase());
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
  }
  function isActive(v){return !["no","false","0","inactiva","inactivo"].includes(String(v||"si").trim().toLowerCase());}
  function videoId(url){
    if(!url)return "";
    try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];if(u.searchParams.get("v"))return u.searchParams.get("v");const m=u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/);return m?m[1]:"";}catch{return "";}
  }
  function coverFor(track){return track.portada||track.cover||CONFIG.DEMO_COVER;}
  function setAccent(track){
    const s=coverFor(track);let hash=0;for(let i=0;i<s.length;i++)hash=(hash*31+s.charCodeAt(i))|0;
    document.documentElement.style.setProperty("--accent",accents[Math.abs(hash)%accents.length]);
    document.documentElement.style.setProperty("--accent2",accents[(Math.abs(hash)+3)%accents.length]);
    const absoluteCover = new URL(s, document.baseURI).href;
    document.documentElement.style.setProperty("--cover-image", 'url("' + absoluteCover + '")');
  }
  function stopVideo(){
    const frame=els.videoFrame.querySelector("iframe");
    if(frame){try{frame.src="about:blank";}catch{}}
    els.videoFrame.innerHTML='<div class="video-placeholder"><span>♪</span><p>El video aparecerá aquí</p><small>Presiona reproducir para comenzar</small></div>';
  }
  function renderTrack(){
    const t=tracks[current];if(!t)return;
    const cover=coverFor(t);
    els.coverArt.src=cover;els.recordArt.src=cover;
    els.coverArt.alt="Portada de "+(t.titulo||"la canción");
    els.title.textContent=t.titulo||"Canción sin título";
    els.artist.textContent=t.artista||"Artista desconocido";
    els.videoCaption.textContent=t.titulo||"Tu música, con estilo.";
    setAccent(t);
    [...els.playlist.children].forEach((el,i)=>el.classList.toggle("active",i===current));
    if(playing){stopVideo();showVideo(t);}
    els.status.textContent=t.youtube_url||t.youtube||t.video?"Video listo para reproducirse.":"Esta canción aún no tiene enlace de YouTube.";
  }
  function showVideo(t){
    const id=videoId(t.youtube_url||t.youtube||t.video);
    if(!id){els.status.textContent="Añade un enlace de YouTube a esta canción en la hoja.";return;}
    const iframe=document.createElement("iframe");
    iframe.title="Video de "+(t.titulo||"la canción");
    iframe.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?autoplay=1&rel=0&playsinline=1";
    iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen=true;iframe.referrerPolicy="strict-origin-when-cross-origin";
    els.videoFrame.replaceChildren(iframe);
    els.status.textContent="Experiencia en reproducción.";
  }
  function play(){
    playing=!playing;
    els.stage.classList.toggle("is-playing",playing);
    els.videoCard.classList.toggle("is-playing",playing);
    document.body.classList.toggle("is-playing",playing);
    els.playIcon.textContent=playing?"Ⅱ":"▶";
    els.playText.textContent=playing?"Pausar experiencia":"Reproducir experiencia";
    if(playing)showVideo(tracks[current]);else stopVideo();
    if(!playing)els.status.textContent="Reproducción pausada.";
  }
  function buildPlaylist(){
    els.playlist.replaceChildren();
    tracks.forEach((t,i)=>{
      const button=document.createElement("button");button.type="button";button.className="track-item"+(i===current?" active":"");
      const img=document.createElement("img");img.src=coverFor(t);img.alt="";img.loading="lazy";
      const meta=document.createElement("span");meta.className="meta";
      const title=document.createElement("strong");title.textContent=t.titulo||"Canción sin título";
      const artist=document.createElement("small");artist.textContent=t.artista||"Artista desconocido";
      const icon=document.createElement("span");icon.className="play-small";icon.textContent="▶";
      meta.append(title,artist);button.append(img,meta,icon);
      button.addEventListener("click",()=>{current=i;renderTrack();if(!playing)play();});
      els.playlist.append(button);
    });
    els.trackCount.textContent=tracks.length+" canción"+(tracks.length===1?"":"es");
  }
  async function loadSheet(){
    if(!CONFIG.SHEET_CSV_URL)return;
    try{
      const response=await fetch(CONFIG.SHEET_CSV_URL,{cache:"no-store"});
      if(!response.ok)throw new Error("HTTP "+response.status);
      const text=await response.text();
      if(!text||text.trim().startsWith("<!DOCTYPE")||text.trim().startsWith("<html"))throw new Error("La hoja no está publicada como CSV o requiere acceso.");
      const rows=csvRows(text).filter(r=>isActive(r.activa));
      if(!rows.length)throw new Error("No hay canciones activas en la hoja.");
      rows.sort((a,b)=>(Number(a.orden)||9999)-(Number(b.orden)||9999));
      tracks=rows;loadedFromSheet=true;
      current=Math.min(current,tracks.length-1);buildPlaylist();renderTrack();
      els.updatedAt.textContent="Catálogo sincronizado";
    }catch(err){
      console.warn("No se pudo leer Google Sheets:",err);
      els.status.textContent="Modo demostración: revisa el acceso público y la pestaña de Google Sheets.";
      els.updatedAt.textContent="Sin conexión con la hoja";
    }
  }
  els.play.addEventListener("click",play);
  els.next.addEventListener("click",()=>{current=(current+1)%tracks.length;renderTrack();});
  buildPlaylist();renderTrack();loadSheet();
  window.setInterval(loadSheet,CONFIG.REFRESH_MS);
})();