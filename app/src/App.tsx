import { useState, useEffect, useCallback } from "react";
import Dropzone from "react-dropzone";
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

function App() {
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

  const fetchImages = useCallback(async () => {
    // Load up static files from public API
    const pokemonImages: Image[] = [];
    for (let i = 0; i < pageSize; i++) {
      const count = (page - 1) * pageSize + i;
      pokemonImages.push({
        src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${count}.png`,
        alt: `Image #${count}`,
      });
    }
    pokemonImages.push({
      src: "https://images.redbox.com/Images/EPC/boxArtVertical/7628.jpg?imwidth=276",
      alt: "",
    });
    pokemonImages.push({
      src: "https://images.redbox.com/Images/EPC/boxArtVertical/218163.jpg?imwidth=276",
      alt: "",
    });
    console.log({ pokemonImages });
    setImages(pokemonImages);
  }, [page, pageSize]);

  useEffect(() => {
    void fetchImages();
  }, [page, pageSize, fetchImages]);

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

      <div className="flex justify-center p-5">
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
      </div>

      <h3 className="text-4xl mr-5">
        NOTE: Results are stored locally on disk
      </h3>
      <div className="grid grid-cols-4 gap-2 p-5">
        {searchResults?.map((result, index) => (
          <div
            key={index}
            className={`w-full h-60 bg-gray-600 rounded-md flex flex-col items-center justify-center my-2 overflow-hidden
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
  );
}

export default App;
