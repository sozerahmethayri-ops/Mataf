// Uygulama içi online harita: WebView içinde MapLibre GL JS + OpenFreeMap vektör karoları (OSM verisi, anahtarsız).
// Sayfa, uygulamadan `window.matafSet(durum)` ile noktaları/çizgileri alır; dokunuşları postMessage ile geri yollar.
export const MAPLIBRE_VERSION = '5.24.1';

export type OnlineMapTheme = { dark: boolean; bg: string; ink: string; user: string; building: string };

export function onlineMapHtml(th: OnlineMapTheme) {
  const cfg = JSON.stringify({
    dark: th.dark,
    ink: th.ink,
    halo: th.bg,
    user: th.user,
    building: th.building,
    style: `https://tiles.openfreemap.org/styles/${th.dark ? 'dark' : 'liberty'}`,
    cdns: [
      `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/`,
      `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/`,
    ],
  });
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body,#m{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:${th.bg}}
.maplibregl-ctrl-attrib{font:10px sans-serif}.maplibregl-ctrl-bottom-left{display:none}</style></head>
<body><div id="m"></div><script>
var CFG=${cfg};
var map=null,ready=false,state=null,lastFit=null,lastRecenter=0,threeD=null,lastLong=0;
function post(o){try{window.ReactNativeWebView.postMessage(JSON.stringify(o))}catch(e){}}
window.onerror=function(m){post({t:'log',m:String(m)})};
function fc(f){return{type:'FeatureCollection',features:f}}
function loadLib(i){
  if(i>=CFG.cdns.length){post({t:'error',m:'maplibre yüklenemedi'});return}
  var css=document.createElement('link');css.rel='stylesheet';css.href=CFG.cdns[i]+'maplibre-gl.css';document.head.appendChild(css);
  var s=document.createElement('script');s.src=CFG.cdns[i]+'maplibre-gl.js';
  s.onload=init;s.onerror=function(){css.remove();loadLib(i+1)};document.head.appendChild(s);
}
function init(){
  try{
    map=new maplibregl.Map({container:'m',style:CFG.style,center:[39.8262,21.4225],zoom:15,maxPitch:65,fadeDuration:0,
      attributionControl:{compact:true},dragRotate:true,pitchWithRotate:true,touchPitch:true});
  }catch(e){post({t:'error',m:'webgl: '+e.message});return}
  // Karo/kaynak isteği başarısız olursa (ör. ilk bağlantıda SSL kopması) MapLibre kendisi yeniden denemez:
  // kaynağı birkaç kez artan aralıkla yeniden yükle, yoksa harita boş kalır
  var retries=0,retryT=null;
  map.on('error',function(e){
    var m=(e&&e.error&&e.error.message)||'map error';post({t:'log',m:(e&&e.sourceId?e.sourceId+': ':'')+m});
    if(!ready&&!map.isStyleLoaded()&&!(e&&e.sourceId)){post({t:'error',m:m});return}
    if(e&&e.sourceId&&retries<5&&!retryT){
      var id=e.sourceId;
      retryT=setTimeout(function(){retryT=null;retries++;var src=map.getSource(id);
        try{if(src&&src.setUrl&&src.url)src.setUrl(src.url);else if(src&&src.setTiles&&src.tiles)src.setTiles(src.tiles);post({t:'log',m:'yeniden yüklendi: '+id})}catch(x){}
      },1500*(retries+1));
    }
  });
  map.on('load',function(){
    var src=map.getStyle().sources,vec=null;
    for(var k in src){if(src[k].type==='vector'){vec=k;break}}
    if(vec&&!map.getLayer('building-3d')){
      map.addLayer({id:'building-3d',type:'fill-extrusion',source:vec,'source-layer':'building',minzoom:14,
        paint:{'fill-extrusion-color':CFG.building,'fill-extrusion-height':['coalesce',['get','render_height'],6],
          'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':0.85}});
    }
    map.addSource('lines',{type:'geojson',data:fc([])});
    map.addSource('pins',{type:'geojson',data:fc([])});
    map.addSource('user',{type:'geojson',data:fc([])});
    var lay={'line-cap':'round','line-join':'round'};
    map.addLayer({id:'lines-case',type:'line',source:'lines',filter:['!',['get','d']],layout:lay,paint:{'line-color':'#ffffff','line-width':['+',['get','w'],3],'line-opacity':0.85}});
    map.addLayer({id:'lines',type:'line',source:'lines',filter:['!',['get','d']],layout:lay,paint:{'line-color':['get','c'],'line-width':['get','w']}});
    map.addLayer({id:'lines-dash',type:'line',source:'lines',filter:['get','d'],layout:lay,paint:{'line-color':['get','c'],'line-width':['get','w'],'line-dasharray':[0.1,2]}});
    map.addLayer({id:'pins-sel',type:'circle',source:'pins',filter:['get','s'],paint:{'circle-radius':19,'circle-color':['get','c'],'circle-opacity':0.2}});
    map.addLayer({id:'pins',type:'circle',source:'pins',paint:{'circle-radius':['case',['any',['get','b'],['get','s']],9,6.5],
      'circle-color':['get','c'],'circle-stroke-color':'#ffffff','circle-stroke-width':2}});
    map.addLayer({id:'pins-label',type:'symbol',source:'pins',filter:['all',['has','l'],['any',['get','s'],['get','b']]],
      layout:{'text-field':['get','l'],'text-font':['Noto Sans Bold'],'text-size':13,'text-offset':[0,-1.4],'text-anchor':'bottom','text-max-width':12},
      paint:{'text-color':CFG.ink,'text-halo-color':CFG.halo,'text-halo-width':1.8}});
    map.addLayer({id:'user-halo',type:'circle',source:'user',paint:{'circle-radius':17,'circle-color':CFG.user,'circle-opacity':0.18}});
    map.addLayer({id:'user',type:'circle',source:'user',paint:{'circle-radius':7,'circle-color':CFG.user,'circle-stroke-color':'#ffffff','circle-stroke-width':2.5}});
    ready=true;post({t:'ready'});if(state)apply(state,true);
    // Sekme sayfası (ViewPager) içinde WebView ilk anda 0 boyutla kurulabiliyor: birkaç kez boyutu yenile
    [250,900,2000].forEach(function(ms){setTimeout(function(){map.resize();map.triggerRepaint()},ms)});
  });
  map.on('click',function(e){
    var p=e.point,f=map.queryRenderedFeatures([[p.x-18,p.y-18],[p.x+18,p.y+18]],{layers:['pins']});
    if(f.length)post({t:'pin',id:f[0].properties.id});
  });
  var lt=null,p0=null;
  function clr(){if(lt){clearTimeout(lt);lt=null}}
  function long(ll){var n=Date.now();if(n-lastLong<900)return;lastLong=n;post({t:'long',lat:ll.lat,lng:ll.lng})}
  map.on('touchstart',function(e){clr();if(!e.originalEvent||e.originalEvent.touches.length!==1)return;p0=e.point;var ll=e.lngLat;lt=setTimeout(function(){lt=null;long(ll)},550)});
  map.on('touchmove',function(e){if(p0&&Math.hypot(e.point.x-p0.x,e.point.y-p0.y)>10)clr()});
  map.on('touchend',clr);map.on('touchcancel',clr);
  map.on('contextmenu',function(e){long(e.lngLat)});
}
function apply(st,first){
  state=st;if(!ready)return;
  map.getSource('lines').setData(fc((st.lines||[]).filter(function(l){return l.coords.length>1}).map(function(l){
    return{type:'Feature',properties:{c:l.color,w:l.width||5,d:!!l.dashed},geometry:{type:'LineString',coordinates:l.coords.map(function(p){return[p.lng,p.lat]})}}})));
  map.getSource('pins').setData(fc((st.pins||[]).map(function(p){
    var pr={id:p.id,c:p.color,b:!!p.big,s:p.id===st.selectedId};if(p.label)pr.l=p.label;
    return{type:'Feature',properties:pr,geometry:{type:'Point',coordinates:[p.lng,p.lat]}}})));
  map.getSource('user').setData(fc(st.user?[{type:'Feature',properties:{},geometry:{type:'Point',coordinates:[st.user.lng,st.user.lat]}}]:[]));
  if(first||st.fitKey!==lastFit){lastFit=st.fitKey;fit(st,!first)}
  if(st.threeD!==threeD){var was=threeD;threeD=st.threeD;map.easeTo({pitch:threeD?55:0,bearing:threeD?(was===null?-20:map.getBearing()):0,duration:was===null?0:600})}
  if(st.recenter&&st.recenter!==lastRecenter){lastRecenter=st.recenter;if(st.user)map.easeTo({center:[st.user.lng,st.user.lat],zoom:Math.max(map.getZoom(),16.5),duration:600})}
}
function fit(st,anim){
  var pts=[];
  (st.pins||[]).forEach(function(p){pts.push([p.lng,p.lat])});
  (st.lines||[]).forEach(function(l){l.coords.forEach(function(p){pts.push([p.lng,p.lat])})});
  if(st.fitUser&&st.user)pts.push([st.user.lng,st.user.lat]);
  if(!pts.length&&st.user)pts.push([st.user.lng,st.user.lat]);
  if(!pts.length&&st.center)pts.push([st.center.lng,st.center.lat]);
  if(!pts.length)return;
  var b=new maplibregl.LngLatBounds(pts[0],pts[0]);pts.forEach(function(p){b.extend(p)});
  var pad=st.padding||{top:40,bottom:40,left:40,right:40};
  var c=map.getContainer(),w=c.clientWidth,h=c.clientHeight;
  if(pad.top+pad.bottom>h-60){var k=(h-60)/(pad.top+pad.bottom);pad={top:pad.top*k,bottom:pad.bottom*k,left:pad.left,right:pad.right}}
  if(pad.left+pad.right>w-60){pad.left=20;pad.right=20}
  var sw=b.getSouthWest(),ne=b.getNorthEast();
  if(Math.abs(ne.lat-sw.lat)<0.002&&Math.abs(ne.lng-sw.lng)<0.002){map.easeTo({center:b.getCenter(),zoom:16.5,padding:pad,duration:anim?600:0});return}
  map.fitBounds(b,{padding:pad,maxZoom:17.5,duration:anim?600:0});
}
window.matafSet=function(st){var first=state===null;apply(st,first)};
window.matafWake=function(){if(map){map.resize();map.triggerRepaint()}};
window.addEventListener('resize',function(){if(map)map.resize()});
loadLib(0);
</script></body></html>`;
}
