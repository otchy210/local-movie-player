import React from 'react';
import Card from './Card';

const List = (props) => {
    const { db } = props;
    const { list } = db;
    return <div>
        {list.map(meta => <Card meta={meta} />)}
    </div>
};

export default List;
