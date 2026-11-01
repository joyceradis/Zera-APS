import { createStore,normalizeEmail } from './core.mjs';
const [, , command,emailRaw]=process.argv;
if(command!=='bootstrap-admin'||!normalizeEmail(emailRaw)){
  console.error('Uso: node server/cli.mjs bootstrap-admin email@dominio.com');process.exitCode=2;
}else{
  const store=createStore(process.env.ZERA_DB_PATH||'./runtime/zeraaps.sqlite',Number(process.env.ZERA_MAX_DOCTORS||50));
  try{
    if(store.listUsers().some(u=>u.role==='admin'&&u.active))throw new Error('ADMIN_ALREADY_EXISTS');
    const invite=store.createInvite(emailRaw,'admin');
    const origin=process.env.APP_ORIGIN||'http://localhost:8787';
    console.log('Convite de administrador (uso único, 48h):');
    console.log(origin+'/login#convite='+encodeURIComponent(invite.token));
    console.log('Guarde o convite em local privado; nunca publique em issue, repositório, logs ou chats compartilhados.');
  }catch(err){console.error('Falha:',err.message);process.exitCode=1;}
  finally{store.db.close();}
}