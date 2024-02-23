'use client';
import { Button } from './ui/button';
import DynamicForm from './DynamicForm';

interface HypFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const SearchSpaceForm: React.FC<HypFormProps> = ({ onSubmit, disabled }) => {
  return (
    <div>
      <DynamicForm onSubmit={onSubmit} disabled={disabled} />

      <div className="mt-6 mb-2 border border-gray-300"></div>
      <Button
        disabled={disabled}
        onClick={() => {
          onSubmit({});
        }}
      >
        Add Parameters
      </Button>
    </div>
  );
};

export default SearchSpaceForm;
