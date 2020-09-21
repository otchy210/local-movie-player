import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import List from './List';
import { TextInput } from './styled/Forms';
import { unit1 } from './styled/common';

const QueryContainer = styled.div`
    margin-bottom: ${unit1};
`;

const Search = (props) => {
    const { db } = props;
    const [list, setList] = useState(db.list());
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
                setList(db.list());
                return;
            }
            const filteredList = db.list(query);
            console.log(filteredList);
            setList(filteredList);
        }, 500);
        return () => {
            clearInterval(iid);
        };
    }, []);

    return <div>
        <QueryContainer>
            <TextInput ref={queryInput} />
        </QueryContainer>
        <List list={list} />
    </div>
};

export default Search;
