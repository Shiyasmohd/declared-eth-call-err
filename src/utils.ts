import { Address, ipfs, json, JSONValueKind } from "@graphprotocol/graph-ts";
import { Account, Collectible } from "../generated/schema";

export const ADDRESS_ZERO = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

export let IPFS_SCHEME = "ipfs://";

export let HTTP_SCHEME = "https://";

export let BASE_IPFS_URL = "https://ipfs.io/ipfs/";

export let BASE_IPINATA_URL = "https://gateway.pinata.cloud/ipfs/";

export let DWEB_IPFS_URL = "https://dweb.link/ipfs/";

export let COZY_ADDRESS = Address.fromString(
  "0x32319834d90323127988E4e2DC7b2162d4262904"
);

export let COLLECTIBLE_ID_KEY = "collectibleID"

export function getURIScheme(input: string): string {
  return input.split(":")[0];
}

export function getIpfsPath(ipfsURI: string): string {
  return ipfsURI.split("ipfs://")[1];
}

export function getIpfsURL(ipfsURI: string): string {
  return BASE_IPFS_URL + getIpfsPath(ipfsURI);
}

export function getOrCreateAccount(
  address: Address,
  persist: boolean = true
): Account {
  let account = Account.load(address);

  if (account == null) {
    account = new Account(address);
    account.address = address;

    if (persist) {
      account.save();
    }
  }

  return account as Account;
}

export function getDwebURL(ipfsURI: string): string {
  let ipfsURL = DWEB_IPFS_URL + getIpfsPath(ipfsURI);
  return ipfsURL;
}

export function readMetadata(
  collectible: Collectible,
  tokenURI: string
): Collectible {
  if (tokenURI != null || tokenURI != "") {
    let contentPath: string;
    if (tokenURI.startsWith(HTTP_SCHEME) && tokenURI.length > HTTP_SCHEME.length) {
      contentPath = tokenURI.split(BASE_IPFS_URL).join("");
    } else if (tokenURI.startsWith(IPFS_SCHEME) && tokenURI.length > IPFS_SCHEME.length) {
      contentPath = tokenURI.split(IPFS_SCHEME).join("");
    } else {
      return collectible;
    }

    let data = ipfs.cat(contentPath);
    if (!data) return collectible;

    let jsonResult = json.try_fromBytes(data);
    if (jsonResult.isError) return collectible;

    let value = jsonResult.value.toObject();
    if (value != null) {
      let name = value.get("name");
      if (name != null && name.kind == JSONValueKind.STRING) {
        collectible.name = name.toString();
      } else {
        return collectible;
      }

      let description = value.get("description");
      if (description != null && description.kind == JSONValueKind.STRING) {
        collectible.description = description.toString();
      } else {
        return collectible;
      }

      let image = value.get("image");
      if (image != null && image.kind == JSONValueKind.STRING) {
        let imageStr = image.toString();
        if (imageStr.includes(IPFS_SCHEME)) {
          imageStr = getIpfsURL(imageStr);
        }
        collectible.imageURL = imageStr;
      } else {
        return collectible;
      }
    }
    
    return collectible;
  }
  
  return collectible;
}

export function getContentPath(tokenURI: string): string {
  if (tokenURI.startsWith(HTTP_SCHEME) && tokenURI.length > HTTP_SCHEME.length) {
    return tokenURI.split(BASE_IPFS_URL).join("")
  } else if (tokenURI.startsWith(IPFS_SCHEME) && tokenURI.length > IPFS_SCHEME.length) {
    return tokenURI.split(IPFS_SCHEME).join("")
  } else {
    return ""
  }
}
