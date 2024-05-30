Cannot find package 'ts-node'
npm i ts-node -D

Unexpected token '??='
Need node v15+

fetch(https://localhost:3000/{path}....)

Pinecone FREE region

- PINECONE_REGION="us-east-1"

Need CORS

- localhost:5173 (react) -> localhost:3000 (node)
  `npm i cors`
  `npm i --save-dev @types/cors`

<img src={`http://localhost:3000/${image.src}`} alt={image.alt} />
<img
src={`http://localhost:3000/${result.src}`}
alt="Search result"
className="w-full h-4/5 object-cover"
/>

```
// Return the embedding in a format ready for Pinecone
      return {
        id,
        metadata: metadata || {
          imagePath,
          name,
        },
        values: Array.from([
          ...image_embeddings,
          ...text_embeddings,
        ]) as number[],
      };
```

Error upserting chunk PineconeBadRequestError: Vector dimension 1024 does not match the dimension of the index 512

`npm i --save multer @types/multer react-dropzone`
