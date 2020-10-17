import React, { useState } from 'react';
import styled from 'styled-components';
import { unit1 } from './styled/common';

const CardContainer = styled.div`
    position: relative;
    height: 100%;
    cursor: pointer;
`;

const ThumbnailContainer = styled.div`
    height: 80%;
    overflow: hidden;
    display: flex;
    align-items: center;
    background-color: #000;
`;

const Thumbnail = styled.img`
    width: 100%;
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
    const { movie, selectMovie } = props;
    const { meta, stat } = movie;
    const defaultThumbnail = movie.selectedThumbnail || 0;
    const [ thumbnail, setThumbnail ] = useState(defaultThumbnail);
    const handleMouseMove = (e) => {
        const target = e.target;
        const rect = target.getBoundingClientRect();
        const w = rect.width;
        const x = Math.min(Math.max(e.clientX - rect.x, 0), w);
        const len = movie.thumbnails.length;
        const index = Math.floor((len / w) * x);
        setThumbnail(index);
    };
    return <CardContainer onClick={()=>{selectMovie(movie)}}>
        <ThumbnailContainer>
            <Thumbnail
                src={movie.thumbnails[thumbnail]}
                onMouseMove={handleMouseMove}
                onMouseOut={() => setThumbnail(defaultThumbnail)}
            />
        </ThumbnailContainer>
        <MetaDataContainer>
            <MetaData>{meta.duration}</MetaData>
            <MetaData>{meta.width}x{meta.height}</MetaData>
            <MetaData>{movie.ext}</MetaData>
            <MetaData>{stat.displaySize}</MetaData>
        </MetaDataContainer>
        {movie.name}
    </CardContainer>
};

export default Card;
