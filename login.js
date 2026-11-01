(() => {
  'use strict';
  const params = new URLSearchParams(window.location.hash.slice(1));
  const invite = params.get('convite');
  const reset = params.get('reset');
  if (invite || reset) history.replaceState(null, '', '/login');
  const $ = id => document.getElementById(id);
  if (invite) {
    $('form-title').textContent = 'Ativar convite';
    $('form-subtitle').textContent = 'Defina a senha desta conta individual. O convite é válido uma única vez.';
    $('submit').firstChild.textContent = 'Criar conta e entrar ';
    $('password').autocomplete = 'new-password';
    $('password-hint').hidden = false;
  }
  if (reset) {
    $('form-title').textContent = 'Recuperar acesso';
    $('form-subtitle').textContent = 'Confirme seu e-mail e crie uma nova senha. Este link tem validade limitada e uso único.';
    $('submit').firstChild.textContent = 'Atualizar senha e entrar ';
    $('password').autocomplete = 'new-password';
    $('password-hint').hidden = false;
  }
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    $('message').textContent = '';
    $('submit').disabled = true;
    try {
      const response = await fetch(reset ? '/api/reset/accept' : invite ? '/api/invite/accept' : '/api/login', {
        method: 'POST', credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: $('email').value, password: $('password').value, ...(invite ? {token: invite} : reset ? {token: reset} : {})})
      });
      if (!response.ok) throw Error(response.status === 429 ? 'Muitas tentativas. Tente novamente mais tarde.' : reset ? 'Recuperação inválida, expirada ou senha inadequada.' : invite ? 'Convite inválido, expirado ou senha inadequada.' : 'E-mail ou senha inválidos.');
      window.location.replace('/');
    } catch (error) {
      $('message').textContent = error.message || 'Não foi possível autenticar.';
      $('submit').disabled = false;
    }
  });
})();