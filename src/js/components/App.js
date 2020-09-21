import React, { useState, useEffect } from 'react';
import DB from '../server/db';
import Search from './Search';

const App = () => {
    const [db, setDb] = useState();
    useEffect(() => {
        const db = new DB(globalThis.db);
        setDb(db);
    }, []);
    return <>
        {db && <Search db={db}></Search>}
    </>
};

export default App;