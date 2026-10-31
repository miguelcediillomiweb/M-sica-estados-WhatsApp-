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
  const demo = [{id:"demo",titulo:"Una canción para ti",artista:"Artista invitado",portada:CONFIG.DEMO_COVER,video:"",youtube_url:"",activa:"SI",orden:"1"}];
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
    const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[ -]+/g,"_"));
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
  }
  function isActive(v){return !["no","false","0","inactiva","inactivo"].includes(String(v||"si").trim().toLowerCase());}
  function videoId(url){
    if(!url)return "";
    try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];if(u.searchParams.get("v"))return u.searchParams.get("v");const m=u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/);return m?m[1]:"";}catch{return "";}
  }
  function firstValue(track, keys){
    for(const key of keys){
      const value=String(track[key]||"").trim();
      if(value)return value;
    }
    return "";
  }
  function normalizeMediaUrl(value, kind="image"){
    const raw=String(value||"").trim();
    if(!raw)return kind==="image"?new URL(CONFIG.DEMO_COVER,document.baseURI).href:"";
    const lower=raw.toLowerCase();
    // Enlaces compartidos de Google Drive: convertirlos a visualización directa.
    let driveId="";
    const fileMarker="drive.google.com/file/d/";
    const filePos=lower.indexOf(fileMarker);
    if(filePos>=0)driveId=raw.slice(filePos+fileMarker.length).split(/[/?#]/)[0];
    if(!driveId&&lower.includes("drive.google.com")&&lower.includes("id=")){
      driveId=raw.slice(lower.indexOf("id=")+3).split(/[&#]/)[0];
    }
    if(driveId)return "https://drive.google.com/uc?export=view&id="+driveId;
    if(lower.startsWith("https://")||lower.startsWith("http://"))return raw;
    // Si Sheets solo contiene el nombre del archivo, usar la carpeta estándar del proyecto.
    const relative = (!raw.includes("/") && !raw.includes("\\")) ? (kind==="image"?"img/canciones/":"videos/")+raw : raw;
    return new URL(relative,document.baseURI).href;
  }
  function coverFor(track){
    return normalizeMediaUrl(firstValue(track,["portada","imagen","imagen_portada","caratula","carátula","cover","cover_url","foto"]));
  }
  function applyCoverImage(img, value){
    img.onerror=()=>{
      img.onerror=null;
      img.src=new URL(CONFIG.DEMO_COVER,document.baseURI).href;
    };
    img.src=normalizeMediaUrl(value,"image");
  }
  function setAccent(track){
    const s=firstValue(track,["portada","imagen","imagen_portada","caratula","carátula","cover","cover_url","foto"])||CONFIG.DEMO_COVER;
    let hash=0;for(let i=0;i<s.length;i++)hash=(hash*31+s.charCodeAt(i))|0;
    document.documentElement.style.setProperty("--accent",accents[Math.abs(hash)%accents.length]);
    document.documentElement.style.setProperty("--accent2",accents[(Math.abs(hash)+3)%accents.length]);
    const absoluteCover = normalizeMediaUrl(s,"image");
    document.documentElement.style.setProperty("--cover-image", 'url("' + absoluteCover + '")');
  }
  function stopVideo(){
    const video=els.videoFrame.querySelector("video");
    if(video){try{video.pause();video.removeAttribute("src");video.load();}catch{}}
    const frame=els.videoFrame.querySelector("iframe");
    if(frame){try{frame.src="about:blank";}catch{}}
    els.videoFrame.innerHTML='<div class="video-placeholder"><span>♪</span><p>El video aparecerá aquí</p><small>Presiona reproducir para comenzar</small></div>';
  }
  function renderTrack(){
    const t=tracks[current];if(!t)return;
    const cover=firstValue(t,["portada","imagen","imagen_portada","caratula","carátula","cover","cover_url","foto"]);
    applyCoverImage(els.coverArt,cover);
    applyCoverImage(els.recordArt,cover);
    els.coverArt.alt="Portada de "+(t.titulo||"la canción");
    els.title.textContent=t.titulo||"Canción sin título";
    els.artist.textContent=t.artista||"Artista desconocido";
    els.videoCaption.textContent=t.titulo||"Tu música, con estilo.";
    setAccent(t);
    [...els.playlist.children].forEach((el,i)=>el.classList.toggle("active",i===current));
    if(playing){stopVideo();showVideo(t);}
    els.status.textContent=(t.video||t.video_url||t.youtube_url||t.youtube)?"Video listo: pulsa reproducir para verlo.":"Añade el enlace del video en la columna video.";
  }
  function showVideo(t){
    // La columna "video" acepta: URL de YouTube, enlace directo a MP4 o ruta local como videos/cancion-001.mp4.
    const videoValue=String(t.video||t.video_url||t.youtube_url||t.youtube||"").trim();
    if(!videoValue){els.status.textContent="Añade el enlace del video en la columna video de Google Sheets.";return;}
    const ytId=videoId(videoValue);
    if(ytId){
      const iframe=document.createElement("iframe");
      iframe.title="Video de "+(t.titulo||"la canción");
      iframe.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(ytId)+"?autoplay=1&rel=0&playsinline=1";
      iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen=true;iframe.referrerPolicy="strict-origin-when-cross-origin";
      els.videoFrame.replaceChildren(iframe);
      els.status.textContent="Video de YouTube cargado.";
      return;
    }
    let mediaUrl=videoValue;
    // Admite enlaces compartidos de Google Drive, aunque la reproducción depende de sus permisos.
    const driveMarker="drive.google.com/file/d/";
    const driveIndex=videoValue.toLowerCase().indexOf(driveMarker);
    if(driveIndex>=0){
      const driveId=videoValue.slice(driveIndex+driveMarker.length).split(/[/?#]/)[0];
      if(driveId) mediaUrl="https://drive.google.com/uc?export=download&id="+driveId;
    } else if(!(mediaUrl.startsWith("https://")||mediaUrl.startsWith("http://"))){
      // En la hoja basta con escribir mental.mp4; el archivo vive en videos/.
      if(!mediaUrl.includes("/") && !mediaUrl.includes("\\")) mediaUrl="videos/"+mediaUrl;
      mediaUrl=new URL(mediaUrl,document.baseURI).href;
    }
    const video=document.createElement("video");
    video.title="Video de "+(t.titulo||"la canción");
    video.src=mediaUrl;
    video.controls=true;
    video.autoplay=true;
    video.playsInline=true;
    video.preload="metadata";
    video.setAttribute("playsinline","");
    video.addEventListener("error",()=>{els.status.textContent="No se pudo reproducir el enlace. Para evitar bloqueos, usa un MP4 directo o sube el archivo a la carpeta videos/ del repositorio.";});
    els.videoFrame.replaceChildren(video);
    const promise=video.play();
    if(promise&&typeof promise.catch==="function")promise.catch(()=>{els.status.textContent="El video está cargado; toca ▶ dentro del reproductor para escuchar.";});
    else els.status.textContent="Video cargado.";
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
      const img=document.createElement("img");img.alt="";img.loading="lazy";applyCoverImage(img,firstValue(t,["portada","imagen","imagen_portada","caratula","carátula","cover","cover_url","foto"]));
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
      const rows=csvRows(text).map(r=>{
        const normalized={...r};
        normalized.titulo=firstValue(r,["titulo","cancion","canción","nombre","nombre_de_cancion","nombre_de_la_cancion"])||"Canción sin título";
        normalized.artista=firstValue(r,["artista","interprete","intérprete","cantante"])||"Artista desconocido";
        normalized.portada=firstValue(r,["portada","imagen","imagen_portada","caratula","carátula","cover","cover_url","foto"]);
        normalized.video=firstValue(r,["video","video_url","enlace_video","link_video","youtube_url","youtube","enlace_youtube"]);
        normalized.activa=firstValue(r,["activa","activo","estado"])||"SI";
        normalized.orden=firstValue(r,["orden","posicion","posición"])||"9999";
        return normalized;
      }).filter(r=>isActive(r.activa));
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