let offlineRegistration=null;
document.getElementById('app-version').textContent='Version '+APP_RELEASE.slice(0,8);
function applyUpdate(){
  if(offlineRegistration?.waiting){saveRoundDraft();offlineRegistration.waiting.postMessage('ACTIVATE');}
}
async function initOffline(){
  const label=document.getElementById('offline-status');
  if(!('serviceWorker' in navigator)){label.textContent='Offline-Neustart wird von diesem Browser nicht unterstützt.';return;}
  try{
    let refreshed=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshed){refreshed=true;location.reload();}});
    offlineRegistration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    const offer=()=>{if(offlineRegistration.waiting)document.getElementById('update-notice').classList.remove('hidden');};
    offer();offlineRegistration.addEventListener('updatefound',()=>{
      const worker=offlineRegistration.installing;
      worker?.addEventListener('statechange',()=>{if(worker.state==='installed')offer();});
    });
    await navigator.serviceWorker.ready;label.textContent='Für Offline-Nutzung bereit.';
  }catch{label.textContent='Offline-Vorbereitung fehlgeschlagen. Bitte online erneut öffnen.';}
}
initOffline();
