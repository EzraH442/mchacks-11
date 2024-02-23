import { useStore } from '@/store';
import { FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { observer } from 'mobx-react-lite';
import { IQUniform, IUniform } from '@/models/StagingArea';

const QUniformSearchSpace = observer(({ name }: { name: string }) => {
  const { stagingArea } = useStore(null);
  const hp = stagingArea.hyperparameters.get(name);
  const ss = hp?.searchSpace as IQUniform;

  return (
    <FormItem>
      <FormLabel>{name}</FormLabel>
      <div>
        <p>min:</p>
        <Input
          type="number"
          value={ss.min}
          onChange={(e) => ss.setMin(e.target.valueAsNumber)}
        />
        <p>max:</p>
        <Input
          type="number"
          value={ss.max}
          onChange={(e) => ss.setMax(e.target.valueAsNumber)}
        />
        <p>q</p>
        <Input
          type="number"
          value={ss.q}
          onChange={(e) => ss.setQ(e.target.valueAsNumber)}
        />
      </div>
      <Button
        variant="destructive"
        onClick={() => stagingArea.removeHyperparameter(name)}
      >
        Remove Field
      </Button>
    </FormItem>
  );
});

export default QUniformSearchSpace;
