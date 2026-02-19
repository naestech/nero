<div align="center">
  <p><strong>nero party</strong></p>
  <p><em>themed listening parties.</em></p>
</div>

---

**how nero party works**

**demo video:** https://www.loom.com/share/87bb16e36a88426daea3448dd1683d71

host creates an account with party name & theme. they can then invite anyone with the link to join. participants join by entering their username.

anyone in the room can search for songs, add to the shared queue.

participants vote on each song based on theme, and results are revealed at the end of the song.

if no new songs are added to the queue in 60 seconds, the party auto-ends and the party results are displayed.

---

**getting started**

**setup video:** https://www.loom.com/share/9e35b7fa210c4dea9e4a81fa62802e44

requires node 18+ and npm.

```bash
git clone https://github.com/naestech/nero.git
cd nero
npm install
cd backend && npx prisma migrate dev --name init && cd ..
npm run dev
```

open `http://localhost:5173`

---

**built with:**
express · socket.io · prisma · sqlite
react · vite · tailwindcss ·
itunes search api _(no api key required!)_
