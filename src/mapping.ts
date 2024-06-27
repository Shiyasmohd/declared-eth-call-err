import {
  Bytes,
  DataSourceContext,
  DataSourceTemplate,
  log
} from "@graphprotocol/graph-ts";
import { Transfer, Erc721 } from "../generated/Erc721/Erc721";
import { Collection, Collectible } from "../generated/schema";
import {
  ADDRESS_ZERO,
  COLLECTIBLE_ID_KEY,
  COZY_ADDRESS,
  getContentPath,
  getOrCreateAccount
} from "./utils";

import { IpfsContent } from "../generated/templates"

export function handleTransfer(event: Transfer): void {
  log.info("Address: {},tokenID: {}, transaction: {}", [event.address.toHexString(), event.params.tokenId.toHexString(), event.transaction.hash.toHexString()])
  let collection = Collection.load(event.address);
  if (collection != null) {
    let account = getOrCreateAccount(event.params.to);

    let tokenId = event.address.toHexString() + "-" + event.params.tokenId.toHexString();

    if (event.params.from.toHexString() == ADDRESS_ZERO.toHexString()) {
      // Mint token
      let item = new Collectible(Bytes.fromUTF8(tokenId));

      item.creator = account.id;
      item.owner = item.creator;
      item.revealed = false;
      item.tokenId = event.params.tokenId;
      item.collection = collection.id;
      item.created = event.block.timestamp;

      let tokenURIResult = Erc721.bind(event.address).try_tokenURI(
        event.params.tokenId
      );

      if (!tokenURIResult.reverted) {
        item.contentURI = tokenURIResult.value

        let contentPath = getContentPath(item.contentURI)
        item.ipfsHashURI = contentPath

        if (contentPath != "") {
          item.metadata = contentPath;
          IpfsContent.create(contentPath)
        }
      } else {
        item.contentURI = ""
        item.ipfsHashURI = ""
      }

      item.save();
    } else {
      let item = Collectible.load(Bytes.fromUTF8(tokenId));

      if (item != null) {
        if (event.params.to.toHexString() == ADDRESS_ZERO.toHexString()) {
          // Burn token
          item.removed = event.block.timestamp;
        } else {

          if (event.address.toHexString() == COZY_ADDRESS.toHexString() && item.revealed == false) {

            log.info("Address: {},tokenID: {}, transaction: {}", [event.address.toHexString(), event.params.tokenId.toHexString(), event.transaction.hash.toHexString()])

            let tokenURIResult = Erc721.bind(event.address).try_tokenURI(
              event.params.tokenId
            );

            if (!tokenURIResult.reverted) {
              var contentURI = tokenURIResult.value
              if (contentURI != item.contentURI) {
                item.contentURI = contentURI;
                item.revealed = true;

                let contentPath = getContentPath(item.contentURI)
                item.ipfsHashURI = contentPath

                if (contentPath != "") {
                  item.metadata = contentPath;
                  IpfsContent.create(contentPath)
                }
              }
            } else {
              item.contentURI = ""
              item.ipfsHashURI = ""
            }
          }

          // Transfer token
          item.owner = account.id;
          item.modified = event.block.timestamp;
        }

        item.save();
      }
    }
  }
}
