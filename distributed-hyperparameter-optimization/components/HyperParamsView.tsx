import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';

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
        {/* <TypographyP className="">Layers: {hyperparameters.layers}</TypographyP>
        <TypographyP className="">
          Neurons per layer: {hyperparameters.neuronsPerLayer.join(', ')}
        </TypographyP>
        <TypographyP className="">
          Epsilon: {round(hyperparameters.epsilon, 3)}
        </TypographyP>
        <TypographyP className="">
          Learning rate: {round(hyperparameters.learningRate, 3)}
        </TypographyP> */}
      </div>
    );
  },
);

export default HyperparametersView;
