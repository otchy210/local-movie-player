import React from 'react';
import Card from './Card';

const List = (props) => {
    const { list } = props;
    return <div>
        {list.map(meta => <Card meta={meta} />)}
    </div>
};

export default List;
