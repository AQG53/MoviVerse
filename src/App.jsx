import React, { useEffect, useState } from 'react'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use'; 
import { getTrendingMovies, updateSearchCount } from './appwrite.js';


const API_DISCOVER_URL='https://api.themoviedb.org/3/discover/movie'
const API_SEARCH_URL='https://api.themoviedb.org/3/search/movie'
const API_TRENDING_URL='https://api.themoviedb.org/3/trending/movie/week'
const API_KEY=import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [TrendingMoviesErrorMessage, setTrendingMoviesErrorMessage] = useState('')
  const [movieList, setMovieList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearchTerm, setdebouncedSearchTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);

  //To stop too many API requests by waiting for user to stop typing
  useDebounce(() => setdebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = query
      ? `${API_SEARCH_URL}?query=${encodeURIComponent(query)}`
      : `${API_DISCOVER_URL}?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if(data.response === 'False') {
        setErrorMessage(data.error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);
     
      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  //Using database to dynamically fetch trending movies by counting movie search requests by users
  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  }
  
  //Using TMDB's trending api to fetch trending movies
  const loadTrendingMovies2 = async () => {
    try {
      const endpoint = `${API_TRENDING_URL}`;

      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if(data.response === 'False') {
        setTrendingMoviesErrorMessage(data.error || 'Failed to fetch trending movies');
        setTrendingMovies([]);
        return;
      }

      setTrendingMovies(data.results || []);
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setTrendingMoviesErrorMessage('Error fetching trending movies. Try again later.');
    }
  }

  const scrollTrending = (direction) => {
  const container = document.getElementById("trending-container");
  const scrollAmount = 300;
  if (container) {
    container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  }
};


  useEffect(() => {
    loadTrendingMovies2()
  }, [])

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm])

  return (
    <main>
      <div className='pattern'>
        <div className='wrapper'>
          <header>
            <img src="/hero.png" alt="Hero Banner" />
            <h1>Find <span className='text-gradient'>Movies</span> You Love at Your Fingertips</h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
          </header>

          <section className="trending relative">
            <h2>Trending Movies</h2>

            {TrendingMoviesErrorMessage ? (
              <p className="text-red-500">{TrendingMoviesErrorMessage}</p>
            ) : trendingMovies.length > 0 && (
              <div className="relative mt-4">
                <button
                  className="scroll-arrow left-0"
                  onClick={() => scrollTrending(-1)}
                >
                  ◀
                </button>

                <ul
                  id="trending-container"
                  className="flex flex-row overflow-x-auto gap-5 -mt-10 w-full hide-scrollbar scroll-smooth"
                >
                  {trendingMovies.map((movie, index) => (
                    <li key={movie.id} className="min-w-[230px] flex flex-row items-center">
                      <p className="fancy-text mt-[22px] text-nowrap">{index + 1}</p>
                      <img
                        src={movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                          : '/nomovie.png'}
                        alt={movie.title}
                        className="w-[127px] h-[163px] rounded-lg object-cover -ml-3.5"
                      />
                    </li>
                  ))}
                </ul>

                <button
                  className="scroll-arrow right-0"
                  onClick={() => scrollTrending(1)}
                >
                  ▶
                </button>
              </div>
            )}
          </section>

          <section className='all-movies'>
            <h2 className='mt-[40px]'>All Movies</h2>
            

            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
              <ul>
                {movieList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie}/>
                ))}
              </ul>
            )}
          </section>

          <footer className="c-space pt-10 pb-3 flex justify-between items-center flex-wrap gap-5">
            <div className="text-white flex gap-2">
                <p>Terms & Conditions</p>
                <p>|</p>
                <p>Privacy Policy</p>
            </div>
            <div className="flex gap-3">
                <a href="https://github.com/AQG53" target="_blank" className="social-icon">
                    <img src="/github.svg" alt="github" className="w-1/2 h-1/2"/>
                </a>
                <a href="https://x.com/AbizerQ" target="_blank" className="social-icon">
                    <img src="/twitter.svg" alt="twitter" className="w-1/2 h-1/2"/>
                </a>
                <a href="https://www.linkedin.com/in/abizer-qutbuddin/" target="_blank" className="social-icon">
                    <img src="/linkedin.svg" alt="linkedin" className="w-1/2 h-1/2"/>
                </a>
                <a href="https://www.instagram.com/abizerqutbuddin/" target="_blank" className="social-icon">
                    <img src="/instagram.svg" alt="instagram" className="w-1/2 h-1/2"/>
                </a>
            </div>
            <p className="text-white">Made with ❤️ by Abizar Qutbuddin</p>
          </footer>
        </div>
      </div>
    </main>
    
  )
}

export default App