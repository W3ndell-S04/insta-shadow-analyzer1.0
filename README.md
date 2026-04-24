# 🔍 Instagram Shadow Analyzer

Uma ferramenta web simples e eficiente para analisar quem você segue no Instagram e não te segue de volta — **100% local, segura e sem uso de senha**.

---

## 🚀 Funcionalidades

### 📊 Análise de Seguidores

* Upload dos arquivos oficiais do Instagram (`followers` e `following`)
* Processamento local dos dados
* Identificação automática de:

  * Total de seguidores
  * Total seguindo
  * Quem não te segue de volta

---

### 🎯 Sistema de Organização (Tags)

Classifique cada perfil com base na sua decisão:

* 🟢 **Manter**
* 🟡 **Duvidoso**
* 🔴 **Remover**

---

### 🔎 Filtros Inteligentes

Filtre a lista com base nas suas decisões:

* Todos
* Apenas **Manter**
* Apenas **Duvidoso**
* Apenas **Remover**

---

### ✅ Controle de Progresso

* Checkbox para marcar perfis já analisados
* Destaque visual para itens já revisados

---

### 💾 Persistência de Dados (LocalStorage)

* Suas decisões (tags + checkboxes) são salvas automaticamente
* Os dados permanecem mesmo após fechar o navegador

---

### ☁️ Salvamento Automático da Análise

* O último scan é salvo automaticamente
* Ao abrir o sistema novamente:

  * A análise anterior é carregada automaticamente
  * Você continua de onde parou

---

### 🗑️ Limpar Análise

* Botão para remover todos os dados salvos
* Reset completo do sistema

---

### 📱 Interface Moderna e Responsiva

* Design clean (dark mode)
* Layout adaptável para mobile
* Métricas fixas no topo (sticky header)
* Experiência fluida e intuitiva

---

## 🔐 Segurança

* Nenhuma senha é utilizada
* Nenhum dado é enviado para servidores
* Todo processamento é feito **localmente no navegador**
* Seus dados permanecem 100% privados

---

## 📂 Como usar

### 1. Baixar dados do Instagram

No app do Instagram:

1. Acesse **Configurações**
2. Vá em **Central de Contas**
3. Clique em **Suas informações e permissões**
4. Selecione **Baixar suas informações**
5. Escolha:

   * Apenas **Seguidores e Seguindo**
   * Formato: **HTML ou JSON**
   * Intervalo: **Todo o período**

---

### 2. Preparar arquivos

Após o download:

* Extraia o `.zip`
* Vá até a pasta:

```
followers_and_following/
```

* Utilize:

  * `followers_1.html`
  * `following.html`

---

### 3. Usar a ferramenta

1. Faça upload dos arquivos
2. Clique em **🚀 Iniciar Scan**
3. Analise os resultados
4. Classifique com as tags
5. Use os filtros para organizar sua limpeza

---

## 🛠️ Tecnologias utilizadas

* HTML5
* CSS3 (Design System + Responsivo)
* JavaScript (Vanilla)
* LocalStorage (persistência)

---

## 💡 Possíveis melhorias futuras

* 📊 Contador por filtro (ex: Remover (12))
* 📋 Botão "copiar lista"
* 🔍 Busca por username
* ☁️ Backup em nuvem
* 🔐 Autenticação de usuário

---

## 📌 Observação

Este projeto utiliza apenas dados fornecidos pelo próprio Instagram através da funcionalidade oficial de exportação.

---

## 👨‍💻 Autor

Desenvolvido por Wendell Lago Soares como projeto de prática e portfólio.

---


