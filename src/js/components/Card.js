import React from 'react';
import { RESOURCE_PORT } from '../const';
import { Thumbnail } from './styled/Images';

const formatSize = (size) => {
    return size;
};

const Card = (props) => {
    const { meta } = props;
    const url = `http://localhost:${RESOURCE_PORT}/${meta.path}`;
    return <div>
        <a href={url} target="_blank">{meta.name}</a> ({formatSize(meta.size)})<br/>
        <Thumbnail src={meta.thumbnail} />
    </div>
};

export default Card;
