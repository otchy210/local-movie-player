import React, { useState, useEffect } from 'react';
import DB from '../server/db';
import Loading from './Loading';
import Search from './Search';
import Player from './Player';

const App = () => {
    const [loading, setLoading] = useState(true);
    const [selectedMovie, selectMovie] = useState();
    useEffect(async () => {
        const res = await fetch('./resources/db.json');
        const json = await res.text();
        globalThis.db = new DB(JSON.parse(json));
        setLoading(false);
    }, []);
    const unselectMovie = () => {
        selectMovie(undefined);
    };

    return <>
        {loading && <Loading />}
        {!loading && <Search selectMovie={selectMovie}></Search>}
        {selectedMovie && <Player movie={selectedMovie} unselectMovie={unselectMovie}/>}
    </>
};

export default App;