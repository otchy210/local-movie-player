import styled from 'styled-components';
import { unit1, darkGrey } from './common';

const Input = styled.input`
    padding: ${unit1};
    border: solid 1px ${darkGrey};
    border-radius: ${unit1};
`;

const TextInput = styled(Input).attrs({type: 'text'})`
    width: 100%;
`;

export {
    TextInput
};
