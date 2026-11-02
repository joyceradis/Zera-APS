/** Backup consistente do SQLite. Execução manual e local; não contrata serviços. */
import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, lstatSync, mkdirSync, chmodSync, unlinkSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

const dbPath=resolve(process.env.ZERA_DB_PATH || './runtime/zeraaps.sqlite');
const backupDir=resolve(process.env.ZERA_BACKUP_DIR || './backups');
const name='zera-aps-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite';
const target=resolve(process.argv[2] || join(backupDir,name));
process.umask(0o077);
let source;
let mayRemoveTarget=false;
try {
  if(!existsSync(dbPath)||!lstatSync(dbPath).isFile()||lstatSync(dbPath).isSymbolicLink())throw Error('SOURCE_NOT_FOUND_OR_UNSAFE');
  if(target===dbPath||existsSync(target))throw Error('DESTINATION_EXISTS_OR_SAME_AS_SOURCE');
  mkdirSync(dirname(target),{recursive:true,mode:0o700});
  source=new DatabaseSync(dbPath,{readOnly:true});
  mayRemoveTarget=true;
  await backup(source,target);
  chmodSync(target,0o600);
  const check=new DatabaseSync(target,{readOnly:true});
  try {
    const result=check.prepare('PRAGMA integrity_check').get();
    if(result?.integrity_check!=='ok')throw Error('BACKUP_INTEGRITY_FAILED');
  } finally {check.close();}
  console.log('Backup verificado e protegido: '+target);
  console.log('Contém dados de contas e hashes. Nunca subir ao GitHub ou compartilhar por mensagem.');
} catch(err) {
  if(mayRemoveTarget&&existsSync(target))try{unlinkSync(target)}catch{}
  console.error('BACKUP_FAILED:',err.message);
  process.exitCode=1;
} finally {if(source)source.close();}
