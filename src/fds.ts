import { Bytes, dataSource, json, JSONValueKind } from "@graphprotocol/graph-ts"
import { IpfsMetadata } from "../generated/schema"
import { IPFS_SCHEME, getIpfsURL } from "./utils"

export function handleTokenMetadata(content: Bytes): void {

  let ipfsData = new IpfsMetadata(dataSource.stringParam())

  let jsonResult = json.try_fromBytes(content)
  if (jsonResult.isError) return

  let value = jsonResult.value.toObject()
  if (value != null) {
    let name = value.get("name");
    if (name != null && name.kind == JSONValueKind.STRING) {
      ipfsData.name = name.toString();
    } else {
      ipfsData.name = ""
    }

    let description = value.get("description");
    if (description != null && description.kind == JSONValueKind.STRING) {
      ipfsData.description = description.toString();
    } else {
      ipfsData.description = ""
    }

    let image = value.get("image");
    if (image != null && image.kind == JSONValueKind.STRING) {
      let imageStr = image.toString();
      if (imageStr.includes(IPFS_SCHEME)) {
        imageStr = getIpfsURL(imageStr);
      }
      ipfsData.imageURL = imageStr;
    } else {
      ipfsData.imageURL = ""
    }
  }

  ipfsData.save()
}