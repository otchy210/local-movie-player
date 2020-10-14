import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import List from './List';
import { TextInput } from './styled/Forms';
import { unit1 } from './styled/common';

const queryContainerHeight = '34px';

const QueryContainer = styled.div`
    position: fixed;
    width: calc(100% - ${unit1} * 2);
    height: ${queryContainerHeight};
    left: 0;
    top: 0;
    padding: ${unit1};
    background-color: #fff;
    z-index: 99;
`;

const ListContainer = styled.div`
    margin-top:  ${queryContainerHeight};
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
        <ListContainer>
            <List list={list} selectMovie={selectMovie} />
        </ListContainer>
    </div>
};

export default Search;
