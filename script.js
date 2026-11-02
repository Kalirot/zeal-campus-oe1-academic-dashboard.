const API_URL = 'https://script.google.com/macros/s/AKfycbwetJR_j9JhCckbNotX2vBi_grWTQryrlVBupnHvahZZ0cdUlbuom3--5w8ZJxNK9Xl/exec';

const state = {
  students: [], filtered: [], sortKey: null, sortDir: "asc",
  page: 1, pageSize: 10, performance: "all", currentView: "dashboard",
  lastSync: null, charts: {}
};

const $ = id => document.getElementById(id);
const els = {
  sidebar:$("sidebar"), overlay:$("mobileOverlay"), menu:$("menuBtn"), refresh:$("refreshBtn"),
  search:$("searchInput"), clear:$("clearSearch"), filter:$("performanceFilter"), pageSize:$("pageSize"),
  table:$("studentTableBody"), tableWrap:$("tableWrap"), mobileCards:$("mobileCards"),
  pagination:$("pagination"), prev:$("prevPage"), next:$("nextPage"), pageInfo:$("pageInfo"),
  resultCount:$("resultCount"), stateArea:$("stateArea"), loading:$("loadingOverlay"),
  theme:$("themeBtn"), topTheme:$("topThemeBtn"), export:$("exportBtn"), sideExport:$("exportSide"),
  modal:$("detailModal"), backdrop:$("modalBackdrop"), close:$("closeModal")
};

document.addEventListener("DOMContentLoaded", () => {
  if(localStorage.getItem("zeal-theme")==="dark")document.body.classList.add("dark");
  bindEvents();
  showView("dashboard");
  loadStudents();
});

function bindEvents(){
  document.querySelectorAll(".nav-item[data-view]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
  document.querySelectorAll("[data-view-target]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.viewTarget)));
  els.menu.addEventListener("click",()=>{els.sidebar.classList.toggle("open");els.overlay.classList.toggle("show")});
  els.overlay.addEventListener("click",closeMobile);
  els.refresh.addEventListener("click",loadStudents);
  els.theme.addEventListener("click",toggleTheme); els.topTheme.addEventListener("click",toggleTheme);
  els.export.addEventListener("click",exportCSV); els.sideExport.addEventListener("click",exportCSV);
  els.search.addEventListener("input",()=>{state.page=1;applyFilters()});
  els.clear.addEventListener("click",()=>{els.search.value="";state.page=1;applyFilters();els.search.focus()});
  els.filter.addEventListener("change",()=>{state.performance=els.filter.value;state.page=1;applyFilters()});
  els.pageSize.addEventListener("change",()=>{state.pageSize=Number(els.pageSize.value);state.page=1;renderStudents()});
  els.prev.addEventListener("click",()=>{if(state.page>1){state.page--;renderStudents()}});
  els.next.addEventListener("click",()=>{if(state.page<pageCount()){state.page++;renderStudents()}});
  document.querySelectorAll(".sort-btn").forEach(btn=>btn.addEventListener("click",()=>sortStudents(btn.dataset.key)));
  els.close.addEventListener("click",closeModal); els.backdrop.addEventListener("click",closeModal);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeMobile()}});
}

function closeMobile(){els.sidebar.classList.remove("open");els.overlay.classList.remove("show")}

function showView(view){
  state.currentView=view;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  $("view-"+view).classList.add("active");
  document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const labels={dashboard:"Dashboard",students:"Student Directory",analytics:"Academic Analytics",api:"API & Data Source"};
  $("pageTitle").textContent=labels[view]; $("breadcrumbCurrent").textContent=labels[view];
  closeMobile();
  if(view==="analytics") setTimeout(drawAllCharts,50);
}

