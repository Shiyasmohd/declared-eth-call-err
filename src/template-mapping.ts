import { log } from "@graphprotocol/graph-ts";
import { Erc721, Transfer } from "../generated/Erc721/Erc721";
import { Collection } from "../generated/schema";
import { ERC721 } from "../generated/templates";

export function handleTransfer(event: Transfer): void {
  let collection = Collection.load(event.address);

  if (collection == null) {
    collection = new Collection(event.address);
    collection.collectionAddress = event.address;

    let erc721 = Erc721.bind(event.address);

    let name = erc721.try_name();
    if (!name.reverted) {
      collection.collectionName = name.value;
    } else {
      collection.collectionName = "";
    }

    let symbol = erc721.try_symbol();
    if (!symbol.reverted) {
      collection.collectionSymbol = symbol.value;
    } else {
      collection.collectionSymbol = "";
    }
    
    collection.save();

    ERC721.create(event.address);
  }
}
