# Nifty Cannon Contracts
![Make it rain NFTs!](images/banner-800x200.png)

Make it rain NFTs!

Send multiple [ERC-721](http://erc721.org/) tokens from the same contract to multiple Ethereum addresses. 

## Features
* Airdrop mode 
  - sender pays gas for transfers
  - tokens are transferred from sender wallet to recipient wallets
  
* Will-call mode
  - sender sends same payload but it is stored rather than acted upon
  - recipient can pickup will call NFTs any time
  - recipient pays gas for transfers when picking up

* Rampart
  - anyone can register to opt out of receiving airdrops

## Status
Work in Progress
* Initial Cannon functionality operational and unit tested
* Rampart functionality not built or observed yet
### Unit Test Output
![Unit Test Output](images/Unit_Test_Output.png)

# Developer Setup
## Prerequisites
### Install Node (also installs NPM)
 * [Get Node](https://nodejs.org/en/download/)

### Install required Node modules
All NPM resources are project-local. No global installs required. 

```
cd path/to/nifty-cannon-contracts
npm install
```

### Configure Environment
Create a file called `environments.js` with the following content for each network environment.
* `forkNode`: the url endpoint for forking the ethereum network
* `forkBlock`: the block to fork the network ethereum from
* `txNode`: the endpoint for sending ethereum transactions
* `mnemonic`: a valid ethereum HD wallet seed phrase

```javascript
module.exports = {

    "rinkeby": {
        "forkNode": "https://eth-rinkeby.alchemyapi.io/v2/<YOUR_ALCHEMY_API_KEY>",
        "forkBlock": 7507432,
        "txNode": "https://rinkeby.infura.io/v3/<YOUR_INFURA_API_KEY>",
        "mnemonic": "<YOUR_UNIQUE_TWELVE_WORD_WALLET_SEED_PHRASE>"
    }

};
```

# Development Tasks
## NPM Scripts
### Build the contracts
This creates a the build artifacts for deployment or testing

```npm run build```

### Test the contracts
This builds the contracts and runs the unit tests.

```npm run test```

# Architecture
## Discussion
Initial MVP allows an owner of one or more NFTs on a contract to send a set of them to one or more recipients.

* NFT standard support
  - ERC721 support initially
  - ERC1155 eventually may help gas with batch transfer mode

### Terminology
* Volley
  - A set of NFTs on a single contract destined for a single recipient
    
* Airdrop Send
  - The immediate transfer of the NFTs in a Volley
  
* Will Call Send
  - The deferred transfer of the NFTs in a Volley for a recipient to pickup later
  
* Will Call Pickup
  - A recipient initiating a previously approved airdrop to their wallet

## Diagrams
### Volley Sequences - Air Drop Send
![Volley Sequences - Air Drop Send](images/Volley_Sequences-Air_Drop_Send.png)

### Volley Sequences - Will Call Send
![Volley Sequences - Will Call Send](images/Volley_Sequences-Will_Call_Send.png)

### Volley Sequences - Will Call Pickup
![Volley Sequences - Will Call Pickup](images/Volley_Sequences-Will_Call_Pickup.png)

# Attributions
* Cannon icon made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
* Vintage Circus Cannon 3D model made by <a href="https://3docean.net/user/fainods">FainoDS</a> licensed from  <a href="https://3docean.net/">3dOcean</a>