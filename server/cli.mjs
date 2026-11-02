import { createStore, normalizeEmail } from './core.mjs';

const [, , command, emailInput] = process.argv;
const email = normalizeEmail(emailInput);
if (!email || !['bootstrap-admin','recover-account','revoke-pending'].includes(command)) {
  console.error('Uso: node server/cli.mjs bootstrap-admin|recover-account|revoke-pending email@dominio.com');
  process.exitCode = 2;
} else {
  const store = createStore(process.env.ZERA_DB_PATH || './runtime/zeraaps.sqlite', Number(process.env.ZERA_MAX_DOCTORS || 50));
  try {
    let result, fragment;
    if (command === 'revoke-pending') {
      store.revokeInvite(email);
      console.log('Convite pendente cancelado para:',email);
    } else {
      if (command === 'bootstrap-admin') {
        if (store.listUsers().some(u => u.role === 'admin' && u.active)) throw Error('ACTIVE_ADMIN_EXISTS');
        if (store.listPendingInvites().some(i => i.role === 'admin' && i.email !== email)) throw Error('OTHER_PENDING_ADMIN_INVITE');
        result = store.createInvite(email, 'admin');
        fragment = 'convite';
      } else {
        const user = store.listUsers().find(u => u.email === email && u.active);
        if (!user) throw Error('ACTIVE_ACCOUNT_NOT_FOUND');
        result = store.createReset(user.id);
        fragment = 'reset';
      }
      const origin = new URL(process.env.APP_ORIGIN || 'http://localhost:8787').origin;
      console.log('LINK PRIVADO de uso único:');
      console.log(origin + '/login#' + fragment + '=' + encodeURIComponent(result.token));
      console.log('Expiração: ' + new Date(result.expiresAt).toISOString());
      console.log('Entregue apenas ao titular. Não publique em GitHub, logs ou mensagens abertas.');
    }
  } catch (error) {
    console.error('Não foi possível emitir o link:', error.message);
    process.exitCode = 1;
  } finally {
    store.db.close();
  }
}
