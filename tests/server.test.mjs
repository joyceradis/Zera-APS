import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/http.mjs';
import {createStore,passwordHash,passwordMatch} from '../server/core.mjs';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const mail=i=>`doctor${i}@example.test`;
test('password hashing and validation',()=>{
 const hash=passwordHash('long and unique passphrase');
 assert.equal(passwordMatch('long and unique passphrase',hash),true);
 assert.equal(passwordMatch('another wrong passphrase',hash),false);
 assert.throws(()=>passwordHash('short'));
});
test('stores, seat limits, invite replay and isolation',()=>{
 const s=createStore(':memory:',2);
 const a=s.createInvite(mail(1),'doctor');
 const b=s.createInvite(mail(2),'doctor');
 assert.equal(s.countSeats().free,0);
 assert.throws(()=>s.createInvite(mail(3),'doctor'),/SEATS_FULL/);
 const u=s.redeemInvite(a.token,mail(1),'long-secret-phrase1');
 assert.throws(()=>s.redeemInvite(a.token,mail(1),'long-secret-phrase1'));
 assert.equal(s.authenticate(mail(1),'long-secret-phrase1','local').status,'ok');
 assert.equal(s.authenticate(mail(1),'wrong','local').status,'invalid');
 const token=s.sessionFor(u.id);
 assert.equal(s.readSession(token.token).user.id,u.id);
 s.setBookmark(u.id,'C5-A',true);assert.deepEqual(s.getBookmarks(u.id),['C5-A']);
 s.revoke(token.token);assert.equal(s.readSession(token.token),null);
 assert.equal(s.countSeats().active,1);
 const recovery=s.createReset(u.id);
 const expiredSession=s.sessionFor(u.id);
 const recovered=s.redeemReset(recovery.token,mail(1),'even-stronger-reset-password');
 assert.equal(recovered.id,u.id);
 assert.equal(s.readSession(expiredSession.token),null);
 assert.equal(s.authenticate(mail(1),'long-secret-phrase1','local').status,'invalid');
 assert.equal(s.authenticate(mail(1),'even-stronger-reset-password','local').status,'ok');
 assert.throws(()=>s.redeemReset(recovery.token,mail(1),'even-stronger-reset-password'));
 s.db.close();
});
test('HTTP sessions, csrf, origin, role access, 50 seat concept and disable',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'zera-http-'));
 mkdirSync(join(dir,'data'));writeFileSync(join(dir,'index.html'),'INDEX PRIVATE');
 writeFileSync(join(dir,'login.html'),'LOGIN PUBLIC');
 writeFileSync(join(dir,'styles.css'),'CSS');
 writeFileSync(join(dir,'data/regras-aps-2026.json'),JSON.stringify({cards:[{rules:[{id:'C5-A'}]}]}));
 const {server,store}=createApp({root:dir,filename:':memory:',origin:'http://127.0.0.1:8787',maxDoctors:2});
 await new Promise(resolve=>server.listen(8787,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:8787';
 const request=(path,method='GET',body,csrf,cookie,custom={})=>fetch('http://127.0.0.1:8787'+path,{method,redirect:'manual',headers:{...(method!=='GET'?{origin,'content-type':'application/json'}:{}),...(csrf?{'x-csrf-token':csrf}:{}),...(cookie?{cookie}:{}),...custom},body:body?JSON.stringify(body):undefined});
 try{
  assert.equal((await request('/')).status,303);
  assert.equal((await request('/login')).status,200);
  const bootstrap=store.createInvite('root@example.test','admin');
  const register=await request('/api/invite/accept','POST',{token:bootstrap.token,email:'root@example.test',password:'admin-secret-phrase!'});
  assert.equal(register.status,201);const cookie=register.headers.get('set-cookie').split(';')[0];
  assert.match(register.headers.get('set-cookie'),/HttpOnly/);
  assert.match(register.headers.get('set-cookie'),/SameSite=Strict/);
  const me=await request('/api/session','GET',null,null,cookie);assert.equal(me.status,200);
  const csrf=(await me.json()).csrf;
  assert.equal((await request('/api/invites','POST',{email:mail(1),role:'doctor'},'bad',cookie)).status,403);
  assert.equal((await request('/api/invites','POST',{email:mail(1),role:'doctor'},csrf,cookie,{origin:'https://evil.test'})).status,403);
  const created=await request('/api/invites','POST',{email:mail(1),role:'doctor'},csrf,cookie);
  assert.equal(created.status,201);const invite=(await created.json()).link.split('#convite=')[1];
  assert.ok(invite);const created2=await request('/api/invites','POST',{email:mail(2),role:'doctor'},csrf,cookie);assert.equal(created2.status,201);
  assert.equal((await request('/api/invites','POST',{email:mail(3),role:'doctor'},csrf,cookie)).status,400);
  const doctor=await request('/api/invite/accept','POST',{token:invite,email:mail(1),password:'doctor-strong-password!!'});
  assert.equal(doctor.status,201);const docCookie=doctor.headers.get('set-cookie').split(';')[0],docCsrf=(await doctor.json()).csrf;
  assert.equal((await request('/api/team','GET',null,null,docCookie)).status,403);
  assert.equal((await request('/api/bookmarks','PUT',{ruleId:'C5-A',enabled:true},docCsrf,docCookie)).status,200);
  const books=await request('/api/bookmarks','GET',null,null,docCookie);assert.deepEqual((await books.json()).rules,['C5-A']);
  const adminBooks=await request('/api/bookmarks','GET',null,null,cookie);assert.deepEqual((await adminBooks.json()).rules,[]);
  assert.equal((await request('/api/logout','POST',{},docCsrf,docCookie)).status,200);
  assert.equal((await request('/api/session','GET',null,null,docCookie)).status,401);
  assert.equal((await request('/')).status,303);
  assert.equal((await request('/','GET',null,null,cookie)).status,200);
  assert.equal((await request('/api/team','GET',null,null,cookie)).status,200);
  const docUser=store.listUsers().find(u=>u.email===mail(1));
  const resetRequest=await request('/api/team/reset','POST',{userId:docUser.id},csrf,cookie);
  assert.equal(resetRequest.status,201);
  const resetToken=(await resetRequest.json()).link.split('#reset=')[1];
  assert.ok(resetToken);
  const resetResult=await request('/api/reset/accept','POST',{token:resetToken,email:mail(1),password:'new-reset-unique-password!'});
  assert.equal(resetResult.status,200);
  const resetCookie=resetResult.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/session','GET',null,null,resetCookie)).status,200);
  assert.equal((await request('/api/reset/accept','POST',{token:resetToken,email:mail(1),password:'another-password-reset!'})).status,400);
 }finally{await new Promise(resolve=>server.close(resolve));store.db.close();rmSync(dir,{recursive:true,force:true});}
});

