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
