const map = L.map('map', {zoomControl:false, preferCanvas:true, minZoom:5, maxZoom:18}).setView([-19.3,-44.0],6);
L.control.zoom({position:'bottomright'}).addTo(map);
const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'});
street.addTo(map);
const defs={
  limite:{url:'Dados/geoJSON/web/Limite_MG.geojson',name:'Limite estadual',color:'#ebf29c',weight:2.2,fillColor:'#ebf29c',fillOpacity:.28,kind:'polygon',group:null},
  hidro:{url:'Dados/geoJSON/web/Hidrografia_MG.geojson',name:'Hidrografia',color:'#00d9ff',weight:1.15,opacity:.9,kind:'line',group:null,detail:0},
  roads:{url:'Dados/geoJSON/web/Rodovias_MG.geojson',name:'Rodovias',color:'#ff38b6',weight:1.25,opacity:.9,kind:'line',group:null}
};
let toastTimer;
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800)}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function popup(feature, layer, title){const props=feature.properties||{};let rows=Object.entries(props).slice(0,18).map(([k,v])=>`<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v===null?'—':typeof v==='object'?JSON.stringify(v):v)}</td></tr>`).join('');layer.bindPopup(`<div class="popup-title">${escapeHtml(title)}</div><table class="popup-table">${rows||'<tr><td>Sem atributos disponíveis</td></tr>'}</table>`,{maxWidth:300})}
function styleFor(key){const d=defs[key],opacity=Number(document.getElementById('opacity').value)/100;return {color:d.color,weight:d.weight,opacity:opacity*(d.opacity||1),fillColor:d.fillColor,fillOpacity:d.fillOpacity===undefined?opacity*.13:d.fillOpacity*opacity}}
async function setLayer(key, enabled){const d=defs[key];if(!enabled){if(d.group)map.removeLayer(d.group);return}if(d.group){d.group.addTo(map);return}
  const input=document.getElementById(`toggle-${key}`);input.disabled=true;toast(`Carregando ${d.name.toLowerCase()}…`);let stage='download';
  try{const response=await fetch(d.url);if(!response.ok)throw Error(`HTTP ${response.status} ao ler ${d.url}`);stage='leitura do GeoJSON';d.data=await response.json();renderLayer(key);if(input.checked){d.group.addTo(map);toast(`${d.name}: ${d.data.features?.length?.toLocaleString('pt-BR')??'Dados'} feições disponíveis.`);document.getElementById('mapHint').style.display='none'}}catch(err){input.checked=false;toast(`Falha em ${d.name} (${stage}): ${err.message||err}`);console.error(err)}finally{input.disabled=false}}
function renderLayer(key){const d=defs[key];if(d.group)map.removeLayer(d.group);const options={style:()=>styleFor(key),onEachFeature:(f,l)=>popup(f,l,d.name),interactive:true};if(key==='hidro'){const zoom=map.getZoom();const minimumOrder=zoom>=9?1:zoom>=7?6:8;options.filter=f=>Number(f.properties?.nustrahler||0)>=minimumOrder;d.detail=minimumOrder}d.group=L.geoJSON(d.data,options);if(document.getElementById(`toggle-${key}`).checked)d.group.addTo(map)}
map.on('zoomend',()=>{const d=defs.hidro;if(d.data&&document.getElementById('toggle-hidro').checked){const zoom=map.getZoom(),level=zoom>=9?1:zoom>=7?6:8;if(level!==d.detail)renderLayer('hidro')}});
Object.keys(defs).forEach(k=>document.getElementById(`toggle-${k}`).addEventListener('change',e=>setLayer(k,e.target.checked)));
if(document.getElementById('toggle-limite').checked)setLayer('limite',true);
document.querySelectorAll('input[name="basemap"]').forEach(el=>el.addEventListener('change',e=>{map.removeLayer(street);map.removeLayer(satellite);(e.target.value==='street'?street:satellite).addTo(map)}));
document.getElementById('resetLayers').addEventListener('click',()=>{Object.keys(defs).forEach(k=>{const el=document.getElementById(`toggle-${k}`);el.checked=false;setLayer(k,false)})});
document.getElementById('home').addEventListener('click',()=>map.setView([-19.3,-44.0],6));
document.getElementById('locate').addEventListener('click',()=>map.locate({setView:true,maxZoom:13,enableHighAccuracy:true}));
map.on('locationfound',e=>{L.circleMarker(e.latlng,{radius:7,color:'#fff',weight:3,fillColor:'#267a5d',fillOpacity:1}).addTo(map).bindPopup('Sua localização aproximada').openPopup()});
map.on('locationerror',()=>toast('Não foi possível obter sua localização. Verifique a permissão do navegador.'));
document.getElementById('opacity').addEventListener('input',e=>{document.getElementById('opacityValue').value=`${e.target.value}%`;Object.entries(defs).forEach(([k,d])=>{if(d.group)d.group.setStyle(styleFor(k))})});
document.getElementById('fullscreen').addEventListener('click',()=>{const target=document.querySelector('.layout');if(!document.fullscreenElement)target.requestFullscreen?.();else document.exitFullscreen?.()});
document.getElementById('dismissHint').addEventListener('click',()=>document.getElementById('mapHint').style.display='none');
map.on('mousemove',e=>document.getElementById('coords').textContent=`Lat ${e.latlng.lat.toFixed(4)}° · Lon ${e.latlng.lng.toFixed(4)}°`);
L.control.scale({imperial:false,position:'bottomleft',maxWidth:110}).addTo(map);
