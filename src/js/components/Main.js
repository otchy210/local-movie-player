import React, { useState, useEffect } from 'react';

const INIT_URL = 'ws://localhost:3000/init';

const Main = () => {
    const [message, setMessage] = useState('Loading...');
    const [error, setError] = useState();

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
                    setMessage(JSON.stringify(data.db));
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
        {message && <div>{message}</div>}
        {error && <div>[Error]{error}</div>}
    </main>
};

export default Main;
