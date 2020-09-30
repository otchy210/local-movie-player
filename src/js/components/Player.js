import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { unit1, unit3 } from './styled/common';

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
    width: 90vw;
    max-width: 800px;
    height: 90vh;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
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

const Controls = styled.div`
    margin-top: ${unit1};
`;

const Button = styled.button`
    width: ${unit3};
    line-height: ${unit3};
    text-align: center;
    margin-right: 2px;
    background-color: #333;
    border: none;
    border-radius: 2px;
    color: #fff;
    cursor: pointer;
    outline: none;
`;

const Thumbnails = styled.div`
    margin-top: ${unit1};
    overflow: scroll;
`;

const Thumbnail = styled.img`
    width: calc(${props => props.size} - 4px);
    cursor: pointer;
    border-style: solid;
    border-width: 2px;
    border-color: ${props => props.focused ? '#0f0' : 'rgba(0,0,0,0)'};
`;

const Player = (props) => {
    const { movie, unselectMovie } = props;
    const [ size, setSize ] = useState('12.5%');
    const [ focusedIndex, setFocusedIndex ] = useState(0);
    const ref = useRef();
    const context = globalThis.context;
    const url = `http://localhost:${context.LMP_PORT}/movie${movie.path}`;
    useEffect(() => {
        const iid = setInterval(() => {
            const currentIndex = parseInt(ref.current.currentTime / 30);
            setFocusedIndex(currentIndex);
        }, 200);
        return () => {
            clearInterval(iid);
        }
    }, []);
    return <>
        <Bg onClick={unselectMovie}></Bg>
        <Panel>
            <Name>{movie.name}</Name>
            <MovieWrapper><Movie src={url} ref={ref}></Movie></MovieWrapper>
            <Controls>
                <Button onClick={() => {setSize('12.5%')}}>小</Button>
                <Button onClick={() => {setSize('16.66%')}}>中</Button>
                <Button onClick={() => {setSize('25%')}}>大</Button>
            </Controls>
            <Thumbnails>
                {movie.thumbnails.map((data, i) => {
                    return <Thumbnail src={data} size={size} onClick={()=>{ref.current.currentTime = i * 30}} focused={focusedIndex === i}/>
                })}
            </Thumbnails>
        </Panel>
    </>
};

export default Player;