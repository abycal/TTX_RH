<#import "template.ftl" as layout>

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex, nofollow"/>
  <title>Connexion — Tritux RH</title>
  <link rel="icon" href="${url.resourcesPath}/img/favicon.ico"/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css"/>
</head>

<body>
<div class="split-layout">

  <!-- ═══════════════════════ PANNEAU GAUCHE — IMAGE ═══════════════════════ -->
  <div class="panel-left">
    <div class="image-wrapper">
      <img src="${url.resourcesPath}/img/banner.png" alt="Tritux RH" class="banner-img"/>
      <div class="image-overlay"></div>
    </div>
  </div>

  <!-- ═══════════════════════ PANNEAU DROIT — FORMULAIRE ════════════════════ -->
  <div class="panel-right">
    <div class="form-card">

      <!-- Logo -->
      <div class="form-header">
        <img src="${url.resourcesPath}/img/logo-full.png" alt="Tritux RH" class="form-logo-img"/>
        <h2 class="form-title">Connexion</h2>
        <p class="form-subtitle">Accédez à votre espace Tritux RH</p>
      </div>

      <!-- Erreurs globales -->
      <#if message?has_content && message.type = "error">
        <div class="alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ${message.summary}
        </div>
      </#if>

      <!-- Formulaire -->
      <form id="kc-form-login" action="${url.loginAction}" method="post">

        <!-- Username -->
        <div class="field">
          <label for="username">
            <#if !realm.loginWithEmailAllowed>Nom d'utilisateur
            <#elseif !realm.registrationEmailAsUsername>Nom d'utilisateur ou email
            <#else>Email
            </#if>
          </label>
          <div class="input-wrap">
            <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input
              id="username"
              name="username"
              type="text"
              value="${(login.username!'')}"
              autofocus
              autocomplete="username"
              placeholder="prenom.nom@tritux.com"
              class="<#if messagesPerField.existsError('username','password')>input-error</#if>"
            />
          </div>
          <#if messagesPerField.existsError('username')>
            <span class="field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
          </#if>
        </div>

        <!-- Password -->
        <div class="field">
          <div class="field-label-row">
            <label for="password">Mot de passe</label>
            <#if realm.resetPasswordAllowed>
              <a href="${url.loginResetCredentialsUrl}" class="forgot-link">Mot de passe oublié ?</a>
            </#if>
          </div>
          <div class="input-wrap">
            <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••••"
              class="has-toggle <#if messagesPerField.existsError('username','password')>input-error</#if>"
            />
            <button type="button" class="toggle-pass" onclick="togglePass()" tabindex="-1" aria-label="Afficher le mot de passe">
              <svg id="eye-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <#if messagesPerField.existsError('password')>
            <span class="field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
          </#if>
        </div>

        <!-- Remember me -->
        <#if realm.rememberMe && !usernameEditDisabled??>
          <div class="remember-row">
            <label class="checkbox-label">
              <input type="checkbox" name="rememberMe" <#if login.rememberMe??>checked</#if>/>
              <span>Rester connecté</span>
            </label>
          </div>
        </#if>

        <input type="hidden" id="id-hidden-input" name="credentialId"
               <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

        <!-- Submit -->
        <button type="submit" id="kc-login" name="login">
          Se connecter
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>

      </form>

      <!-- Register -->
      <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
        <p class="register-link">
          Pas encore de compte ?
          <a href="${url.registrationUrl}">Créer un accès</a>
        </p>
      </#if>

    </div>
  </div>

</div>

<script>
function togglePass() {
  var input = document.getElementById('password');
  var icon  = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}
</script>
</body>
</html>
