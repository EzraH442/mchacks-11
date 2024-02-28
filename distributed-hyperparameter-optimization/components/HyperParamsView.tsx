import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { formatValues } from '@/lib/utils';

interface IHyperparamsViewProps {
  batchId: string;
  pending?: boolean;
}

const HyperparametersView: React.FC<IHyperparamsViewProps> = observer(
  ({ pending, batchId }) => {
    const { training } = useStore(null);

    const batch = training.batches.get(batchId);

    if (!batch) {
      console.error('Batch not found');
      return <p>batch {batchId} not found</p>;
    }

    return (
      <div
        className={`flex flex-col px-1.5 py-1 rounded-md
    ${pending ? 'bg-yellow-200' : 'bg-gray-100'}`}
      >
        {Array.from(batch.hyperparameterSet.entries()).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <p>{`${k}: ${formatValues(v.value)}`}</p>
          </div>
        ))}
      </div>
    );
  },
);

export default HyperparametersView;
