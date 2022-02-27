import Bundlr from "@bundlr-network/client"
import tmp from "tmp-promise"
import * as p from "path"
import { mkdir, unlink } from "fs/promises";
import { PathLike, promises, readFileSync } from "fs";
import { createWriteStream } from "fs";
import axios from "axios"
const vkflow = require("vkflow")


let TPM = 0;
let pTPM = 0
let bundlr

setInterval(() => {
   console.log(`TPM: ${TPM} - pTPM: ${pTPM}`); TPM = 0; pTPM = 0
}, 60000)

setInterval(() => {
  console.log(`Checking and funding bundlr balance`);
  checkAndFundBundlr(bundlr)
}, 3600000)

const checkPath = async (path: PathLike): Promise<boolean> => { return promises.stat(path).then(_ => true).catch(_ => false) }

let vkStream

async function main() {

    const config = JSON.parse(readFileSync("config.json").toString());
    const keys = JSON.parse(readFileSync(config.walletPath).toString());

    const vkFilters = config.keywords.map((word, index)=>{
      return {
        value: word,
        tag: word
      }
    });

    console.log(vkFilters);

    vkStream = vkflow(
      keys.vkKeys.service_key,
      vkFilters
    );
    bundlr = new Bundlr(config.bundlrNode, "arweave", keys.arweave);

    console.log(`Loaded with account address: ${bundlr.address}`);
    //await processTweet(tweet)

    await checkAndFundBundlr(bundlr);
    vkStream.on('data', processVKData);

    vkStream.on('error', (e) => {
        console.error("vkStream error: ", e)
    });
    const trackKeyWords = config.keywords
    console.log(`Tracking key words: ${trackKeyWords}`);

}

async function checkAndFundBundlr(bundlr) {
  const balance = await bundlr.getLoadedBalance();
  console.log(`Bundlr balance for account: ${balance}`);
  if (balance < 5e11) {
    console.log("bundlr balance low, funding now");
    // fund 1 AR
    const fundingId = await bundlr.fund(1e12);
    console.log("funded 1 AR with fundingID ", fundingId);
  }
}

async function processVKData(data) {
  let tmpdir;

  try {
    TPM++;
    const parsedData = JSON.parse(data);

    if (parsedData["code"]==300) { //service restarting
        return;
    }


    const event = parsedData["event"];
    const author = event["author"];
    /**
     * Application: "ArweaveAutoDPL/VK-Archive"
     * Author-ID: author ID: int
     * Author-URL: author URL: string
     * Media-Manifest-ID: media manifest ID: int
     * Key-Word-List: keyword set : string
     */
     let event_details = event.event_id;


    const tags = [
        { name: "User-Agent", value: "ArweaveAutoDPL/VK-Archive" },
        { name: "Author-ID", value: `${author.id}` },
        { name: "Author-URL", value: `${author.url}` },
        { name: "Content-Type", value: "application/json" },
    ];

    event.tags.forEach((tag)=> {
      tags.push({ name: "Keyword", value: `${tag}` });
    });

    if (event.event_type==="share") {
      return;
    }

    if (event.event_type==="comment") {
        tags.push({ name: "Event-Type", value: "Comment"})
        tags.push({ name: "In-Response-To-ID", value: `${event_details.post_id}` })
        tags.push({ name: "VK-ID", value: `${event_details.comment_id}`})
    }

    if (event.event_type==="post") {
        tags.push({ name: "Event-Type", value: "Post"})
        tags.push({ name: "VK-ID", value: `${event_details.post_id}`})
    }

    if (event.attachments) {
      if (!tmpdir) {
          tmpdir = await tmp.dir({ unsafeCleanup: true })
      }
      const mediaDir = p.join(tmpdir.path, "media")
      if (!await checkPath(mediaDir)) {
          await mkdir(mediaDir);
      }
      for (let i = 0; i < event.attachments.length; i++) {
        const attachment = event.attachments[i];
        const type = attachment.type;
        if (type === "photo") {
          const photo = attachment.photo;
          const photoUrl = photo.photo_2560 || photo.photo_1280 || photo.photo_807 || photo.photo_604 || photo.photo_130 || photo.photo_75
          tags.push({ name: "Attachment", value: "Photo"})

          await processMediaURL(photoUrl, mediaDir, i);
        }
      }
    }

    // if the tweet had some attachments, upload the tmp folder containing said media/site snapshots.
    if (tmpdir) {
        // upload dir
        const mres = await bundlr.uploader.uploadFolder(tmpdir.path, null, 10, false, async (_) => { })
        if (mres != "none" && mres != undefined) {
            tags.push({ name: "Media-Manifest-ID", value: `${mres}` })
            console.log(`https://node2.bundlr.network/tx/${mres}/data`)
        }

        // clean up manifest and ID file.
        const mpath = p.join(p.join(tmpdir.path, `${p.sep}..`), `${p.basename(tmpdir.path)}-manifest.json`)
        if (await checkPath(mpath)) {
            await unlink(mpath);
        }
        const idpath = p.join(p.join(tmpdir.path, `${p.sep}..`), `${p.basename(tmpdir.path)}-id.txt`)
        if (await checkPath(idpath)) {
            await unlink(idpath);
        }

        await tmpdir.cleanup()
    }

    const tx = await bundlr.createTransaction(JSON.stringify(event), { tags: tags })
    await tx.sign();
    console.log("txid = ", tx.id)
    await tx.upload()
    pTPM++

  } catch (e) {
      console.log(`general error: ${e.stack ?? e.message}`)
      if (tmpdir) {
          await tmpdir.cleanup()
      }
  }
}




export async function processMediaURL(url: string, dir: string, i: number) {
    return new Promise(async (resolve, reject) => {
        const ext = url?.split("/")?.at(-1)?.split(".")?.at(1)?.split("?").at(0) ?? "unknown"
        const wstream = createWriteStream(p.join(dir, `${i}.${ext}`))
        const res = await axios.get(url, {
            responseType: "stream"
        }).catch((e) => {
            console.log(`getting ${url} - ${e.message}`)
        })
        if (!res) { return }
        await res.data.pipe(wstream) // pipe to file
        wstream.on('finish', () => {
            resolve("done")
        })
        wstream.on('error', (e) => {
            reject(e)
        })
    })

}
main();
