import React, { useState, useEffect } from 'react';

const Main = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();

    useEffect(() => {
        const url = new URL(location.href);
        const movieDir = url.searchParams.get('movieDir');
        if (!movieDir) {
            setError('No movieDir parameter found.');
            setLoading(false);
            return;
        }
        // call API runnning in express localhost:3000
        setLoading(false);
    }, []);

    return <main>aa
        {loading && "Loading..."}
        {error && `Error: ${error}`}
    </main>
};

export default Main;