function setDate(){
  const d=new Date();
  const x=$("currentDate");
  if(x) x.textContent=d.toLocaleDateString(undefined,{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
}

async function loadStudents(){
  els.loading.classList.remove("hidden");
  $("topStatusText").textContent="Syncing...";
  setStatus(false);
  try{
    const response=await fetch(API_URL,{cache:"no-store"});
    if(!response.ok) throw new Error("HTTP "+response.status);
    const raw=await response.json();
    if(!Array.isArray(raw)) throw new Error("API did not return an array");
    state.students=raw.map(normalize).filter(s=>s.name||s.rollNo);
    state.lastSync=new Date();
    const lastSyncEl=$("lastSync"); if(lastSyncEl) lastSyncEl.textContent=state.lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    $("apiSync").textContent=state.lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    $("apiRecords").textContent=state.students.length;
    $("apiUrl").textContent=API_URL;
    $("apiTitle").textContent="API Connected";
    $("apiMessage").textContent="Google Sheets → Apps Script → JSON";
    setStatus(true);
    updateDashboard(); applyFilters();
  }catch(err){
    setStatus(false); $("topStatusText").textContent="API Error"; $("apiTitle").textContent="Connection Error";
    $("apiMessage").textContent=err.message||"Unable to fetch live records";
    showError(err.message||"Unable to fetch live records");
  }finally{els.loading.classList.add("hidden");}
}

function setStatus(ok){
  ["topStatus","sideStatus"].forEach(id=>{const x=$(id);x.classList.toggle("online",ok)});
  $("topStatusText").textContent=ok?"API Connected":"API Offline";
}

function normalize(r,i){
  const n=v=>{if(v==null||String(v).trim()==="")return null;const x=Number(v);return Number.isFinite(x)?x:null};
  return {srNo:r.srNo??i+1,rollNo:String(r.rollNo??""),name:String(r.name??"").trim(),tenth:n(r.tenth),twelfth:n(r.twelfth),sem1:n(r.sem1),sem2:n(r.sem2)};
}
function avg(a){const x=a.filter(v=>typeof v==="number"&&Number.isFinite(v));return x.length?x.reduce((s,v)=>s+v,0)/x.length:null}
function semAvg(s){return avg([s.sem1,s.sem2])}
function perf(s){const x=semAvg(s);return x>=8?{label:"Excellent",cls:"excellent"}:x>=7?{label:"Good",cls:"good"}:{label:"Needs attention",cls:"needs"}}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function fmt(v){return v==null?"—":Number(v).toFixed(Number.isInteger(v)?0:1)}

function updateDashboard(){
  const s=state.students;
  const setText=(id,value)=>{const el=$(id);if(el)el.textContent=value};
  const ranked=[...s].sort((a,b)=>(semAvg(b)||0)-(semAvg(a)||0));
  const top=ranked[0];
  const a10=avg(s.map(x=>x.tenth)), a12=avg(s.map(x=>x.twelfth));
  const a1=avg(s.map(x=>x.sem1)), a2=avg(s.map(x=>x.sem2));
  const excellent=s.filter(x=>(semAvg(x)||0)>=8).length;
  const good=s.filter(x=>{const v=semAvg(x)||0;return v>=7&&v<8}).length;
  const needs=s.length-excellent-good;
  const health=s.length?Math.round(((excellent*1)+(good*.78)+(needs*.48))/s.length*100):0;

  setText("totalStudents",s.length);
  setText("avgTenth",fmt(a10)+"%");
  setText("avgTwelfth",fmt(a12)+"%");
  setText("topPerformer",top?top.name:"—");
  setText("topPerformerMeta",top?`Roll ${top.rollNo} • ${fmt(semAvg(top))} avg`:"—");
  setText("heroHealth",health);
  setText("heroStudentCount",`${s.length} students`);
  setText("heroTopName",top?top.name:"—");
  setText("heroTopMeta",top?`Roll ${top.rollNo} · ${fmt(semAvg(top))} semester average`:"No connected records");
  const avatar=$("leaderAvatar"); if(avatar) avatar.textContent=(top?.name?.trim()?.[0]||"Z").toUpperCase();
  const healthBar=$("heroHealthBar"); if(healthBar) healthBar.style.width=`${health}%`;

  const delta=(a1!=null&&a2!=null)?a2-a1:0;
  const insights=$("insights");
  if(insights){
    insights.innerHTML=[
      `<div class="insight"><i></i><span><b>${top?esc(top.name):"No leader yet"}</b> leads the current semester ranking with <b>${top?fmt(semAvg(top)):"—"}</b>.</span></div>`,
      `<div class="insight"><i></i><span>Average semester movement is <b>${delta>=0?"+":""}${delta.toFixed(2)}</b> from Sem 1 to Sem 2.</span></div>`,
      `<div class="insight"><i></i><span><b>${excellent}</b> excellent, <b>${good}</b> good and <b>${needs}</b> attention records.</span></div>`
    ].join("");
  }

  const recent=ranked.slice(0,5);
  const recentBody=$("recentBody");
  if(recentBody){
    recentBody.innerHTML=recent.map(x=>`<tr data-roll="${esc(x.rollNo)}" class="recent-row"><td>${esc(x.name)}</td><td>${esc(x.rollNo)}</td><td>${fmt(x.sem1)}</td><td>${fmt(x.sem2)}</td><td><span class="performance ${perf(x).cls}">${perf(x).label}</span></td></tr>`).join("");
    recentBody.querySelectorAll(".recent-row").forEach(r=>r.addEventListener("click",()=>openStudent(r.dataset.roll)));
  }

  const board=$("leaderBoard");
  if(board){
    board.innerHTML=ranked.slice(0,5).map((x,i)=>`<div class="leader-row"><b class="rank">${String(i+1).padStart(2,"0")}</b><div class="leader-avatar small">${esc((x.name.trim()[0]||"S").toUpperCase())}</div><div class="leader-name"><strong>${esc(x.name)}</strong><span>Roll ${esc(x.rollNo)} · ${fmt(semAvg(x))} avg</span></div><strong class="leader-score">${fmt(semAvg(x))}</strong></div>`).join("");
  }

  setText("trendBadge",`${s.length} records`);
  setText("apiRecords",s.length);
  setText("apiUrl",API_URL);
  drawAllCharts();
  buildAnalyticsCards();
}
function applyFilters(){
  const q=els.search.value.trim().toLowerCase();
  els.clear.style.display=q?"block":"none";
  state.filtered=state.students.filter(s=>{
    const match=(s.name+" "+s.rollNo).toLowerCase().includes(q);
    const v=semAvg(s)||0;
    const pf=state.performance==="all"||(state.performance==="excellent"&&v>=8)||(state.performance==="good"&&v>=7&&v<8)||(state.performance==="needs"&&v<7);
    return match&&pf;
  });
  renderStudents();
}

function sortStudents(key){
  if(state.sortKey===key)state.sortDir=state.sortDir==="asc"?"desc":"asc";else{state.sortKey=key;state.sortDir="asc"}
  state.filtered.sort((a,b)=>{
    const av=a[key],bv=b[key];let r;
    if(typeof av==="number"&&typeof bv==="number")r=(av||0)-(bv||0);else r=String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:"base"});
    return state.sortDir==="asc"?r:-r;
  });
  document.querySelectorAll(".sort-btn").forEach(b=>b.textContent=b.dataset.key===key?`${b.textContent.replace(/ [↑↓↕]/,"")} ${state.sortDir==="asc"?"↑":"↓"}`:b.textContent.replace(/ [↑↓↕]/," ↕"));
  state.page=1;renderStudents();
}

