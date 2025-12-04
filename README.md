# TP Backend (Exercice 60)

## Récupération du token d'accès

Pour obtenir le token JWT nécessaire à toutes les requêtes sous `/api`, il faut poster l'email et le mot de passe vers l'endpoint `POST /login`. Depuis la console de votre navigateur, vous pouvez utiliser `fetch` comme suit :

```javascript
fetch('http://localhost:3000/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'matt_art@gmail.com',
    password: '123456'
  })
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Identifiants invalides')
    }
    return response.json()
  })
  .then(({ token }) => {
    // Conserver le token pour les futurs appels : header x-access-token
    localStorage.setItem('accessToken', token)
  })
  .catch(console.error)
```

Le token récupéré devra ensuite être transmis dans l'entête `x-access-token` de vos requêtes vers `/api/users` et les autres endpoints sécurisés. Gardez-le tant que vous travaillez avec l’utilisateur de démo `Mat_Art`.

## Tests automatisés (4.2 & 4.3)

```bash
npm install   # première fois
npm test      # régénère swagger_output.json, recrée bdtest.sqlite et lance Jest/SuperTest
```

Ce scénario vérifie :

- login + listing pour `Mat_Art` (`matt_art@gmail.com` / `123456`)
- refus d’identifiants invalides et d’accès sans token ou token forgé
- enregistrement d’un nouvel utilisateur et récupération du token
- changement de mot de passe sur `/api/password`
- interdiction pour un non-admin de modifier un autre utilisateur
- opérations admin (`admin@example.com` / `Adm1nP@ss!`) sur `/api/users/:id` PUT/DELETE
- gestion des groupes (`/api/mygroups`, `/api/groupsmember`, ajout/suppression de membres)

Pour tester manuellement :

1. `npm run doc && npm run updatedb` pour régénérer la doc et la base SQLite locale.
2. `POST /login` avec les identifiants ci-dessus pour récupérer un token.
3. `/api/password` (PUT + nouveau mot de passe) fonctionne avec le token de l’utilisateur connecté.
4. Pour les routes admin (`/api/users/:id` PUT/DELETE), connectez-vous en tant qu’`admin@example.com`.
5. Pour la gestion des groupes :
   - `POST /api/mygroups` avec `{ "name": "Nom du groupe" }` crée un groupe appartenant au créateur.
   - `GET /api/mygroups` liste les groupes dont vous êtes propriétaire (tous les groupes si vous êtes admin).
   - `GET /api/mygroups/{gid}` donne les membres du groupe (créateur, membres et admins y ont accès).
   - `PUT /api/mygroups/{gid}/{uid}` ajoute un utilisateur dans le groupe (admin/propriétaire ou l’utilisateur lui‑même).
   - `DELETE /api/mygroups/{gid}/{uid}` retire un membre (admin/propriétaire ou l’utilisateur lui‑même).
   - `GET /api/groupsmember` liste les groupes dont vous êtes membre.

## CI/CD & Déploiement Scalingo (4.5.1)

Le fichier `.gitlab-ci.yml` met en place deux stages :

- `test_backend` (image `node:18`) : `npm ci` puis `npm test` dans `backendsqlite`.
- `scalingo` (image `ruby:3.1.3`) : installe la CLI Scalingo, s’authentifie et pousse le dépôt sur l’application distante.

### Variables GitLab à définir

Dans **Settings > CI/CD > Variables** :

- `SCALINGO_API_TOKEN` (masked/protected) : token généré sur https://dashboard.scalingo.com (User Settings > API tokens).
- `SCALINGO_APP_NAME` : nom de votre appli chez Scalingo (ex : `mon-appli-tp`).
- `SCALINGO_REGION` : `osc-fr1` (ou la région choisie).

Le job `scalingo` s’exécute uniquement sur la branche `main` et suppose un runner tagué `docker`.

### Adaptations éventuelles

- Si l’application backend n’est pas dans `backendsqlite`, mettre à jour `PROJECT_DIR` dans `.gitlab-ci.yml`.
- Le job `scalingo` crée une clé SSH éphémère (`~/.dpl/id_rsa`). S’il échoue, vérifier que le dépôt Scalingo est bien initialisé (`scalingo git-setup`) et que les variables ci-dessus sont correctes.
- Pour tester le pipeline localement : `npm test` (pour la partie `test_backend`), puis exécuter manuellement la séquence de la section 4.5.1 sur une machine disposant de la CLI Scalingo.
