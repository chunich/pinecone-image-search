import { useState, useEffect, useCallback } from "react";
import Dropzone from "react-dropzone";
import { listFiles, getEnv } from "utils";
// import "./App.css";

interface Image {
  src: string;
  alt: string;
}

interface SearchResult {
  id: string;
  src: string;
  score: number;
  name: string;
}

interface LocalFiles {
  imagePaths: string[];
}

function App() {
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [localImageName, setLocalImageName] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [indexing, setIndexing] = useState(false);
  const [indexSuccess, setIndexSuccess] = useState(false);
  const pageSize = 24;

  const { hostname, protocol } = window.location;
  const host =
    hostname === "localhost" ? `${protocol}//${hostname}:3000` : origin;

  // const getPokemonImages = () => {
  //   const pokemonImages: Image[] = [];
  //   for (let i = 0; i < pageSize; i++) {
  //     const count = (page - 1) * pageSize + i;
  //     pokemonImages.push({
  //       src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${count}.png`,
  //       alt: `Image #${count}`,
  //     });
  //   }
  //   return pokemonImages;
  // };

  const fetchImages = useCallback(async () => {
    const getBoxartImages = () => {
      return [
        "7628.jpg",
        "200147.jpg",
        "218163.jpg",
        "200325.jpg",
        "8143.jpg",
        "203239.jpg",
        "208520.jpg",
        "218164.jpg",
        "213642.jpg",
        "215398.jpg",
        "4038.jpg",
      ].map((img) => {
        return {
          src: `https://images.redbox.com/Images/EPC/boxArtVertical/${img}?imwidth=276`,
          alt: img,
        };
      });
    };

    const getRandomImages = () => {
      return [
        "https://ntvb.tmsimg.com/assets/assets/1443_v9_bc.jpg?w=270&h=360",
        "https://images.unsplash.com/photo-1560275619-4662e36fa65c?q=80&w=276&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1591361795351-cc722122c1d3?w=276&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1529946179074-87642f6204d7?w=276&auto=format&fit=crop&q=60",
        "https://static0.cbrimages.com/wordpress/wp-content/uploads/2024/01/keanu-reeves-john-wick-4-theatrical-poster-2023.jpg",
        "https://image.tmdb.org/t/p/w300/jj2Gcobpopokal0YstuCQW0ldJ4.jpg",
        "https://static.displate.com/brand/layout/82c9846f-d928-45ff-a95e-0ab53d87f4e4/avatarStandard.jpg",
        "https://w7.pngwing.com/pngs/244/439/png-transparent-pikachu-drawing-anime-pokemon-pikachu-leaf-cartoon-flower-thumbnail.png",
        "https://seeklogo.com/images/M/marvel-comics-logo-31D9B4C7FB-seeklogo.com.png",
        "https://b.thumbs.redditmedia.com/_11wNOUhjCtrzAaghwBba5Z0Cxy4yuyVERdlZSffgyY.jpg",
        "https://img10.hotstar.com/image/upload/f_auto,h_156/sources/r1/cms/prod/1334/1541334-t-7238810333b4",
        "https://rlv.zcache.com/jurassic_world_white_logo_paper_plates-rcb738cfe278a450b946881e2cb88fc26_zkbhg_307.jpg?rlvnet=1",
        "https://i.ytimg.com/vi/AMn9ML3lLnM/oar2.jpg",
        "https://png.pngtree.com/thumb_back/fh260/background/20190221/ourmid/pngtree-orange-solid-color-shading-texture-image_23441.jpg",
        "https://png.pngtree.com/thumb_back/fh260/background/20190223/ourmid/pngtree-solid-color-matte-background-blue-gradient-wind-background-color-mattesolid-backgroundblue-image_84871.jpg",
        "https://w7.pngwing.com/pngs/929/274/png-transparent-yellow-color-solid-green-yellow-s-blue-angle-text-thumbnail.png",
      ].map((img, index) => {
        return {
          src: img,
          alt: `Img #${index}`,
        };
      });
    };

    // Load up static files from public API
    let images = [];
    const boxartImages = getBoxartImages();
    const randomImages = getRandomImages();
    images = [...boxartImages, ...randomImages];
    setImages(images);
  }, []);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  const handleImageDrop = async (acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch(`${host}/uploadImages?pageSize=${pageSize}`, {
      method: "POST",
      body: formData,
    });

    if (response.status === 200) {
      const { pageOfFirstImage } = await response.json();
      await fetchImages();
      setPage(pageOfFirstImage);
      const imageOrImages = acceptedFiles.length > 1 ? "Images" : "Image";
      alert(`${imageOrImages} uploaded successfully`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!localImageName) return;

    const response = await fetch(
      `${host}/deleteImage?imagePath=${encodeURIComponent(localImageName)}`,
      { method: "DELETE" }
    );
    if (response.status === 200) {
      setSelectedImage(null);
      await fetchImages();
      alert("Image deleted successfully");
    }
  };

  const handleIndexClick = async () => {
    setIndexing(true);
    const response = await fetch(`${host}/indexImages`);
    setIndexing(false);
    if (response.status === 200) {
      setIndexSuccess(true);
    }
  };

  const handleSelectChange = async (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const name: string = event.currentTarget.value;
    setSelectedName(name);

    // Only submit if IMAGE has selected
    if (selectedImage) {
      const response = await fetch(
        `${host}/search?name=${encodeURIComponent(
          name
        )}&imagePath=${encodeURIComponent(selectedImage)}`
      );
      const matchingImages: SearchResult[] = await response.json();
      setSearchResults(matchingImages);
    }
  };

  const handleImageClick = async (imagePath: string) => {
    setSelectedImage(imagePath);

    // Only submit if NAME has selected
    if (selectedName) {
      const response = await fetch(
        `${host}/search?name=${encodeURIComponent(
          selectedName
        )}&imagePath=${encodeURIComponent(imagePath)}`
      );
      const matchingImages: SearchResult[] = await response.json();
      setSearchResults(matchingImages);
    } else {
      const response = await fetch(
        `${host}/search?imagePath=${encodeURIComponent(imagePath)}`
      );
      const matchingImages: SearchResult[] = await response.json();
      setSearchResults(matchingImages);
    }
  };

  const handleLocalImageClick = async (imagePath: string) => {
    setLocalImageName(imagePath);
  };

  console.log("searchResults: ", searchResults);

  const fetchLocalFiles = useCallback(async () => {
    const response = await fetch(`${host}/listLocalFiles`, {
      method: "GET",
    });
    const json: LocalFiles = await response.json();
    setLocalImages(json.imagePaths);
  }, [host]);

  useEffect(() => {
    void fetchLocalFiles();
  }, [host, fetchLocalFiles]);

  return (
    <div className="min-h-screen bg-gray-800 text-white w-full">
      <div className="flex place-items-center p-5">
        <h1 className="text-4xl mr-5">Image Search</h1>
        <br />
        <Dropzone onDrop={handleImageDrop}>
          {({ getRootProps, getInputProps }) => (
            <section className="mx-5 border-dashed rounded-lg border-2 border-white hover:cursor-pointer">
              <div
                {...getRootProps()}
                className="p-5 flex justify-center items-center"
              >
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>
        <br />
        <div className="flex flex-col font-mono text-xs">
          <div>[images] are stored in Pinecone DB</div>
          <div>
            1 - Create embeddings for ALL images, with metadata (imagePath,
            name)
          </div>
          <div>2 - Select image, create embedding</div>
          <div>3 - Submit query (with OPTIONAL name filter)</div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex place-items-center gap-10 border-2 rounded-lg border-gray-700">
          <div className="rounded-lg p-1">
            Name: {selectedName ? selectedName : "N/A"}
          </div>
          <select
            className="p-1 cursor-pointer"
            onChange={handleSelectChange}
            name="monsterName"
          >
            <option value="">Select Name</option>
            <option>Alo</option>
            <option>Alolan Sandslash</option>
            <option>Beedrill</option>
            <option>Bul</option>
            <option>Bulbasaur</option>
            <option>Butterfree</option>
            <option>Char</option>
            <option>Chansey</option>
          </select>

          <button
            // disabled
            onClick={handleIndexClick}
            className={`${indexSuccess ? "bg-green-500" : "bg-blue-400"} 
            
            mr-4 py-2 px-4 bg-green-500 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md focus:outline-none`}
          >
            CLICK to Index all images
          </button>
          <button
            className="text-red-100 bg-red-500 hover:bg-red-700 focus:shadow-red-700 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
            onClick={handleDeleteConfirm}
          >
            Delete {localImageName}
          </button>
          {indexing && (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-5">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative w-50 bg-gray-600 rounded-md flex items-center justify-center ${
              image.src === selectedImage ? "border-4 border-blue-500" : ""
            }`}
            onClick={() => handleImageClick(image.src)}
          >
            <img
              src={
                image.src.indexOf("data") > -1
                  ? `http://localhost:3000/${image.src}`
                  : image.src
              }
              alt={image.alt}
              title={image.alt}
            />
            <p className={`absolute text-xs bottom-0`}>{image.alt}</p>
          </div>
        ))}
      </div>

      {/* <div className="flex justify-center p-5">
        <button
          className="py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none mr-4"
          onClick={() => setPage((prevPage) => Math.max(prevPage - 1, 1))}
        >
          Previous [{page - 1}]
        </button>
        <div className="grid place-items-center mr-4 ">Current: {page}</div>
        <button
          className="py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none"
          onClick={() => setPage((prevPage) => prevPage + 1)}
        >
          Next [{page + 1}]
        </button>
      </div> */}

      <div className="flex flex-col justify-center p-5">
        <h4 className="text-2xl mr-5">
          {searchResults.length} closest matches on disk
        </h4>
        <div className="grid grid-cols-6 gap-2">
          {searchResults?.map((result, index) => (
            <div
              key={index}
              className={`w-full h-auto bg-gray-600 rounded-md flex flex-col items-center justify-center my-2 overflow-hidden
            ${result.src === localImageName ? "border-4 border-blue-500" : ""}`}
              onClick={() => handleLocalImageClick(result.src)}
            >
              <img
                src={`http://localhost:3000/${result.src}`}
                alt="Search result"
                className="w-full h-4/5 object-cover"
              />
              <p className="w-full text-xs text-left bg-blue-500 text-white">
                Score: {result.score}
                <br />
                Name: {result.src}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center p-5">
        <h4 className="text-2xl mr-5">{localImages.length} images on disk</h4>
        <div className="grid grid-cols-12 gap-2">
          {localImages?.map((result, index) => (
            <div
              key={index}
              className={`w-full h-auto bg-gray-600 rounded-md flex flex-col items-center justify-center my-2 overflow-hidden
            ${result === localImageName ? "border-4 border-blue-500" : ""}`}
              onClick={() => handleLocalImageClick(result)}
            >
              <img
                src={`http://localhost:3000/${result}`}
                alt="Search result"
                className="w-full h-4/5 object-cover"
              />
              <p className="w-full text-xs text-left bg-blue-500 text-white">
                {result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
