const grid = document.getElementById("gallery");
const lb = document.getElementById("lightbox");
const inner = document.getElementById("lbInner");
const closeBtn = document.getElementById("lbClose");

function openLightbox(node){
  inner.innerHTML = "";
  inner.appendChild(node);
  lb.setAttribute("aria-hidden","false");
}
function closeLightbox(){
  inner.innerHTML = "";
  lb.setAttribute("aria-hidden","true");
}
closeBtn.addEventListener("click", closeLightbox);
lb.addEventListener("click", (e)=>{ if(e.target === lb) closeLightbox(); });
document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeLightbox(); });

grid.addEventListener("click", (e)=>{
  const card = e.target.closest("a.card");
  if(!card) return;
  e.preventDefault();
  const type = card.dataset.type;
  const href = card.getAttribute("href");

  if(type === "image"){
    const img = document.createElement("img");
    img.src = href;
    img.alt = card.querySelector("img")?.alt || "";
    openLightbox(img);
  }else if(type === "video"){
    const v = document.createElement("video");
    v.src = href; v.controls = true; v.preload = "metadata";
    const poster = card.dataset.poster; if(poster) v.poster = poster;
    openLightbox(v);
  }
});