// ProSite managed Windows WordPress runtime. No Docker or user-installed WordPress.
// Bundled binaries/core must be prepared by the GitHub Windows build workflow.
const {spawn}=require('child_process');
const fs=require('fs/promises');
const path=require('path');
const net=require('net');
const {app}=require('electron');
const JSZip=require('jszip');
const instances=new Map();
const safe=s=>String(s).replace(/[^a-z0-9_-]/gi,'-').slice(0,65);
const bundle=()=>app.isPackaged?path.join(process.resourcesPath,'runtime-bundle'):path.join(__dirname,'..','runtime-bundle');
const php=()=>path.join(bundle(),'php','php.exe');
const wp=()=>path.join(bundle(),'wordpress');
const sqlite=()=>path.join(bundle(),'sqlite-database-integration');
async function status(){try{await Promise.all([fs.access(php()),fs.access(path.join(wp(),'wp-load.php')),fs.access(path.join(sqlite(),'load.php'))]);return {ready:true,version:'Bundled PHP + WordPress + SQLite'};}catch{return {ready:false,error:'Local runtime assets are missing. Build with GitHub Actions (Windows installer), which packages PHP, WordPress and SQLite. See README.'};}}
function invoke(binary,args,options={}){return new Promise((resolve,reject)=>{const child=spawn(binary,args,{windowsHide:true,...options});let stdout='',stderr='';child.stdout?.on('data',d=>stdout+=d.toString());child.stderr?.on('data',d=>stderr+=d.toString());const timer=setTimeout(()=>{child.kill();reject(Error('Local WordPress command timed out'))},90000);child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(Error((stderr||stdout||'PHP failed, exit '+code).slice(0,1500)))});});}
async function copyTree(from,to){await fs.cp(from,to,{recursive:true,force:true});}
async function unzipPlugin(zipPath,destination){const zip=await JSZip.loadAsync(await fs.readFile(zipPath),{checkCRC32:true});const entries=Object.values(zip.files);if(entries.length>3000)throw Error('Plugin ZIP contains too many files');let total=0;for(const entry of entries){if(entry.dir)continue;const n=entry.name;if(n.includes('..')||n.startsWith('/')||n.includes('\\')||n.includes(':'))throw Error('Unsafe ZIP path');total+=entry._data?.uncompressedSize||0;if(total>100*1024*1024)throw Error('Plugin ZIP is too large when extracted');const dest=path.resolve(destination,n);if(!dest.startsWith(path.resolve(destination)+path.sep))throw Error('Unsafe ZIP entry');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,await entry.async('nodebuffer'));}}
async function port(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function ready(url,child){for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error('Local PHP server exited unexpectedly');try{const response=await fetch(url,{signal:AbortSignal.timeout(1500)});if(response.status<500)return;}catch{}await new Promise(r=>setTimeout(r,450));}throw Error('WordPress preview did not start');}
async function start(project,zipPath){const id=safe(project.id);if(instances.has(id))return {url:instances.get(id).url};const state=await status();if(!state.ready)throw Error(state.error);
const root=path.join(app.getPath('userData'),'previews',id,'wordpress');await fs.mkdir(root,{recursive:true});
if(!(await fs.stat(path.join(root,'wp-load.php')).catch(()=>null)))await copyTree(wp(),root);
const pluginDir=path.join(root,'wp-content','plugins');await fs.mkdir(pluginDir,{recursive:true});
// Do not execute arbitrary ZIP PHP with unrestricted access to sensitive files.
// WARNING: this managed local runtime is NOT a strong security sandbox.
await unzipPlugin(zipPath,pluginDir);
const integration=path.join(pluginDir,'sqlite-database-integration');await copyTree(sqlite(),integration);
const content=path.join(root,'wp-content');await fs.mkdir(path.join(content,'database'),{recursive:true});
await fs.copyFile(path.join(integration,'db.copy'),path.join(content,'db.php'));
const config=path.join(root,'wp-config.php');
if(!(await fs.stat(config).catch(()=>null))){await fs.writeFile(config,`<?php\ndefine('DB_NAME','prosite_preview');\ndefine('DB_USER','');\ndefine('DB_PASSWORD','');\ndefine('DB_HOST','localhost');\ndefine('DB_CHARSET','utf8');\ndefine('DB_COLLATE','');\ndefine('AUTH_KEY','${require('crypto').randomBytes(32).toString('hex')}');\ndefine('SECURE_AUTH_KEY','${require('crypto').randomBytes(32).toString('hex')}');\ndefine('LOGGED_IN_KEY','${require('crypto').randomBytes(32).toString('hex')}');\ndefine('NONCE_KEY','${require('crypto').randomBytes(32).toString('hex')}');\n$table_prefix='wp_';\ndefine('WP_DEBUG',false);\nif(!defined('ABSPATH'))define('ABSPATH',__DIR__.'/');\nrequire_once ABSPATH.'wp-settings.php';\n`);}
const p=await port(),url='http://127.0.0.1:'+p+'/';
const env={...process.env,PHP_INI_SCAN_DIR:path.join(bundle(),'php')};
await invoke(php(),['-c',path.join(bundle(),'php','php.ini'),path.join(__dirname,'bootstrap.php'),root,root,url],{cwd:root,env});
const child=spawn(php(),['-c',path.join(bundle(),'php','php.ini'),'-S','127.0.0.1:'+p,'-t',root],{cwd:root,env,windowsHide:true,stdio:'ignore'});
child.once('error',()=>{});instances.set(id,{url,child});
try{await ready(url,child);return {url};}catch(e){await stop(id);throw e;}}
async function stop(id){const i=instances.get(safe(id));if(i){i.child.kill();instances.delete(safe(id));}return true;}
async function stopAll(){for(const id of [...instances.keys()])await stop(id)}
module.exports={start,stop,status,stopAll};
