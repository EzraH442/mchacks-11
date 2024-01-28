import { HyperparameterData } from '../App';

interface IHyperparamsViewProps {
  hyperparameters: HyperparameterData;
}

const HyperparametersView: React.FC<IHyperparamsViewProps> = ({
  hyperparameters,
}) => {
  return (
    <div className="flex flex-col bg-gray-100 px-1.5 py-1 rounded-md">
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
