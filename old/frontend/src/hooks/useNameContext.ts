import { createContext } from 'react';

interface INamesContext {
  names: Record<string, string>;
}

const NameContext = createContext<INamesContext>({
  names: {},
});

export default NameContext;
