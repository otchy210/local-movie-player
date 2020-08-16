import React, { useState, useEffect } from 'react';
import Search from './Search';

const INIT_URL = 'ws://localhost:3000/init';

const Main = () => {
    const [message, setMessage] = useState('Loading...');
    const [error, setError] = useState();
    const [db, setDb] = useState();

    useEffect(() => {
        const url = new URL(location.href);
        const movieDir = url.searchParams.get('movieDir');
        if (!movieDir) {
            setMessage('');
            setError('No movieDir parameter found.');
            return;
        }
        const ws = new WebSocket(`${INIT_URL}?movieDir=${movieDir}`);
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            switch (data.status) {
                case 'loading':
                    setMessage(`Loading: ${data.message}`);
                    break;
                case 'finished':
                    setMessage(undefined);
                    setDb(data.db);
                    ws.close();
                    break;
                case 'error':
                    setError(data.message);
                    ws.close();
                    break;
            }
        };
        ws.onopen = () => {
            ws.send('init');
        };
    }, []);

    return <main>
        {error && <div>[Error]{error}</div>}
        {message && <div>{message}</div>}
        {db && <Search db={db} />}
    </main>
};

export default Main;
