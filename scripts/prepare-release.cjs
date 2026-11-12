const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const textFiles=['index.html','core.js','data.js','app.js','speech.js','packs.js','sessions.js','alternatives.js','therapy.js','feelings.js','emotion-table-data.js','emotion-table.js','emotion-table.css','preferences.js','learning-media.js','audio-index.js','offline.js','style.css','manifest.webmanifest','icon.svg'];
const assets=['assets/emotions.jpg','assets/audio-manifest.json',...fs.readdirSync(path.join(root,'assets/audio')).filter(f=>f.endsWith('.mp3')).sort().map(f=>'assets/audio/'+f)];
const files=[...textFiles,...assets];
const hash=crypto.createHash('sha256');
for(const file of [...files,'sw.js']){
 let content=fs.readFileSync(path.join(root,file));
 if(file==='sw.js')content=Buffer.from(content.toString().replace(/const VERSION='[^']+';/,"const VERSION='';").replace(/const FILES=.*?;/,"const FILES=[];"));
 hash.update(file);hash.update(content);
}
const version=hash.digest('hex').slice(0,16);
fs.writeFileSync(path.join(root,'release.js'),"/* Generated release identity. */\nconst APP_RELEASE='"+version+"';\n");
const cacheFiles=['./',...files,'release.js'];
const sw=path.join(root,'sw.js');
fs.writeFileSync(sw,fs.readFileSync(sw,'utf8').replace(/const VERSION='[^']+';/,"const VERSION='"+version+"';").replace(/const FILES=.*?;/,'const FILES='+JSON.stringify(cacheFiles)+';'));
fs.mkdirSync(path.join(root,'vorschau'),{recursive:true});
for(const file of [...textFiles,'release.js','sw.js']){
 let content=fs.readFileSync(path.join(root,file),'utf8').replaceAll('wesentlich_','wesentlich_preview_');
 if(file==='data.js')content=content.replace('async function api(token, url, options = {}) {','async function api(token, url, options = {}) { throw new Error("Cloud-Sync ist in dieser Vorschau ausgeschaltet.");');
 if(file==='index.html'){content=content.replace('<body>','<body><aside class="preview-banner">Vorschau · Eigene Testdaten, Cloud-Sync ausgeschaltet.</aside>');content=content.replace('id="tab-sync"','style="display:none" id="tab-sync"');}
 fs.writeFileSync(path.join(root,'vorschau',file),content);
}
for(const file of assets){const target=path.join(root,'vorschau',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
console.log('Release '+version+' und isolierte Vorschau vorbereitet; '+assets.length+' lokale Medien.');
