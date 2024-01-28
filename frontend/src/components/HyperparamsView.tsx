import { HyperparameterData } from '../App';

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
      <p className="">Layers: {hyperparameters.layers}</p>
      <p className="">
        Neurons per layer: {hyperparameters.neuronsPerLayer.join(', ')}
      </p>
      <p className="">Epsilon: {hyperparameters.epsilon}</p>
      <p className="">Learning rate: {hyperparameters.learningRate}</p>
    </div>
  );
};

export default HyperparametersView;