function pageCount(){return Math.max(1,Math.ceil(state.filtered.length/state.pageSize))}
function renderStudents(){
  const total=state.filtered.length,pages=pageCount();state.page=Math.min(state.page,pages);
  els.resultCount.textContent=`${total} student${total===1?"":"s"} found`;
  els.pagination.classList.toggle("hidden",!total);
  els.pageInfo.textContent=`Page ${state.page} of ${pages}`;els.prev.disabled=state.page<=1;els.next.disabled=state.page>=pages;
  if(!total){els.tableWrap.classList.add("hidden");els.mobileCards.innerHTML="";els.stateArea.innerHTML=`<div class="state"><h3>No students found</h3><p>Try another name, roll number, or performance filter.</p></div>`;return}
  els.stateArea.innerHTML="";els.tableWrap.classList.remove("hidden");
  const start=(state.page-1)*state.pageSize,vis=state.filtered.slice(start,start+state.pageSize);
  els.table.innerHTML=vis.map(s=>`<tr data-roll="${esc(s.rollNo)}"><td>${esc(s.srNo)}</td><td>${esc(s.rollNo)}</td><td>${esc(s.name)}</td><td>${fmt(s.tenth)}%</td><td>${fmt(s.twelfth)}%</td><td>${fmt(s.sem1)}</td><td>${fmt(s.sem2)}</td><td><span class="performance ${perf(s).cls}">${perf(s).label}</span></td></tr>`).join("");
  document.querySelectorAll("#studentTableBody tr").forEach(r=>r.addEventListener("click",()=>openStudent(r.dataset.roll)));
  els.mobileCards.innerHTML=vis.map(s=>`<article class="student-card" data-roll="${esc(s.rollNo)}"><div class="student-head"><div><div class="student-name">${esc(s.name)}</div><div class="roll">Roll No: ${esc(s.rollNo)}</div></div><div class="student-number">#${esc(s.srNo)}</div></div><div class="marks-grid"><div class="mark"><span class="mark-label">10th</span><span class="mark-value">${fmt(s.tenth)}%</span></div><div class="mark"><span class="mark-label">12th</span><span class="mark-value">${fmt(s.twelfth)}%</span></div><div class="mark"><span class="mark-label">Semester 1</span><span class="mark-value">${fmt(s.sem1)}</span></div><div class="mark"><span class="mark-label">Semester 2</span><span class="mark-value">${fmt(s.sem2)}</span></div></div><div style="margin-top:10px"><span class="performance ${perf(s).cls}">${perf(s).label} • ${fmt(semAvg(s))}</span></div></article>`).join("");
  document.querySelectorAll(".student-card").forEach(c=>c.addEventListener("click",()=>openStudent(c.dataset.roll)));
}

