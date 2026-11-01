/* Sessão verdadeira: esta rotina só funciona quando servida pelo backend do ZERA-APS. */
(async () => {
  'use strict';
  const result = await fetch('/api/session', {credentials:'same-origin',cache:'no-store'}).catch(()=>null);
  if (!result || !result.ok) return;
  const state = await result.json();
  if (!state.user || !state.csrf) return;
  const profile = document.getElementById('profile-button');
  profile.textContent = state.user.email.slice(0,2).toUpperCase();
  profile.title = state.user.email + ' · ' + state.user.role;
  const container = document.createElement('dialog');
  container.className='account-dialog';
  container.setAttribute('aria-label','Conta e administração');
  const heading = document.createElement('h2');
  heading.textContent = 'Minha conta';
  const who = document.createElement('p');
  who.textContent = state.user.email + ' · perfil: ' + state.user.role;
  const close = document.createElement('button');
  close.type = 'button'; close.textContent = 'Fechar'; close.addEventListener('click',()=>container.close());
  const logout = document.createElement('button');
  logout.type = 'button';logout.textContent = 'Encerrar sessão';
  logout.addEventListener('click',async()=>{
    const response=await fetch('/api/logout',{method:'POST',credentials:'same-origin',headers:{'x-csrf-token':state.csrf}});
    if(response.ok)location.replace('/login');
  });
  container.append(heading,who,close,logout);
  if (state.user.role === 'admin') {
    const form=document.createElement('form');
    const title=document.createElement('h3');title.textContent='Convidar profissional';
    const email=document.createElement('input');email.type='email';email.required=true;email.placeholder='Email do profissional';
    const role=document.createElement('select');
    for(const id of ['doctor','editor','admin']){const option=document.createElement('option');option.value=id;option.textContent=id==='doctor'?'Médico':id==='editor'?'Editor clínico':'Administrador';role.append(option);}
    const send=document.createElement('button');send.type='submit';send.textContent='Criar convite';
    const feedback=document.createElement('p');feedback.setAttribute('role','status');
    const link=document.createElement('input');link.readOnly=true;link.placeholder='Convite gerado aparecerá aqui';link.setAttribute('aria-label','Link de convite de uso único');
    const seats=document.createElement('p');
    async function loadSeats(){const r=await fetch('/api/team',{credentials:'same-origin'});if(r.ok){const d=await r.json();seats.textContent='Médicos ativos: '+d.capacity.active+' / '+d.capacity.max+' · Convites pendentes: '+d.capacity.pending;}}
    form.append(title,email,role,send,feedback,link,seats);
    form.addEventListener('submit',async event=>{
      event.preventDefault();feedback.textContent='';link.value='';
      const r=await fetch('/api/invites',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-csrf-token':state.csrf},body:JSON.stringify({email:email.value,role:role.value})});
      if(!r.ok){feedback.textContent='Não foi possível criar o convite. Confira e-mail e limite de vagas.';return;}
      const d=await r.json();link.value=d.link;feedback.textContent='Convite gerado para '+d.email+'. Copie e envie por canal privado.';await loadSeats();
    });
    container.append(form);await loadSeats();
  }
  const css=document.createElement('style');
  css.textContent='.account-dialog{border:0;border-radius:13px;padding:25px;width:min(450px,calc(100% - 24px));color:#203747;box-shadow:0 25px 80px #0004}.account-dialog::backdrop{background:#102435a8}.account-dialog h2{font-size:19px;margin:0 0 9px}.account-dialog h3{font-size:14px;margin:22px 0 9px}.account-dialog p{color:#65818c;font-size:12px;line-height:1.6}.account-dialog button{border:1px solid #d1e9e2;border-radius:8px;background:#e8f7f1;color:#086d63;font-size:12px;font-weight:750;padding:9px 12px;margin:5px 6px 5px 0}.account-dialog input,.account-dialog select{display:block;width:100%;padding:12px;margin:9px 0;border:1px solid #dce8eb;border-radius:8px;color:#273f4e;font-size:12px}';
  document.head.append(css);
  document.body.append(container);
  window.ZERA_AUTH={openAccount:()=>container.showModal()};
})();