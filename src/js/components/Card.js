import React from 'react';
import styled from 'styled-components';
import { RESOURCE_PORT } from '../const';
import { Thumbnail } from './styled/Images';
import { unit1 } from './styled/common';

const CardContainer = styled.div`
    position: relative;
    height: 100%;
`;

const ThumbnailContainer = styled.div`
    height: 80%;
    overflow: hidden;
    display: flex;
    align-items: center;
    background-color: #000;
`;

const MetaDataContainer = styled.div`
    position: absolute;
    right: ${unit1};
    bottom: 20%;
`;

const MetaData = styled.span`
    display: inline-block;
    margin: 0 0 ${unit1} ${unit1};
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.3);
    background-color: rgba(0,0,0,0.5);
    color: rgba(255,255,255,0.7);
    font-size: 0.7rem;
`;

const Card = (props) => {
    const { meta } = props;
    const url = `http://localhost:${RESOURCE_PORT}/${meta.path}`;
    const [displayName, ext] = splitName(meta.name);
    return <CardContainer>
        <ThumbnailContainer>
            <Thumbnail src={meta.thumbnail} />
        </ThumbnailContainer>
        <MetaDataContainer>
            <MetaData>{formatDuration(meta.duration)}</MetaData>
            <MetaData>{ext}</MetaData>
            <MetaData>{formatSize(meta.size)}</MetaData>
        </MetaDataContainer>
        <a href={url} target="_blank">{displayName}</a>
    </CardContainer>
};

const splitName = (name) => {
    const idx = name.lastIndexOf('.');
    const displayName = name.substr(0, idx);
    const ext = name.substr(idx+1);
    return [displayName, ext.toUpperCase()];
};

const formatDuration = (duration) => {
    const [hhmmss, sss] = duration.split('.');
    let result = hhmmss;
    let c = result.charAt(0);
    while (c === '0' || c === ':') {
        result = result.substr(1);
        c = result.charAt(0);
    }
    return result;
};

const formatSize = (size) => {
    if (size >= 900*1000*1000) { // >= 0.9GB
        return `${(size / (1000*1000*1000)).toFixed(2)} GB`;
    } else if (size >= 900*1000) { // >= 0.9MB
        return `${(size / (900*1000)).toFixed(2)} MB`;
    } else if (size >= 900) { // >= 0.9KB
        return `${(size / 1000).toFixed(2)} KB`;
    } else {
        return size.toString();
    }
};

export default Card;