function drawCanvas(id,draw){
  const host=$(id); if(!host)return;
  // Keep the existing canvas IDs for compatibility, but render an SVG into the same
  // container. SVG scales cleanly on local file:// pages and high-DPI screens.
  const box=host.parentElement;
  if(!box)return;
  let svg=box.querySelector("svg.viz-svg");
  if(!svg){ svg=document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.classList.add("viz-svg"); host.hidden=true; box.appendChild(svg); }
  svg.innerHTML="";
  const rect=box.getBoundingClientRect();
  const w=Math.max(420,rect.width-34), h=Math.max(230,rect.height-8);
  svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
  svg.setAttribute("preserveAspectRatio","none");
  draw(svg,w,h);
}
function cssVar(name){return getComputedStyle(document.body).getPropertyValue(name).trim()}
function svgEl(tag,attrs,text){
  const n=document.createElementNS("http://www.w3.org/2000/svg",tag);
  Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));
  if(text!=null)n.textContent=text;
  return n;
}
function drawBars(svg,w,h,labels,sets,maxValue){
  const pad={l:64,r:26,t:24,b:58},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  const line=cssVar("--line"), muted=cssVar("--muted"), primary=cssVar("--primary");
  const grid=svgEl("g");
  for(let i=0;i<=4;i++){
    const y=pad.t+ch*i/4;
    grid.appendChild(svgEl("line",{x1:pad.l,y1:y,x2:w-pad.r,y2:y,stroke:line,"stroke-width":"1"}));
    grid.appendChild(svgEl("text",{x:pad.l-10,y:y+4,"text-anchor":"end",fill:muted,"font-size":"14","font-family":"DM Sans, sans-serif"},(maxValue*(1-i/4)).toFixed(maxValue<=10?1:0)));
  }
  svg.appendChild(grid);
  const groupW=cw/labels.length;
  const total=Math.min(70,groupW*.62);
  const barW=Math.max(12,Math.min(28,(total-(sets.length-1)*7)/sets.length));
  labels.forEach((lab,i)=>{
    const center=pad.l+i*groupW+groupW/2;
    sets.forEach((set,j)=>{
      const v=Number(set.values[i]||0);
      const bh=Math.max(v>0?3:0,(v/maxValue)*ch);
      const x=center-(barW*sets.length+(sets.length-1)*7)/2+j*(barW+7);
      const y=pad.t+ch-bh;
      svg.appendChild(svgEl("rect",{x,y,width:barW,height:bh,rx:7,fill:set.color||primary,opacity:"0.95"}));
      if(v>0){
        svg.appendChild(svgEl("text",{x:x+barW/2,y:Math.max(14,y-8),"text-anchor":"middle",fill:cssVar("--ink"),"font-size":"14","font-weight":"800","font-family":"DM Sans, sans-serif"},maxValue<=10?v.toFixed(2):v.toFixed(1)));
      }
    });
    svg.appendChild(svgEl("text",{x:center,y:h-14,"text-anchor":"middle",fill:muted,"font-size":"13","font-weight":"700","font-family":"DM Sans, sans-serif"},lab));
  });
}
function drawAllCharts(){
  if(!state.students.length)return;
  const s=state.students;
  const sem1=avg(s.map(x=>x.sem1))||0,sem2=avg(s.map(x=>x.sem2))||0;
  drawCanvas("semesterChart",(svg,w,h)=>drawBars(svg,w,h,["Sem 1","Sem 2"],[
    {values:[sem1,sem2],color:cssVar("--primary")}
  ],10));
  const a10=avg(s.map(x=>x.tenth))||0,a12=avg(s.map(x=>x.twelfth))||0;
  drawCanvas("backgroundChart",(svg,w,h)=>drawBars(svg,w,h,["10th","12th"],[
    {values:[a10,a12],color:cssVar("--blue")}
  ],100));
  const sorted=[...s].sort((a,b)=>(semAvg(b)||0)-(semAvg(a)||0));
  renderRanking(sorted.filter(x=>semAvg(x)!=null).slice(0,10));
  renderComparison("schoolChart",a10,a12);
  renderComparison("backgroundChart",a10,a12);
}
function buildAnalyticsCards(){
  const s=state.students,sem1=avg(s.map(x=>x.sem1)),sem2=avg(s.map(x=>x.sem2)),delta=(sem1!=null&&sem2!=null)?sem2-sem1:0;
  const top=[...s].sort((a,b)=>(semAvg(b)||0)-(semAvg(a)||0))[0];
  const needs=s.filter(x=>(semAvg(x)||0)<7).length;
  $("analyticsCards").innerHTML=[
    ["Semester movement",`${delta>=0?"+":""}${delta.toFixed(2)}`,`Average change from Sem 1 to Sem 2`],
    ["Top semester average",top?fmt(semAvg(top)):"—",top?top.name:"No data"],
    ["Attention required",needs,`${needs===1?"student":"students"} below 7.0 average`]
  ].map(x=>`<article class="analytics-card"><span>${x[0]}</span><strong>${x[1]}</strong><p>${esc(x[2])}</p></article>`).join("");
}

