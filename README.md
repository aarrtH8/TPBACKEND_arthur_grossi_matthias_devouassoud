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

Pour tester manuellement :

1. `npm run doc && npm run updatedb` pour régénérer la doc et la base SQLite locale.
2. `POST /login` avec les identifiants ci-dessus pour récupérer un token.
3. `/api/password` (PUT + nouveau mot de passe) fonctionne avec le token de l’utilisateur connecté.
4. Pour les routes admin (`/api/users/:id` PUT/DELETE), connectez-vous en tant qu’`admin@example.com`.
