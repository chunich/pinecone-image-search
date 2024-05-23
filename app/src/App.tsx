import { useState, useEffect } from "react";
// import "./App.css";

interface Image {
  src: string;
  alt: string;
}

interface SearchResult {
  id: string;
  src: string;
  score: number;
}

function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [indexing, setIndexing] = useState(false);
  const [indexSuccess, setIndexSuccess] = useState(false);
  const pageSize = 20;

  const { hostname, protocol } = window.location;
  const host =
    hostname === "localhost" ? `${protocol}//${hostname}:3000` : origin;

  useEffect(() => {
    const fetchImages = async () => {
      // const response = await fetch(
      //   `${host}/getImages?page=${page}&pageSize=${pageSize}`
      // );
      // const data: Image[] = await response.json();

      const size = 48;
      const pokemonImages: Image[] = [];
      for (let i = 10; i < 10 + size; i++) {
        pokemonImages.push({
          src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`,
          alt: `${i} image`,
        });
      }
      // const mergedResults = [...pokemonImages, ...data];
      const mergedResults = [...pokemonImages];
      console.log(mergedResults);
      setImages(mergedResults);
    };

    fetchImages();
  }, [page, pageSize]);

  const handleIndexClick = async () => {
    setIndexing(true);
    const response = await fetch(`${host}/indexImages`);
    setIndexing(false);
    if (response.status === 200) {
      setIndexSuccess(true);
    }
  };

  const handleImageClick = async (imagePath: string) => {
    setSelectedImage(imagePath);
    const response = await fetch(
      `${host}/search?imagePath=${encodeURIComponent(imagePath)}`
    );
    const matchingImages: SearchResult[] = await response.json();
    setSearchResults(matchingImages);
  };

  console.log("searchResults: ", searchResults);

  return (
    <div className="min-h-screen bg-gray-800 text-white w-full">
      <div className="flex justify-center p-5">
        <h1 className="text-4xl">Image Search</h1>
      </div>
      <div className="p-5">
        <button
          onClick={handleIndexClick}
          className={`${
            indexSuccess ? "bg-green-500" : "bg-blue-400"
          } mr-4 py-2 px-4 bg-green-500 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md focus:outline-none`}
        >
          CLICK to Index all images
        </button>
        {indexing && (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 p-5">
        {images.map((image, index) => (
          <div
            key={index}
            className={`w-full bg-gray-600 rounded-md flex items-center justify-center ${
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
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center p-5">
        <button
          className="py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none mr-4"
          onClick={() => setPage((prevPage) => Math.max(prevPage - 1, 1))}
        >
          Previous
        </button>
        <button
          className="py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none"
          onClick={() => setPage((prevPage) => prevPage + 1)}
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 p-5">
        {searchResults.map((result, index) => (
          <div
            key={index}
            className="w-full h-60 bg-gray-600 rounded-md flex flex-col items-center justify-center my-2 overflow-hidden"
          >
            <img
              src={`http://localhost:3000/${result.src}`}
              alt="Search result"
              className="w-full h-4/5 object-cover"
            />
            <p className="w-full text-xs text-left bg-blue-500 text-white">
              Score: {result.score}
              <br />
              ID: {result.id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
