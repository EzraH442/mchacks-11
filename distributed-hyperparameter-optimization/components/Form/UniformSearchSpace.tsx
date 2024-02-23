import { ISearchSpaceUniform, useStore } from '@/store';
import { FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { observer } from 'mobx-react-lite';

const UniformSearchSpace = observer(({ index }: { index: number }) => {
  const store = useStore(null);
  const { searchSpace, hyperparameters } = store;
  const options = searchSpace.options.at(index) as ISearchSpaceUniform;

  if (!options) {
    return <p>error rendering D</p>;
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
          step="any"
          value={options.min}
          onChange={(e) => {
            options.setMin(e.target.valueAsNumber);
          }}
        />
        <p>max:</p>
        <Input
          type="number"
          step="any"
          value={options.max}
          onChange={(e) => {
            options.setMax(e.target.valueAsNumber);
          }}
        />
      </div>
      <Button variant="destructive" onClick={() => handleFieldRemoved(index)}>
        Remove Field
      </Button>
    </FormItem>
  );
});

export default UniformSearchSpace;