test('50 isolated physician accounts and concurrent HTTP session reads',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'zera-load-'));
 writeFileSync(join(dir,'index.html'),'PROTECTED');
 const {server,store}=createApp({root:dir,filename:':memory:',origin:'http://127.0.0.1:8799',maxDoctors:50});
 await new Promise(resolve=>server.listen(8799,'127.0.0.1',resolve));
 try{
   const cookies=[];
   for(let i=0;i<50;i++){
     const email=mail(i);
     const inv=store.createInvite(email,'doctor');
     const doctor=store.redeemInvite(inv.token,email,'passphrase-very-strong-'+i);
     cookies.push({email,cookie:'zera_session='+store.sessionFor(doctor.id).token});
   }
   const seats=store.countSeats();
   assert.equal(seats.active,50);assert.equal(seats.pending,0);assert.equal(seats.free,0);
   assert.throws(()=>store.createInvite('extra@example.test','doctor'),/SEATS_FULL/);
   const started=performance.now();
   const results=await Promise.all(cookies.map(async ({email,cookie})=>{
     const response=await fetch('http://127.0.0.1:8799/api/session',{headers:{cookie},cache:'no-store'});
     const body=await response.json();
     return {status:response.status,match:body.user?.email===email};
   }));
   assert.equal(results.filter(r=>r.status===200&&r.match).length,50);
   console.log('Local concurrent 50-session exercise:',Math.round(performance.now()-started),'ms (not a production load benchmark)');
 }finally{await new Promise(resolve=>server.close(resolve));store.db.close();rmSync(dir,{recursive:true,force:true});}
});