This repository is a fork from https://github.com/Bundlr-Network/ARchivers - and adapted to archive from V Kontakte!

# vkAR - archiver for pulling from V Kontakte (a social media platform) and storing to Arweave - permanently storing them on Arweave via Bundlr
To run vkAr, you need an Arweave wallet - more specifically an Arweave wallet file.
You need to copy the contents of this wallet file into the example (example.wallet.json) wallets' "arweave" section.

You also need API Service Key from https://dev.vk.com/ - this service_key must be placed inside wallet.json under the "vkKeys" section.

To start the application,

1. Set up your config.json with keywords and wallet.json with your arweave wallet and VK service keys

2. Run,

    ```npm install

    npm start```
