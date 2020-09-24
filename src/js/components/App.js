import React, { useState, useEffect } from 'react';
import DB from '../server/db';
import Search from './Search';
import Player from './Player';

const App = () => {
    const [db, setDb] = useState();
    const [selectedMovie, selectMovie] = useState();
    useEffect(() => {
        const db = new DB(globalThis.db);
        setDb(db);
    }, []);
    const unselectMovie = () => {
        selectMovie(undefined);
    };

    return <>
        {db && <Search db={db} selectMovie={selectMovie}></Search>}
        {selectedMovie && <Player movie={selectedMovie} unselectMovie={unselectMovie}/>}
    </>
};

export default App;