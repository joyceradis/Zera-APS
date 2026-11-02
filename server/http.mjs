import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createStore, cookieName, normalizeEmail } from './core.mjs';

const media={'/styles.css':'text/css; charset=utf-8','/app.js':'text/javascript; charset=utf-8','/data/regras.js':'text/javascript; charset=utf-8','/client-auth.js':'text/javascript; charset=utf-8','/login.js':'text/javascript; charset=utf-8','/login.css':'text/css; charset=utf-8'};
const isMatch=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&a===b;

export function createApp({root=resolve(import.meta.dirname,'..'),filename='./runtime/zeraaps.sqlite',origin='http://localhost:8787',maxDoctors=50}={}){
  const expected=new URL(origin);
  const publicOrigin=expected.origin;
  if(!['http:','https:'].includes(expected.protocol)||expected.pathname!=='/'||expected.search||expected.hash)throw new Error('Invalid APP_ORIGIN');
  if(process.env.NODE_ENV==='production'&&expected.protocol!=='https:')throw new Error('Production requires HTTPS APP_ORIGIN');
  if(expected.protocol==='http:'&&!['localhost','127.0.0.1','::1'].includes(expected.hostname))throw new Error('HTTP allowed only for local development');
  const store=createStore(filename,maxDoctors);
  const csrfHeader='x-csrf-token';
  const secure=expected.protocol==='https:';
  const cookiespec=`${cookieName}=`;
  const cookieAttrs=`Path=/; HttpOnly; SameSite=Strict; ${secure?'Secure; ':''}Max-Age=28800`;
  const mimeHeader={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
  const encoded=(res,status,payload)=>{res.writeHead(status,mimeHeader);res.end(JSON.stringify(payload));};
  const fail=(res,status,message)=>encoded(res,status,{error:message});
  const tokenFrom=req=>{
    const cookie=req.headers.cookie||'';
    const match=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookiespec));
    return match?match.slice(cookiespec.length):null;
  };
  const respondFile=(res,path,status=200)=>{
    const types={'/index.html':'text/html; charset=utf-8','/login.html':'text/html; charset=utf-8',...media};
    if(!(path in types))return fail(res,404,'NOT_FOUND');
    try{res.writeHead(status,{'Content-Type':types[path], 'Cache-Control':path.endsWith('.html')?'no-store':'public, max-age=120'});res.end(readFileSync(resolve(root,'.'+path)));}
    catch{fail(res,500,'ASSET_UNAVAILABLE');}
  };
  const receive=async(req)=>{
    const totalMax=16384;let length=0;const chunks=[];
    for await(const chunk of req){length+=chunk.length;if(length>totalMax)throw new Error('BODY_TOO_LARGE');chunks.push(chunk);}
    if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))throw new Error('UNSUPPORTED_MEDIA_TYPE');
    try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body;}
    catch{throw new Error('INVALID_JSON');}
  };
  const validRole=r=>['doctor','editor','admin'].includes(r);
  const logAuth=res=>fail(res,401,'AUTH_REQUIRED');
  const handler=async(req,res)=>{
    const path=new URL(req.url,'http://internal').pathname;
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Cross-Origin-Opener-Policy','same-origin');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    if(secure)res.setHeader('Strict-Transport-Security','max-age=31536000');
    if(req.headers.host!==expected.host)return fail(res,400,'INVALID_HOST');
    if(!['GET','POST','PUT'].includes(req.method))return fail(res,405,'METHOD_NOT_ALLOWED');
    if(req.method!=='GET' && (req.headers.origin!==publicOrigin || req.headers['sec-fetch-site']==='cross-site'))return fail(res,403,'INVALID_ORIGIN');
    if(path==='/healthz'&&req.method==='GET')return encoded(res,200,{ok:true});
    if(path==='/login'&&req.method==='GET')return respondFile(res,'/login.html');
    if((path==='/login.js'||path==='/login.css')&&req.method==='GET')return respondFile(res,path);
    if(path==='/styles.css'&&req.method==='GET')return respondFile(res,path);
    const rawToken=tokenFrom(req), session=store.readSession(rawToken);
    if(path==='/api/login'&&req.method==='POST'){
      try{
        const b=await receive(req);
        const result=store.authenticate(b.email,b.password,req.socket.remoteAddress);
        if(result.status==='limited')return fail(res,429,'TOO_MANY_ATTEMPTS');
        if(result.status!=='ok')return fail(res,401,'INVALID_CREDENTIALS');
        if(rawToken)store.revoke(rawToken);
        const created=store.sessionFor(result.user.id);
        res.setHeader('Set-Cookie',`${cookieName}=${created.token}; ${cookieAttrs}`);
        return encoded(res,200,{ok:true,csrf:created.csrf,user:result.user});
      }catch(err){return fail(res,err.message==='BODY_TOO_LARGE'?413:400,'INVALID_REQUEST');}
    }
    if(path==='/api/invite/accept'&&req.method==='POST'){
      try{
        const b=await receive(req);
        const user=store.redeemInvite(b.token,b.email,b.password);
        if(rawToken)store.revoke(rawToken);
        const created=store.sessionFor(user.id);
        res.setHeader('Set-Cookie',`${cookieName}=${created.token}; ${cookieAttrs}`);
        return encoded(res,201,{ok:true,csrf:created.csrf,user});
      }catch{return fail(res,400,'INVITE_INVALID_OR_EXPIRED');}
    }
    if(path==='/api/reset/accept'&&req.method==='POST'){
      try{
        const b=await receive(req);
        const user=store.redeemReset(b.token,b.email,b.password);
        if(rawToken)store.revoke(rawToken);
        const created=store.sessionFor(user.id);
        res.setHeader('Set-Cookie',`${cookieName}=${created.token}; ${cookieAttrs}`);
        return encoded(res,200,{ok:true,csrf:created.csrf,user});
      }catch{return fail(res,400,'RESET_INVALID_OR_EXPIRED');}
    }
    if(path==='/'||path==='/index.html'){
      if(!session){res.writeHead(303,{Location:'/login','Cache-Control':'no-store'});return res.end();}
      if(req.method!=='GET')return fail(res,405,'METHOD_NOT_ALLOWED');
      return respondFile(res,'/index.html');
    }
    if(path==='/api/session'&&req.method==='GET'){
      if(!session)return logAuth(res);
      return encoded(res,200,{user:session.user,csrf:session.csrf,expiresAt:session.expiresAt});
    }
    if(path==='/api/logout'&&req.method==='POST'){
      if(!session)return logAuth(res);
      if(!isMatch(req.headers[csrfHeader],session.csrf))return fail(res,403,'INVALID_CSRF');
      store.revoke(rawToken);
      res.setHeader('Set-Cookie',`${cookieName}=; Path=/; HttpOnly; SameSite=Strict; ${secure?'Secure; ':''}Max-Age=0`);
      return encoded(res,200,{ok:true});
    }
    if(path in media && req.method==='GET'){
      if(!session)return logAuth(res);
      return respondFile(res,path);
    }
    if(path.startsWith('/api/')){
      if(!session)return logAuth(res);
      const me=session.user;
      if(req.method!=='GET' && !isMatch(req.headers[csrfHeader],session.csrf))return fail(res,403,'INVALID_CSRF');
      if(path==='/api/bookmarks'&&req.method==='GET')return encoded(res,200,{rules:store.getBookmarks(me.id)});
      if(path==='/api/bookmarks'&&req.method==='PUT'){
        try{
          const b=await receive(req);
          if(typeof b.ruleId!=='string'||b.ruleId.length>40||!/^[-A-Z0-9]+$/.test(b.ruleId)||typeof b.enabled!=='boolean')throw Error();
          const source=JSON.parse(readFileSync(resolve(root,'data/regras-aps-2026.json'),'utf8'));
          if(!source.cards.some(c=>c.rules.some(r=>r.id===b.ruleId)))throw Error();
          store.setBookmark(me.id,b.ruleId,b.enabled);
          return encoded(res,200,{rules:store.getBookmarks(me.id)});
        }catch{return fail(res,400,'INVALID_BOOKMARK');}
      }
      if(me.role!=='admin')return fail(res,403,'FORBIDDEN');
      if(path==='/api/team'&&req.method==='GET')return encoded(res,200,{users:store.listUsers(),capacity:store.countSeats(),pendingInvites:store.listPendingInvites()});
      if(path==='/api/invites'&&req.method==='POST'){
        try{
          const b=await receive(req);
          if(!validRole(b.role))throw Error();
          const invite=store.createInvite(b.email,b.role,me.id);
          return encoded(res,201,{email:invite.email,role:invite.role,expiresAt:invite.expiresAt,link:publicOrigin+'/login#convite='+encodeURIComponent(invite.token)});
        }catch(err){return fail(res,400,err.message==='SEATS_FULL'?'SEATS_FULL':'INVITE_NOT_CREATED');}
      }
      if(path==='/api/invites/revoke'&&req.method==='POST'){
        try{
          const b=await receive(req);
          store.revokeInvite(b.email);
          return encoded(res,200,{ok:true});
        }catch{return fail(res,400,'INVITE_NOT_REVOKED');}
      }
      if(path==='/api/team/reset'&&req.method==='POST'){
        try{
          const b=await receive(req);
          if(typeof b.userId!=='string'||b.userId.length>128)throw Error();
          const reset=store.createReset(b.userId,me.id);
          return encoded(res,201,{email:reset.email,expiresAt:reset.expiresAt,link:publicOrigin+'/login#reset='+encodeURIComponent(reset.token)});
        }catch{return fail(res,400,'RESET_NOT_CREATED');}
      }
      if(path==='/api/team/disable'&&req.method==='POST'){
        try{
          const b=await receive(req);
          if(typeof b.userId!=='string'||b.userId===me.id)throw Error();
          store.disableUser(b.userId);
          return encoded(res,200,{ok:true});
        }catch(err){return fail(res,400,err.message==='LAST_ADMIN'?'LAST_ADMIN':'USER_NOT_DISABLED');}
      }
    }
    return fail(res,404,'NOT_FOUND');
  };
  const server=createServer((req,res)=>{handler(req,res).catch(()=>{if(!res.headersSent)fail(res,500,'INTERNAL_ERROR');else res.destroy();});});
  return {server,store};
}