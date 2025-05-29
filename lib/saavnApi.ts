import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';
import TrackList from './TrackList';
import FeaturedTracks from './FeaturedTracks';
import PlayerControls from './PlayerControls';
import Queue from './Queue';
import VolumeControl from './VolumeControl';
import Playlists from './Playlists';
import PlaylistDetail from './PlaylistDetail';
import { usePlaylist } from '../context/PlaylistContext';
import { Music, Settings, Headphones, Search, Clock, Sparkles, X, ListMusic } from 'lucide-react';

function MusicPlayer() {
    const [searchResults, setSearchResults] = useState([]);
    const [artistTracks, setArtistTracks] = useState([]);
    const [currentArtist, setCurrentArtist] = useState(null);
    const [artistsList, setArtistsList] = useState([]);
    const [trendingTracks, setTrendingTracks] = useState([]);
    const [isLoadingTrending, setIsLoadingTrending] = useState(true);
    const [isLoadingArtistTracks, setIsLoadingArtistTracks] = useState(false);
    const [activeCategory, setActiveCategory] = useState('english');
    const [focusMode, setFocusMode] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const { activePlaylist } = usePlaylist();

    // Categories for music selection - now includes playlists
    const categories = [
        { id: 'hindi', name: 'Hindi' },
        { id: 'english', name: 'English' },
        { id: 'punjabi', name: 'Punjabi' },
        { id: 'tamil', name: 'Tamil' },
        { id: 'telugu', name: 'Telugu' },
        { id: 'playlists', name: 'My Playlists', icon: <ListMusic size={16} className="mr-1" /> }
    ];

    // Format songs from API response
    const formatSongs = (songs) => {
        return songs.map(song => ({
            id: song.id,
            name: song.name,
            artists: song.artists && song.artists.primary
                ? song.artists.primary.map(artist => ({
                    id: artist.id,
                    name: artist.name,
                    url: artist.url,
                    image: artist.image && artist.image.length > 0 ? artist.image[1]?.url : ''
                }))
                : song.primaryArtists
                    ? song.primaryArtists.split(',').map(name => ({ name: name.trim() }))
                    : [{ name: 'Unknown Artist' }],
            album: {
                name: song.album?.name || 'Unknown Album',
                images: song.image ? [
                    { url: song.image[2]?.link || song.image[2]?.url || '' },
                    { url: song.image[1]?.link || song.image[1]?.url || '' },
                    { url: song.image[0]?.link || song.image[0]?.url || '' }
                ] : [{ url: '' }, { url: '' }, { url: '' }]
            },
            duration_ms: song.duration * 1000 || 0,
            download_url: song.downloadUrl && song.downloadUrl.length > 0
                ? song.downloadUrl[song.downloadUrl.length - 1].link || song.downloadUrl[song.downloadUrl.length - 1].url
                : null
        }));
    };

    // Load trending tracks on component mount or category change
    useEffect(() => {
        const loadTrendingTracks = async () => {
            // Skip loading tracks when in playlists category
            if (activeCategory === 'playlists') {
                setIsLoadingTrending(false);
                return;
            }

            try {
                setIsLoadingTrending(true);

                // Predefined playlist URLs for each category
                const playlistUrls = {
                    hindi: 'https://www.jiosaavn.com/featured/trending-hits/GVABefAdtVAZNLR,rP3WSg__',
                    english: 'https://www.jiosaavn.com/featured/english-viral-hits/pm49jiq,CNs_',
                    punjabi: 'https://www.jiosaavn.com/featured/punjabi-trending-hits/vInkpyiMhI6qKl4yv5iIvA__',
                    tamil: 'https://www.jiosaavn.com/featured/trending-pop-tamil/5z8vKjNnhmIGSw2I1RxdhQ__',
                    telugu: 'https://www.jiosaavn.com/featured/-trending-tracks/FWB5iMCkujuQbUI04mhbCA__'
                };

                // Get playlist URL for active category
                const playlistUrl = playlistUrls[activeCategory];

                if (playlistUrl) {
                    console.log(`Fetching trending ${activeCategory} songs from playlist:`, playlistUrl);

                    // English playlist needs special handling
                    if (activeCategory === 'english') {
                        // For English, use a more reliable fixed playlist token instead of the URL
                        const playlistId = 'pm49jiq,CNs_';

                        try {
                            // First try to get a better playlist ID through search
                            const searchResponse = await axios.get(`https://saafy-api.vercel.app/api/search?query=${encodeURIComponent('english popular hits')}`);

                            if (searchResponse.data?.success && searchResponse.data.data?.topQuery?.results) {
                                const topQueryResults = searchResponse.data.data.topQuery.results;
                                const relevantPlaylist = topQueryResults.find(item =>
                                    item.type === 'playlist' &&
                                    item.title.toLowerCase().includes('english')
                                );

                                if (relevantPlaylist) {
                                    console.log('Found English playlist from search:', relevantPlaylist.title);

                                    // Extract the token from the URL
                                    const playlistUrlParts = relevantPlaylist.url.split('/');
                                    const playlistToken = playlistUrlParts[playlistUrlParts.length - 1];

                                    const idResponse = await axios.get(`https://saafy-api.vercel.app/api/playlists?id=${playlistToken}`);

                                    if (idResponse.data?.data?.songs) {
                                        console.log('English playlist songs found:', idResponse.data.data.songs.length);
                                        const formattedSongs = formatSongs(idResponse.data.data.songs);

                                        // Apply additional English filter
                                        const playableTracks = formattedSongs.filter(track =>
                                            track.download_url &&
                                            /^[a-zA-Z0-9\s\W]+$/.test(track.name)
                                        );

                                        if (playableTracks.length > 0) {
                                            console.log('English playable tracks:', playableTracks.length);
                                            setTrendingTracks(playableTracks);
                                            setIsLoadingTrending(false);
                                            return;
                                        }
                                    }
                                }
                            }

                            // If dynamic method fails, fall back to a known working English playlist ID
                            const backupResponse = await axios.get('https://saafy-api.vercel.app/api/playlists?id=1083318977');

                            if (backupResponse.data?.data?.songs) {
                                console.log('Backup English playlist songs found:', backupResponse.data.data.songs.length);
                                const formattedSongs = formatSongs(backupResponse.data.data.songs);
                                const playableTracks = formattedSongs.filter(track => track.download_url);

                                if (playableTracks.length > 0) {
                                    setTrendingTracks(playableTracks);
                                    setIsLoadingTrending(false);
                                    return;
                                }
                            }
                        } catch (error) {
                            console.error('Error with English playlist:', error);
                        }
                    } else {
                        // For non-English playlists, first try the link approach
                        try {
                            const encodedUrl = encodeURIComponent(playlistUrl);
                            const playlistResponse = await axios.get(`https://saafy-api.vercel.app/api/playlists?link=${encodedUrl}`);

                            if (playlistResponse.data?.data?.songs && playlistResponse.data.data.songs.length > 0) {
                                console.log('Playlist songs found:', playlistResponse.data.data.songs.length);
                                const formattedSongs = formatSongs(playlistResponse.data.data.songs);
                                const playableTracks = formattedSongs.filter(track => track.download_url);

                                if (playableTracks.length > 0) {
                                    setTrendingTracks(playableTracks);
                                    setIsLoadingTrending(false);
                                    return;
                                }
                            }
                        } catch (error) {
                            console.error('Error with direct playlist URL:', error);
                        }

                        // If link approach fails, try the ID approach
                        try {
                            const urlParts = playlistUrl.split('/');
                            const rawPlaylistId = urlParts[urlParts.length - 1];

                            const idResponse = await axios.get(`https://saafy-api.vercel.app/api/playlists?id=${rawPlaylistId}`);

                            if (idResponse.data?.data?.songs) {
                                console.log('Playlist songs found using ID:', idResponse.data.data.songs.length);
                                const formattedSongs = formatSongs(idResponse.data.data.songs);
                                const playableTracks = formattedSongs.filter(track => track.download_url);

                                if (playableTracks.length > 0) {
                                    setTrendingTracks(playableTracks);
                                    setIsLoadingTrending(false);
                                    return;
                                }
                            }
                        } catch (error) {
                            console.error('Error fetching by ID:', error);
                        }
                    }
                }

                // If we're still here, all playlist approaches failed
                // Use a last resort language-specific search
                console.log('All playlist methods failed, trying language-specific search');

                try {
                    // Last resort approach with language in the query
                    const languageTerms = {
                        hindi: 'hindi songs trending',
                        english: 'english songs popular',
                        punjabi: 'punjabi songs latest',
                        tamil: 'tamil songs trending',
                        telugu: 'telugu songs hits'
                    };

                    const finalResponse = await axios.get(`https://saafy-api.vercel.app/api/search/songs?query=${encodeURIComponent(languageTerms[activeCategory])}`);

                    if (finalResponse.data?.data?.results) {
                        console.log('Language-specific search found:', finalResponse.data.data.results.length);
                        const formattedSongs = formatSongs(finalResponse.data.data.results);

                        // Apply language filter for English
                        const playableTracks = activeCategory === 'english'
                            ? formattedSongs.filter(track =>
                                track.download_url &&
                                /^[a-zA-Z0-9\s\W]+$/.test(track.name))
                            : formattedSongs.filter(track => track.download_url);

                        console.log('Final playable tracks:', playableTracks.length);
                        setTrendingTracks(playableTracks);
                    } else {
                        setTrendingTracks([]);
                    }
                } catch (error) {
                    console.error('Error in final fallback approach:', error);
                    setTrendingTracks([]);
                }
            } catch (error) {
                console.error('Error loading trending tracks:', error);
                setTrendingTracks([]);
            } finally {
                setIsLoadingTrending(false);
            }
        };

        loadTrendingTracks();
    }, [activeCategory]);

    // Extract unique artists from search results
    useEffect(() => {
        if (searchResults.length === 0) {
            setArtistsList([]);
            return;
        }

        const allArtists = searchResults.flatMap(track => track.artists)
            .filter(artist => artist.id && artist.image);

        const uniqueArtists = [];
        const artistIds = new Set();

        for (const artist of allArtists) {
            if (!artistIds.has(artist.id)) {
                artistIds.add(artist.id);
                uniqueArtists.push(artist);
            }
        }

        setArtistsList(uniqueArtists);
    }, [searchResults]);

    // Load artist tracks when currentArtist changes
    useEffect(() => {
        const loadArtistTracks = async () => {
            if (!currentArtist || !currentArtist.id) {
                setIsLoadingArtistTracks(false);
                setArtistTracks([]);
                return;
            }

            try {
                setIsLoadingArtistTracks(true);

                const response = await axios.get(`https://saafy-api.vercel.app/api/artists/${currentArtist.id}/songs`);

                if (response.data && response.data.data && response.data.data.songs) {
                    const formattedSongs = formatSongs(response.data.data.songs);
                    const searchResultIds = searchResults.map(track => track.id);
                    const playableTracks = formattedSongs
                        .filter(track => track.download_url && !searchResultIds.includes(track.id))
                        .slice(0, 10);

                    setArtistTracks(playableTracks);
                } else {
                    setArtistTracks([]);
                }
            } catch (error) {
                console.error(`Error loading tracks for artist ${currentArtist.name}:`, error);
                setArtistTracks([]);
            } finally {
                setIsLoadingArtistTracks(false);
            }
        };

        if (currentArtist) {
            loadArtistTracks();
        }
    }, [currentArtist, searchResults]);

    const selectArtist = (artist) => {
        setCurrentArtist(artist);
    };

    const handleSearchResults = (results) => {
        setArtistTracks([]);
        setCurrentArtist(null);
        const playableTracks = results.filter(track => track.download_url);
        setSearchResults(playableTracks);
    };

    const toggleFocusMode = () => {
        setFocusMode(!focusMode);
    };

    const toggleQueue = () => {
        setShowQueue(!showQueue);
    };

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${focusMode ? 'pb-24' : 'pb-36'}`}>
            <div className={`max-w-7xl mx-auto ${focusMode ? 'opacity-75 dark:opacity-60' : ''} transition-opacity duration-300`}>
                <div className="px-4 sm:px-6 lg:px-8">
                    <header className="py-6 sm:py-8 relative">
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center"
                            >
                                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-transparent">
                                    Saafy
                                </h1>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-2xl mx-auto mb-8"
                        >
                            <SearchBar onSearchResults={handleSearchResults} />
                        </motion.div>

                        {/* Elegant wave background element */}
                        <motion.div
                            className="absolute -z-10 top-0 right-0 opacity-10 text-indigo-500"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <svg width="350" height="350" viewBox="0 0 350 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20,100 Q150,-50 300,120 T600,100" stroke="currentColor" strokeWidth="2" fill="none" />
                                <path d="M20,150 Q150,0 300,170 T600,150" stroke="currentColor" strokeWidth="2" fill="none" />
                                <path d="M20,200 Q150,50 300,220 T600,200" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                        </motion.div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 space-y-8">
                            {searchResults.length === 0 && (
                                <section>
                                    <motion.div
                                        className="mb-6"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((category, index) => (
                                                <motion.button
                                                    key={category.id}
                                                    onClick={() => setActiveCategory(category.id)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${activeCategory === category.id
                                                        ? 'bg-indigo-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                        }`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 + index * 0.05 }}
                                                >
                                                    {category.icon}
                                                    {category.nam
