This repository is a fork from https://github.com/Bundlr-Network/ARchivers - and adapted to archive from V Kontakte!

# vkAR - archiver for pulling from V Kontakte and storing permanently to Arweave via Bundlr

To run vkAR, you need an Arweave wallet - more specifically an Arweave wallet file (json).
You need to copy the contents of this wallet file into the file wallet.json's "arweave" section (example provided in example.wallet.json).

You also need API Service Key from https://dev.vk.com/

To set up the application,
Set the Environment Variables as follows:

VK_SERVICE_KEY - The VK Service Key
ARWEAVE_KEY - Arweave wallet key

To start the application,

2. Run,

    ```
    npm install

    npm start
    ```