function openStudent(roll){
  const s=state.students.find(x=>x.rollNo===String(roll));if(!s)return;
  $("detailAvatar").textContent=(s.name.trim()[0]||"S").toUpperCase();
  $("detailTitle").textContent=s.name||"Unnamed Student";$("detailRoll").textContent=`Roll No: ${s.rollNo} • Serial No: ${s.srNo}`;
  $("detailGrid").innerHTML=[
    ["10th Percentage",fmt(s.tenth)+"%"],["12th Percentage",fmt(s.twelfth)+"%"],["Semester 1",fmt(s.sem1)],["Semester 2",fmt(s.sem2)]
  ].map(x=>`<div class="detail-cell"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");
  $("detailPerformance").textContent=`${perf(s).label} • ${fmt(semAvg(s))}`;
  els.modal.classList.remove("hidden");
}
function closeModal(){els.modal.classList.add("hidden")}
function showError(msg){els.tableWrap.classList.add("hidden");els.mobileCards.innerHTML="";els.stateArea.innerHTML=`<div class="state"><h3>Unable to load live records</h3><p>${esc(msg)}. Check the Apps Script deployment and try Refresh.</p></div>`}

function exportCSV(){
  if(!state.filtered.length)return;
  const rows=[["Sr No","Roll No","Student Name","10th","12th","Sem 1","Sem 2","Performance"],...state.filtered.map(s=>[s.srNo,s.rollNo,s.name,s.tenth,s.twelfth,s.sem1,s.sem2,perf(s).label])];
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="student-academic-records.csv";a.click();
}

function toggleTheme(){
  document.body.classList.toggle("dark");
  const dark=document.body.classList.contains("dark");
  const themeText=els.theme?.querySelector("span:last-child");
  if(themeText) themeText.textContent=dark?"Light Mode":"Dark Mode";
  if(els.topTheme) els.topTheme.textContent=dark?"☀":"☾";
  localStorage.setItem("zeal-theme",dark?"dark":"light");
  setTimeout(drawAllCharts,30);
}
window.addEventListener("resize",()=>{if(state.students.length)drawAllCharts()});

function renderRanking(records){
 const box=$("rankingChart").parentElement;
 box.classList.add("rank-chart");
 box.querySelectorAll(".rank-list").forEach(x=>x.remove());
 $("rankingChart").hidden=true;
 const list=document.createElement("div");list.className="rank-list";
 list.innerHTML=records.map((s,i)=>`<div class="rank-entry"><span class="rank-index">${String(i+1).padStart(2,"0")}</span><div class="rank-detail"><div><strong>${esc(s.name)}</strong><span>${fmt(semAvg(s))} / 10</span></div><div class="rank-track"><i style="width:${Math.min(100,Math.max(0,semAvg(s)*10))}%"></i></div></div></div>`).join("");
 box.appendChild(list);
}
function renderComparison(id,a,b){
 const box=$(id).parentElement;box.classList.add("comparison-box");
 box.querySelectorAll("svg,.comparison").forEach(x=>x.remove());$(id).hidden=true;
 const node=document.createElement("div");node.className="comparison";
 node.innerHTML=[["Class 10",a,"school-ten"],["Class 12",b,"school-twelve"]].map(([label,value,cls])=>`<div class="school-average ${cls}"><span>${label} · cohort average</span><strong>${fmt(value)}<small>%</small></strong><div class="school-track"><i style="width:${Math.min(100,Math.max(0,value||0))}%"></i></div></div>`).join("")+`<p class="comparison-note">${a!=null&&b!=null?`${Math.abs(b-a).toFixed(1)} percentage points ${b>=a?"higher":"lower"} in Class 12`:"Awaiting complete records"} · scale 0–100%</p>`;
 box.appendChild(node);
}
