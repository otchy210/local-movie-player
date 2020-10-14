import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import List from './List';
import { TextInput } from './styled/Forms';
import { unit1 } from './styled/common';

const QueryContainer = styled.div`
    position: ${props => props.fixed ? 'fixed' : 'relative'};
    left: ${props => props.fixed ? '0' : 'auto'};
    top: ${props => props.fixed ? '0' : 'auto'};
    width: ${props => props.fixed ? '100%' : 'auto'};
    margin-bottom: ${unit1};
`;

const Search = (props) => {
    const { selectMovie } = props;
    const { db } = globalThis;
    const [fixed, setFixed] = useState(false);
    const [list, setList] = useState(db.list());
    const queryInput = useRef();

    useEffect(() => {
        let lastQuery = queryInput.current.value;
        const iid = setInterval(() => {
            setFixed(window.scrollY > 200);
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
            setList(filteredList);
        }, 500);
        return () => {
            clearInterval(iid);
        };
    }, []);

    return <div>
        <QueryContainer fixed={fixed}>
            <TextInput ref={queryInput} />
        </QueryContainer>
        <List list={list} selectMovie={selectMovie} />
    </div>
};

export default Search;
