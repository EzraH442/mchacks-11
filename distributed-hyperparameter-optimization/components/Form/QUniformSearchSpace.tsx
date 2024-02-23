import { ISearchSpaceQUniform, useStore } from '@/store';
import { FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { observer } from 'mobx-react-lite';

const QUniformSearchSpace = observer(({ index }: { index: number }) => {
  const store = useStore(null);
  const { hyperparameters, searchSpace } = store;
  const options = searchSpace.options.at(index) as ISearchSpaceQUniform;

  if (!options) {
    return <p>error rendering E</p>;
  }

  const handleFieldRemoved = (index: number) => {
    store.removeHyperparameterIndex(index);
  };

  return (
    <FormItem>
      <FormLabel>{hyperparameters.formFields.at(index)?.fieldName}</FormLabel>
      <div>
        <p>min:</p>
        <Input
          type="number"
          value={options.min}
          onChange={(e) => {
            options.setMin(e.target.valueAsNumber);
          }}
        />
        <p>max:</p>
        <Input
          type="number"
          value={options.max}
          onChange={(e) => {
            options.setMax(e.target.valueAsNumber);
          }}
        />
        <p>q</p>
        <Input
          type="number"
          value={options.q}
          onChange={(e) => {
            options.setQ(e.target.valueAsNumber);
          }}
        />
      </div>
      <Button variant="destructive" onClick={() => handleFieldRemoved(index)}>
        Remove Field
      </Button>
    </FormItem>
  );
});

export default QUniformSearchSpace;
