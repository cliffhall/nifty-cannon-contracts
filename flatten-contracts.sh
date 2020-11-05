#!/bin/bash
npx truffle-flattener contracts/NiftyCannon.sol > flat/NiftyCannon.flat.sol &&
npx truffle-flattener contracts/Rampart.sol > flat/Rampart.flat.sol
