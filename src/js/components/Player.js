import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { unit1, unit3 } from './styled/common';

const SIZE_S = {label: '小', width: '12.5%'};
const SIZE_M = {label: '中', width: '16.666%'};
const SIZE_L = {label: '大', width: '25%'};
const SIZES = [SIZE_S, SIZE_M, SIZE_L];

const MODE_R = {label: '標準'};
const MODE_X = {label: '拡大'};
const MODES = [MODE_R, MODE_X];

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
    width: ${props => props.mode === MODE_X ? '96vw' : '90vw'};
    max-width: ${props => props.mode === MODE_X ? 'none' : '800px'};
    height: ${props => props.mode === MODE_X ? '96vh' : '90vh'};
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
    max-height: ${props => props.mode === MODE_X ? 'calc(96vh - 150px)' : 'none'};
    background-color: #000;
`;

const MovieWrapper = styled.div`
`

const Name = styled.div`
`;

const Controls = styled.div`
    margin-top: ${unit1};
`;

const ButtonGroup = styled.div`
    display: inline-block;
    margin-right: ${unit1};
    & > button:first-child {
        border-radius: ${unit1} 0 0 ${unit1};
    }
    & > button:last-child {
        border-radius: 0 ${unit1} ${unit1} 0;
    }
`;

const Button = styled.button`
    line-height: ${unit3};
    text-align: center;
    margin-right: 1px;
    background-color: ${props => props.selected ? '#3c3' : '#333'};
    border: none;
    color: #fff;
    cursor: pointer;
    outline: none;
`;

const Close = styled.button`
    position: absolute;
    right: 0;
    top: 0;
    line-height: ${unit3};
    text-align: center;
    background-color: #900;
    border: 4px solid #fff;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    outline: none;
    transform: translate(30%, -30%);
`;

const Thumbnails = styled.div`
    margin-top: ${unit1};
    overflow: scroll;
    white-space: ${props => props.mode === MODE_X ? 'nowrap' : 'none'};
`;

const ThumbnailWrapper = styled.span`
    display: inline-block;
    position: relative;
    width: ${props => props.mode === MODE_X ? '120px' : `calc(${props.size.width} - 4px)`};
    border-style: solid;
    border-width: 2px;
    border-color: ${props => props.focused ? '#3c3' : 'rgba(0,0,0,0)'};
    cursor: pointer;
    &:hover > span {
        display: inline-block;
    }
`;

const Time = styled.span`
    display: none;
    position: absolute;
    left: 4px;
    top: 2px;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.3);
    background-color: rgba(0,0,0,0.5);
    color: rgba(255,255,255,0.7);
    font-size: 0.7rem;
`;

const Thumbnail = styled.img`
    width: 100%;
`;

const formatTime = (time) => {
    const hours = parseInt(time / 3600);
    const mins = parseInt( (time - hours * 3600) / 60 );
    const secs = time - hours * 3600 - mins * 60;
    if (hours > 0) {
        const hoursStr = hours.toString().padStart(2, '0');
        const minsStr = mins.toString().padStart(2, '0');
        const secsStr = secs.toString().padStart(2, '0');
        return [hoursStr, minsStr, secsStr].join(':');
    }
    const minsStr = mins.toString();
    const secsStr = secs.toString().padStart(2, '0');
    return [minsStr, secsStr].join(':');
}

const Player = (props) => {
    const { movie, unselectMovie } = props;
    const [ size, setSize ] = useState(SIZE_S);
    const [ mode, setMode ] = useState(MODE_R);
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
        <Panel mode={mode}>
            <Close onClick={unselectMovie}>閉</Close>
            <Name>{movie.name}</Name>
            <MovieWrapper><Movie src={url} ref={ref} mode={mode} /></MovieWrapper>
            <Controls>
                <ButtonGroup>{
                    SIZES.map(s => <Button onClick={() => {setSize(s)}} selected={size === s}>{s.label}</Button>)
                }</ButtonGroup>
                <ButtonGroup>{
                    MODES.map(m => <Button onClick={() => {setMode(m)}} selected={mode === m}>{m.label}</Button>)
                }</ButtonGroup>
            </Controls>
            <Thumbnails mode={mode}>
                {movie.thumbnails.map((data, i) => {
                    return <ThumbnailWrapper
                        mode={mode}
                        size={size}
                        focused={focusedIndex === i}
                        onClick={()=>{ref.current.currentTime = i * 30}}
                        onDoubleClick={()=>{ref.current.play()}}
                    >
                        <Time>{formatTime(i*30)}</Time>
                        <Thumbnail src={data} />
                    </ThumbnailWrapper>
                })}
            </Thumbnails>
        </Panel>
    </>
};

export default Player;