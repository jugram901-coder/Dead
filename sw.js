/* DeadPlayer service worker — "we miss you" reminders */
const DB="dp",ST="f",DAY=864e5;
const MSG=["We miss you 🖤 Your music is waiting.","It's been a while — press play and pick up where you left off.","Your playlists are getting lonely. Come back and listen."];
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(ST);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const get=async k=>{const d=await open();return new Promise(r=>{const q=d.transaction(ST).objectStore(ST).get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r()})};
const put=async(k,v)=>{const d=await open();return new Promise(r=>{const q=d.transaction(ST,"readwrite").objectStore(ST).put(v,k);q.onsuccess=()=>r();q.onerror=()=>r()})};
async function check(){
  const cfg=await get("remind"),last=await get("lastVisit"),notified=(await get("notified"))||0;
  if(!cfg||!cfg.on||!last)return;
  const now=Date.now(),away=(cfg.days||7)*DAY;
  if(now-last<away||now-notified<away)return;           // not away long enough, or already reminded this period
  await self.registration.showNotification(cfg.name?"Hey "+cfg.name:"DeadPlayer",{
    body:MSG[Math.floor(now/DAY)%MSG.length],icon:"icon-192.png",badge:"icon-192.png",tag:"dp-miss-you"});
  await put("notified",now);
}
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("periodicsync",e=>{if(e.tag==="dp-miss-you")e.waitUntil(check())});
self.addEventListener("notificationclick",e=>{e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus"in c)return c.focus()}return clients.openWindow("./")}))});
