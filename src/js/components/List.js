import React from 'react';
import Card from './Card';
import styled from 'styled-components';
import { unit1, unit2 } from './styled/common';

const ListContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    grid-row-gap: ${unit1};
    @media screen and (min-width: 480px) {
        grid-template-columns: 1fr 1fr;
        grid-column-gap: ${unit1};
        grid-row-gap: ${unit2};
    }
    @media screen and (min-width: 800px) {
        grid-template-columns: 1fr 1fr 1fr;
    }
    @media screen and (min-width: 1200px) {
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }
`;

const List = (props) => {
    const { list } = props;
    return <ListContainer>
        {list.map(movie => <Card movie={movie} />)}
    </ListContainer>
};

export default List;
