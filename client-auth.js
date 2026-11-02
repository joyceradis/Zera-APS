/* Sessão verdadeira: esta rotina só funciona quando servida pelo backend do ZERA-APS. */
(async () => {
  'use strict';
  const result = await fetch('/api/session', {credentials:'same-origin',cache:'no-store'}).catch(()=>null);
  if (!result || !result.ok) return;
  const state = await result.json();
  if (!state.user || !state.csrf) return;
  const profile = document.getElementById('profile-button');
  const bookmarksResponse = await fetch('/api/bookmarks',{credentials:'same-origin'}).catch(()=>null);
  const bookmarksData = bookmarksResponse?.ok ? await bookmarksResponse.json() : {rules:[]};
  const bookmarks = new Set(bookmarksData.rules||[]);
  const toggleBookmark = async ruleId => {
    const enabled=!bookmarks.has(ruleId);
    const response=await fetch('/api/bookmarks',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json','x-csrf-token':state.csrf},body:JSON.stringify({ruleId,enabled})});
    if(!response.ok) throw new Error('Não foi possível atualizar seu favorito.');
    const body=await response.json();bookmarks.clear();for(const id of body.rules||[])bookmarks.add(id);
    if(window.ZERA_APP?.rerenderRules)window.ZERA_APP.rerenderRules();
    return enabled;
  }; 
  profile.textContent = state.user.email.slice(0,2).toUpperCase();
  profile.title = state.user.email + ' · ' + state.user.role;
  profile.setAttribute('aria-label','Abrir minha conta: '+state.user.email);
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
  const favorites=document.createElement('p');
  const describeFavorites=()=>favorites.textContent='Guias favoritos: '+bookmarks.size+' (somente identificadores de regras, sem pacientes).';
  describeFavorites();container.append(favorites);
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
    const pendingHeading=document.createElement('h3');pendingHeading.textContent='Convites ainda não utilizados';
    const pendingList=document.createElement('div');pendingList.className='team-list';
    const usersHeading=document.createElement('h3');usersHeading.textContent='Profissionais cadastrados';
    const usersList=document.createElement('div');usersList.className='team-list';
    const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar link gerado';
    copy.addEventListener('click',async()=>{if(link.value){try{await navigator.clipboard.writeText(link.value);feedback.textContent='Convite copiado. Envie apenas ao destinatário.';}catch{link.focus();link.select();feedback.textContent='Selecione e copie o convite manualmente.';}}});
    async function loadSeats(){
      const r=await fetch('/api/team',{credentials:'same-origin'});
      if(!r.ok)return;const d=await r.json();
      seats.textContent='Médicos ativos: '+d.capacity.active+' / '+d.capacity.max+' · Convites pendentes: '+d.capacity.pending;
      pendingList.replaceChildren();
      for(const pending of d.pendingInvites||[]){
        const row=document.createElement('div');row.className='team-row';
        const label=document.createElement('span');label.textContent=pending.email+' · '+pending.role+' · expira '+new Date(pending.expires_at).toLocaleString('pt-BR');row.append(label);
        const revoke=document.createElement('button');revoke.type='button';revoke.textContent='Cancelar';revoke.setAttribute('aria-label','Cancelar convite de '+pending.email);
        revoke.addEventListener('click',async()=>{
          if(!window.confirm('Cancelar convite ainda não utilizado para '+pending.email+'?'))return;
          const response=await fetch('/api/invites/revoke',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-csrf-token':state.csrf},body:JSON.stringify({email:pending.email})});
          if(!response.ok){feedback.textContent='Não foi possível cancelar o convite.';return;}
          feedback.textContent='Convite cancelado e vaga liberada quando aplicável.';await loadSeats();
        });
        row.append(revoke);pendingList.append(row);
      }
      if(!pendingList.children.length){const note=document.createElement('p');note.textContent='Nenhum convite pendente.';pendingList.append(note);}
      usersList.replaceChildren();
      for(const user of d.users){
        const line=document.createElement('div');line.className='team-row';
        const description=document.createElement('span');description.textContent=user.email+' · '+user.role+(user.active?' · ativo':' · desativado');line.append(description);
        if(user.active){
          const recover=document.createElement('button');recover.type='button';recover.textContent='Recuperar acesso';recover.setAttribute('aria-label','Gerar recuperação de acesso para '+user.email);
          recover.addEventListener('click',async()=>{
            if(!window.confirm('Gerar um link de uso único para redefinir a senha de '+user.email+'?'))return;
            const response=await fetch('/api/team/reset',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-csrf-token':state.csrf},body:JSON.stringify({userId:user.id})});
            if(!response.ok){feedback.textContent='Não foi possível criar o link de recuperação.';return;}
            const result=await response.json();link.value=result.link;
            feedback.textContent='Link de recuperação criado para '+result.email+'. Expira em 1 hora. Envie privadamente.';
            copy.textContent='Copiar link de recuperação';
          });
          line.append(recover);
        }
        if(user.active&&user.id!==state.user.id){
          const disable=document.createElement('button');disable.type='button';disable.textContent='Desativar';disable.setAttribute('aria-label','Desativar acesso de '+user.email);
          disable.addEventListener('click',async()=>{
            if(!window.confirm('Desativar acesso de '+user.email+'? Suas sessões serão encerradas.'))return;
            const response=await fetch('/api/team/disable',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-csrf-token':state.csrf},body:JSON.stringify({userId:user.id})});
            if(!response.ok){feedback.textContent='Não foi possível desativar essa conta.';return;}
            feedback.textContent='Conta desativada.';await loadSeats();
          });line.append(disable);
        }
        usersList.append(line);
      }
    }
    form.append(title,email,role,send,feedback,link,copy,seats,pendingHeading,pendingList,usersHeading,usersList);
    form.addEventListener('submit',async event=>{
      event.preventDefault();feedback.textContent='';link.value='';
      const r=await fetch('/api/invites',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-csrf-token':state.csrf},body:JSON.stringify({email:email.value,role:role.value})});
      if(!r.ok){feedback.textContent='Não foi possível criar o convite. Confira e-mail e limite de vagas.';return;}
      const d=await r.json();link.value=d.link;feedback.textContent='Convite gerado para '+d.email+'. Copie e envie por canal privado.';await loadSeats();
    });
    container.append(form);await loadSeats();
  }
  const css=document.createElement('style');
  css.textContent='.account-dialog{max-height:86vh;overflow-y:auto;border:0;border-radius:13px;padding:25px;width:min(450px,calc(100% - 24px));color:#203747;box-shadow:0 25px 80px #0004}.account-dialog::backdrop{background:#102435a8}.account-dialog h2{font-size:19px;margin:0 0 9px}.account-dialog h3{font-size:14px;margin:22px 0 9px}.account-dialog p{color:#65818c;font-size:12px;line-height:1.6}.account-dialog button{border:1px solid #d1e9e2;border-radius:8px;background:#e8f7f1;color:#086d63;font-size:12px;font-weight:750;padding:9px 12px;margin:5px 6px 5px 0}.account-dialog .team-list{display:grid;gap:7px;margin:12px 0}.account-dialog .team-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center;border-bottom:1px solid #e4eeee;padding:8px 0;font-size:11px;color:#4a6370;overflow-wrap:anywhere}.account-dialog .team-row button{white-space:nowrap;background:#fff5f2;color:#a04b3c;border-color:#f1dfd9}.account-dialog input,.account-dialog select{display:block;width:100%;padding:12px;margin:9px 0;border:1px solid #dce8eb;border-radius:8px;color:#273f4e;font-size:12px}';
  document.head.append(css);
  document.body.append(container);
  window.ZERA_AUTH={openAccount:()=>{describeFavorites();container.showModal();},bookmarks,toggleBookmark};
  if(window.ZERA_APP?.rerenderRules)window.ZERA_APP.rerenderRules();
  const env=document.querySelector('.env-tag');if(env)env.textContent='PILOTO PRIVADO';
  const pilot=document.querySelector('.pilot-state h2');if(pilot)pilot.textContent='Contas e sessões individuais habilitadas neste ambiente.';
  const pilotDescription=document.querySelector('.pilot-state p');if(pilotDescription)pilotDescription.textContent='Autenticação por convite e separação de contas disponíveis em execução local. O piloto real requer hospedagem persistente, revisão de segurança e homologação clínica antes de convidar médicos externos.';
  const pilotBadge=document.querySelector('.pilot-badge');if(pilotBadge)pilotBadge.textContent='BETA RESTRITO';
  const stageTwo=document.querySelectorAll('.pilot-stage')[1];
  if(stageTwo){const status=stageTwo.querySelector('.stage-status');if(status){status.textContent='Implementado (beta)';status.classList.add('ready');}}
  const sideDescription=document.querySelector('.side-note strong');if(sideDescription)sideDescription.textContent='Ambiente com acesso individual';
  const sideHint=document.querySelector('.side-note small');if(sideHint)sideHint.textContent='Piloto técnico sem dados de pacientes';
})();