# ZERA-APS | Plano de piloto para até 50 médicos

**Data:** 2026-11-01  
**Estado:** interface v0.2 demonstrativa; sem backend, autenticação ou implantação.

## Decisão arquitetural

O produto comercial não deve se limitar a um site estático. A v0.2 moderniza a interface e reutiliza a base documental versionada sem vincular dados reais ou exigir infraestrutura externa. A próxima etapa deverá migrar o projeto para uma aplicação **server-backed**, com contas e sessões independentes.

**Não implementar login de mentira:** login simulado criaria falsa percepção de isolamento em computadores compartilhados. Neste protótipo não existem contas reais. Não há identificação, armazenamento, envio ou processamento de prontuários/pacientes. A marcação de revisão dura apenas enquanto a aba permanece aberta. Não há acesso ao PEC ou cálculo de financiamento.

## Arquitetura proposta

1. **Frontend:** componentes da interface v0.2 migrados para Next.js + TypeScript, ou stack equivalente, conservando a base de regras separada do visual.
2. **Identidade:** cadastro por convite, e-mail verificado, sessão expirada/revogável e recuperação segura. Tokens de sessão apenas em cookies seguros HttpOnly; nunca usar localStorage para tokens.
3. **Persistência:** PostgreSQL gerenciado ou equivalente, inicialmente apenas para conta, organização, preferências, convites, versão de regras e metadados operacionais, **sem dados de pacientes**.
4. **Autorização:** acesso conferido no servidor com perfis admin, editor clínico e médico; negar por padrão. Testar isolamento entre organizações e usuários.
5. **Motor editorial:** regras versionadas com identificador, fonte, status rascunho/revisado/publicado/retirado, revisor, data e testes clínico-funcionais.
6. **Hospedagem:** infraestrutura transferível ao proprietário, ambientes preview e produção separados, HTTPS, rollback e orçamento previamente aprovado. Nenhum gasto adicional foi autorizado.
7. **Observabilidade:** monitorar erros, disponibilidade, latência e desempenho sem capturar identificadores, códigos ligados a paciente ou texto clínico.
8. **Conformidade:** avaliação jurídica e de segurança LGPD, termos de uso, revisão regulatória e auditoria clínica antes de vender ou convidar profissionais para ambiente real.

Fluxo: **Navegador autenticado → aplicação/servidor → API autorizada → usuários, configurações e regras publicadas.** Revisão clínica editorial e testes precedem qualquer publicação de alterações normativas.

## Mapa funcional

| Recurso | v0.2 | Produto piloto |
| --- | --- | --- |
| Linhas de cuidado e detalhes | Funcional | Por usuário |
| Busca global e biblioteca de códigos | Funcional, cobertura parcial | Catálogo versionado e homologado |
| Cópia contextual | Funcional | Histórico editorial, se necessário |
| Revisão de leitura | Memória da aba | Preferência de sessão, se aprovada |
| Fontes e limitações | Funcional | Auditoria de versões |
| Preparação do piloto | Informativa | Gestão de convites e acessos |
| Conta, autenticação, logout | Não implementado | Obrigatório |
| Integração com PEC e pontuação | Não implementado | Fora do escopo sem autorização e dados válidos |

## Critérios de aceite para 50 médicos

- Contas independentes criadas por convite e revogáveis.
- Testes de autorização contra acesso cruzado, incluindo computadores compartilhados.
- Expiração de sessão, logout, recuperação e controles contra enumeração, CSRF e XSS.
- **Teste real** com 50 sessões concorrentes em pré-produção, registrando latência, erros e consumo; nunca declarar capacidade a partir de suposição.
- Testes de responsividade em 390px/1440px, teclado, zoom de 200% e acessibilidade.
- Base clínica revisada e fontes oficiais vigentes documentadas por versão.
- Privacidade, backups, incidentes, retenção e rollback aprovados.
- Nenhuma cobrança ou contratação sem autorização explícita.

## Experiência clínica: o problema a resolver

A dor principal é alternar entre PEC e consultas a manuais para lembrar códigos, campos estruturados, janelas de registro e exceções. Priorizar velocidade de consulta, redução de ruído, coerência em multimorbidade e rastreabilidade. **Não** induzir registro de procedimentos não realizados nem codificação automática sem contexto.

A dependência positiva do produto deve vir da economia de tempo e da confiabilidade, não de armadilhas de retenção, avisos manipulativos ou pseudoindicadores.

## Limitações atuais

- Dados documentais e regras ainda são parciais e dependem de validação clínica e normativa.
- A interface não escreve no PEC, não pode garantir indicadores ou faturamento municipal.
- O repositório está **público**: jamais adicionar segredos, planilhas ou dados identificáveis.
- Uso com casos fictícios até revisão formal.
- Não há sessões multiusuário implementadas, e uma demo acessível por link não equivale a ambiente para 50 médicos.

## Controle de versões e próximo trabalho de Estevão

- **Versão congelada:** branch archive/v0.1-frozen-2026-11-01 no commit 3a2c11effd9fb39e0a31a4e84f9d9752be2b5ccc.
- **Nova interface:** branch feat/pilot-ui-v02. Não alterar main até revisão.
- **Hoje:** UI, navegação, busca, códigos e documento de arquitetura, sem deploy ou gastos.
- **Próximo ciclo:** revisar layout e rotas; migrar para execução em servidor; implementar autenticação real, isolamento e gestão de contas; testar inicialmente com 3–5 médicos usando casos fictícios; somente depois liberar 50 conforme critérios.
- Dividir mudanças em PRs pequenos, com testes reproduzíveis e aprovação antes do merge.
