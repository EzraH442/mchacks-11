import { HyperparameterData } from '../App';
import { round } from '../lib/utils';
import { TypographyP } from './Typography/TypographyP';

interface IHyperparamsViewProps {
  hyperparameters: HyperparameterData;
  pending?: boolean;
}

const HyperparametersView: React.FC<IHyperparamsViewProps> = ({
  hyperparameters,
  pending,
}) => {
  return (
    <div
      className={`flex flex-col px-1.5 py-1 rounded-md
    ${pending ? 'bg-yellow-200' : 'bg-gray-100'}`}
    >
      <TypographyP className="">Layers: {hyperparameters.layers}</TypographyP>
      <TypographyP className="">
        Neurons per layer: {hyperparameters.neuronsPerLayer.join(', ')}
      </TypographyP>
      <TypographyP className="">Epsilon: {round(hyperparameters.epsilon, 3)}</TypographyP>
      <TypographyP className="">
        Learning rate: {round(hyperparameters.learningRate, 3)}
      </TypographyP>
    </div>
  );
};

export default HyperparametersView;
