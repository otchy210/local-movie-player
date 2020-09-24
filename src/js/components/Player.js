import React from 'react';
import styled from 'styled-components';
import { unit1 } from './styled/common';

const Bg = styled.div`
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: 9;
    background-color: rgba(0,0,0,0.5);
    backdrop-filter: blur(${unit1});
`;

const Panel = styled.div`
    position: fixed;
    display: flex;
    flex-direction: column;
    width: 96vw;
    height: 96vh;
    left: 2vw;
    top: 2vh;
    padding: ${unit1};
    background-color: #fff;
    border-radius: ${unit1};
    z-index: 99;
`;

const Movie = styled.video.attrs({controls: 'controls'})`
    width: 100%;
`;

const MovieWrapper = styled.div`
`

const Name = styled.div`
`;

const Thumbnails = styled.div`
    margin-top: ${unit1};
    overflow: scroll;
`;

const Thumbnail = styled.img`
    width: 16vw;
`;

const Player = (props) => {
    const { movie, unselectMovie } = props;
    const context = globalThis.context;
    const url = `http://localhost:${context.LMP_PORT}/movie${movie.path}`;
    return <>
        <Bg onClick={unselectMovie}></Bg>
        <Panel>
            <Name>{movie.name}</Name>
            <MovieWrapper><Movie src={url}></Movie></MovieWrapper>
            <Thumbnails>
                {movie.thumbnails.map(data => {
                    return <Thumbnail src={data}/>
                })}
            </Thumbnails>
        </Panel>
    </>
};

export default Player;