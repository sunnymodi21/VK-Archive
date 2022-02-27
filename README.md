This repository is a fork from https://github.com/Bundlr-Network/ARchivers - and adapted to archive from V Kontakte!

# vkAR - archiver for pulling from V Kontakte and storing permanently to Arweave via Bundlr

To run vkAR, you need an Arweave wallet - more specifically an Arweave wallet file (json).
You need to copy the contents of this wallet file into the example (example.wallet.json) wallets' "arweave" section.

You also need API Service Key from https://dev.vk.com/ - this service_key must be placed inside wallet.json under the "vkKeys" section.

To start the application,

1. Add to wallet.json your arweave wallet details under "arweave" and VK service keys under "vkKeys.service_key"

2. Run,

    ```
    npm install

    npm start
    ```
