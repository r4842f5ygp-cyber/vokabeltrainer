const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['index.html','core.js','data.js','app.js','packs.js','sessions.js','alternatives.js','offline.js','style.css','manifest.webmanifest','icon.svg'];
const version=crypto.createHash('sha256').update(files.map(f=>fs.readFileSync(path.join(root,f))).join('')).digest('hex').slice(0,16);
const sw=path.join(root,'sw.js');fs.writeFileSync(sw,fs.readFileSync(sw,'utf8').replace(/const VERSION='[^']+';/,"const VERSION='"+version+"';"));
// Isolated preview uses identical features, separate data, no cloud requests.
fs.mkdirSync(path.join(root,'vorschau'),{recursive:true});
for(const f of [...files,'sw.js']){
 let content=fs.readFileSync(path.join(root,f),'utf8').replaceAll('wesentlich_','wesentlich_preview_');
 if(f==='data.js')content=content.replace('async function api(token, url, options = {}) {','async function api(token, url, options = {}) { throw new Error("Cloud-Sync ist in dieser Vorschau ausgeschaltet.");');
 if(f==='index.html'){content=content.replace('<body>','<body><aside class="preview-banner">Vorschau · Eigene Testdaten, Cloud-Sync ausgeschaltet.</aside>');content=content.replace('id="tab-sync"','style="display:none" id="tab-sync"');}
 fs.writeFileSync(path.join(root,'vorschau',f),content);
}
console.log('Release '+version+' und isolierte Vorschau vorbereitet.');
