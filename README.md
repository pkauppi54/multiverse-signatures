# 💫 Multiverse Signatures

> Deploy your own multi-sig wallet and propose, execute and sign transactions!

In this project I used the Scaffold-Eth main branch to start building my own version of a multisignature wallet. This took me about a month and I learned
many valuable skills regarding encoding calldata, handling signatures in solidity, creating a nice UI with React and deploying my own backend to Heroku. 

I got stuck debugging all of this code for a week (or two :D) but managed to get everything under control. On to the next challenge!

Special thanks to the Telegram channel for helping me with bugs and such. This multi-sig wallet template was copied from BuidlGuidl and has been very
popular among builders! 

![image](https://user-images.githubusercontent.com/2653167/124158108-c14ca380-da56-11eb-967e-69cde37ca8eb.png)


# 💫 Quick Start

Prerequisites: [Node (v16 LTS)](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork 💫Multiverse Signatures

```bash
git clone https://github.com/pkauppi54/multiverse-signatures.git
```

> install and start your 👷‍ Hardhat chain:

```bash
cd multiverse-signatures
yarn install
yarn chain
```

> in a second terminal window, start your 📱 frontend:

```bash
cd multiverse-signatures
yarn start
```

> in a third terminal window, 🛰 deploy your contract:

```bash
cd multiverse-signatures
yarn deploy
```
> in a forth terminal, start the local backend. (Reminder: You need to change the BACKEND_URL from App.jsx)

📱 Open http://localhost:3000 to see the app



