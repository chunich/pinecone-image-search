# Source

Forked from https://github.com/pinecone-io/image-search-example

# This Version

![image](https://github.com/chunich/pinecone-image-search/assets/80179854/fa32a66a-e4b0-43ba-9359-56d900087d1f)

# Questions

## 06/04/2024

- Added reference for easy upload and delete without re-indexing everything, credit: https://github.com/pinecone-io/image-search-example/pull/9/files
- Removed `metric: "euclidean"` as is it not accurate (right now)

## 05/30/2024

- Added `Dropzone` and code that allows drag-n-drop upsert
- Added few Keanu images to /data for now

## 05/24/2024

- Wiped out search-images index on Pinecone
- Started small, included `text_inputs` with sentences when indexing
- Use `<select>` option as `name` value during query
- Combining embeddings of images and texts into aggregates
  - `concat` expands dimensions to 1024
  - `weighted` keeps it at 512, but hit-or-miss somehow 🤷‍♂️
- Lost `metadata.name` somehow, not important

## 05/23/2024

- Re-embedded images with `metadata.name`, new structure on Pinecone now has

```
{
  ID: aaaa-bbbb-cccc-dddd,
  VALUES: [0.0348193273, 0.0330491178, 0.00437883893...],
  METADATA: {
    imagePath: 'data/Chansey-4f244b49f1f74aa78cfdc6b5f1f983a0_jpg.rf.34f41a60c5f0f27cad47ab2207f02132.jpg`,
    name: 'Chansey'
  }
}
```

- query now works with metadata filtering, with string-equality check `$eq`, per doc: https://docs.pinecone.io/guides/data/filter-with-metadata
- `vector` values are still REQUIRED, `filter` only narrows it down
- `$regex` is NOT supported 😔

## 05/23/2024

- `text_inputs` from `embeddings.ts` seem to have very little (or none) impact on the search results
- `image_inputs` generated seems to be driving the query criteria
