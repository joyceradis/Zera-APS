# ZERA-APS | Execução local, controle de acesso e implantação

**Versão técnica:** v0.3 beta, 01/11/2026. **Não publicado nem homologado clinicamente.**

## Execução local sem serviços pagos

Requer Node.js >=22.13 (preferencialmente Node 24 LTS). Usar terminal na pasta do projeto.

1. `npm test` — executa verificações do backend e do protótipo sem instalar bibliotecas npm.
2. `npm start` — inicia o servidor local em `http://localhost:8787`, usando `127.0.0.1` para limitar acesso ao próprio computador.
3. Em **outro terminal**, executar `npm run bootstrap-admin -- admin@exemplo.com` substituindo pelo e-mail de quem administrará as contas. O comando gera link único por 48 h.
4. Abrir o convite no navegador local, criar senha própria de pelo menos 12 caracteres e entrar.
5. No avatar/perfil, criar convites individuais para médicos, verificar a relação de usuários, encerrar acessos e gerar links de recuperação. Entregar links privadamente aos destinatários (a aplicação não envia e-mails).

Para recuperar administrativamente uma conta perdida a partir do computador autorizado: `npm run recover-account -- usuario@dominio.com` (o comando cria um link de uso único, validade de 1 hora). Não executar em terminais compartilhados. Para cancelar um convite pendente a partir do terminal local, utilize `node server/cli.mjs revoke-pending usuario@dominio.com`.\n\nO servidor usa SQLite local em `runtime/zeraaps.sqlite`, protegido pelo diretório e permissões locais. Esse diretório é ignorado pelo Git. **Não colocar CPF/CNS, prontuário, dados clínicos identificáveis nem segredos nas regras, nos testes ou no repositório público.**

### Configuração por variáveis de ambiente

- `APP_ORIGIN`: origem exata vista pelo usuário, por exemplo `http://localhost:8787` em desenvolvimento ou `https://app.seudominio.com.br` em produção.
- `PORT`: porta interna (padrão 8787).
- `HOST`: interface local; na produção padrão `0.0.0.0`, dev `127.0.0.1`.
- `ZERA_DB_PATH`: caminho persistente de SQLite (padrão `./runtime/zeraaps.sqlite`).
- `ZERA_MAX_DOCTORS`: máximo de médicos ativos + convites pendentes; padrão 50.
- `NODE_ENV=production`: recusa `APP_ORIGIN` que não seja HTTPS.

Os convites são tokens aleatórios com uso único, expiração de 48 horas, vinculados ao e-mail designado. O vínculo ao e-mail é uma restrição de identidade, **não** comprovação automática de posse de caixa postal; links devem ser entregues por canal privado. A recuperação de acesso é gerada por administrador no painel (expira em 1 hora) ou, sob controle do operador local, por CLI. Não existe recuperação autônoma por e-mail nesta fase.

## Controles implementados

- Hash de senha com scrypt e salt individual.
- Cookies de sessão HttpOnly, SameSite=Strict; Secure em origem HTTPS; validade de oito horas.
- Tokens de sessão opacos e armazenados no banco apenas por hash.
- Proteção por cabeçalho Origin para operações mutáveis, além de token CSRF em operações autenticadas.
- Perfis admin/editor/doctor, acesso por autorização no servidor, bloqueio de endpoints de administração para profissionais não administradores.
- Capacidade de até 50 médicos ativos e convites pendentes; contas de editor/admin não são contadas nessa cota.
- Revogação de sessões ao desativar conta. Restrição de desativar o último administrador.
- Favoritos separados por ID de usuário; armazenam **apenas IDs de orientações**, sem dados de pacientes.
- Controles básicos de headers HTTP e tamanho máximo de payload JSON.
- Proteção de tentativas repetidas de senha por combinação IP/e-mail.

## Limitações críticas antes de disponibilizar na internet

- **Segurança ainda não foi auditada externamente.** Não tratar testes locais como certificação de segurança nem conformidade com LGPD.
- Existe **recuperação administrativa por link temporário**, mas ainda não há segundo fator, verificação automatizada de posse de e-mail, sistema transacional de mensagens, registro auditável completo de ações administrativas ou monitoramento/alertas.
- Não há banco replicado, backups automatizados testados, alta disponibilidade ou migração de schema comprovada.
- O banco SQLite e o servidor Node funcionam para um piloto restrito; produção requer avaliação de persistência e escalabilidade, isolamento de infraestrutura, backups e eventual migração a banco gerenciado.
- O teste local de 50 sessões simultâneas é um **ensaio funcional**, não um benchmark de desempenho em nuvem nem auditoria de carga da produção.
- As regras clínicas são preliminares; não existe conformidade do cálculo de indicadores, acesso ao PEC ou elegibilidade/faturamento automático.
- Não publicar senhas, links de convite nem dados clínicos em issues, logs, commits ou screenshots.

## Implantação futura transferível

O `Dockerfile` utiliza Node 24 sem dependências npm, roda como usuário não-root e expõe somente a porta interna 8787. Necessita de proxy HTTPS/TLS externo e volume **persistente** para `/app/runtime`. Não subir containers com banco efêmero.

Só realizar deploy depois de: domínio sob controle do proprietário, ambiente de hospedagem selecionado com custo **explicitamente aprovado**, TLS, volume persistente privado, backup/restauração testados, inspeção de logs, verificação de segurança, teste real de carga, revisão das fontes e aceite clínico. O Dockerfile por si só não atende a esses requisitos.

**Não houve contratação, deploy, criação de usuários reais ou alteração de produção nesta entrega.**
