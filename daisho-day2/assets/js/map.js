const iframe = document.getElementById("gmap");
const wrap = document.querySelector(".map-wrap");
const spots = document.getElementById("spots");

function setMap(url){
  iframe.src = url;
  // 軽いフェード演出
  wrap.style.opacity = "0.85";
  setTimeout(()=> wrap.style.opacity = "1", 120);
}

const first = spots.querySelector(".spot");
if(first){ first.classList.add("active"); setMap(first.dataset.map); }

spots.addEventListener("click", (e)=>{
  const btn = e.target.closest(".spot"); if(!btn) return;
  spots.querySelectorAll(".spot").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  setMap(btn.dataset.map);
});