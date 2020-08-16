import React, { useState, useEffect, useRef } from 'react';
import List from './List';
import { TextInput } from './styled/Forms';

const Search = (props) => {
    const { db } = props;
    const [list, setList] = useState(db.list);
    const queryInput = useRef();

    useEffect(() => {
        let lastQuery = queryInput.current.value;
        const iid = setInterval(() => {
            const query = queryInput.current.value;
            if (lastQuery === query) {
                return;
            }
            lastQuery = query;
            if (query.length === 0) {
                setList(db.list);
                return;
            }
            const filteredList = db.list.filter(meta => {
                return meta.name.includes(query);
            });
            setList(filteredList);
        }, 500);
        return () => {
            clearInterval(iid);
        };
    }, []);

    return <div>
        <div>
            <TextInput ref={queryInput} />
        </div>
        <List list={list} />
    </div>
};

export default Search;
