import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import AddFormFieldModal, { IAddFormField } from './AddFormFieldModal';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';

interface DynamicFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ onSubmit, disabled }) => {
  const [formFields, setFormFields] = useState<IAddFormField[]>([]);

  const form = useForm<any>({
    defaultValues: {},
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const handleFieldAdded = (data: IAddFormField) => {
    append(data.fieldName);
    setFormFields((prev) => [...prev, data]);
  };

  const handleFieldRemoved = (index: number) => {
    remove(index);
    setFormFields((prev) => prev.filter((_, i) => i !== index));
  };

  const renderField = (
    field: ControllerRenderProps<any, any>,
    index: number,
  ) => {
    switch (formFields[index].type) {
      case 'bool':
        return <Checkbox checked={field.value} onChange={field.onChange} />;

      case 'text':
        return <Input {...field}></Input>;

      case 'number':
        return <Input type="number" {...field}></Input>;

      default:
        return null;
    }
  };

  return (
    <div>
      <Form {...form}>
        {fields.length === 0 && (
          <div className="px-3 border-dashed border-gray-300 border py-2 flex items-center justify-center">
            <p className="text-center">No fields added</p>
          </div>
        )}

        {fields.map((field, index) => {
          return (
            <FormField
              control={form.control}
              key={field.id}
              name={`fields[${index}]`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{formFields[index].fieldName}</FormLabel>
                  <FormControl>{renderField(field, index)}</FormControl>

                  <button onClick={() => handleFieldRemoved(index)}>
                    Remove
                  </button>
                </FormItem>
              )}
            />
          );
        })}
      </Form>

      <div className="my-4" />

      <AddFormFieldModal
        onSubmit={(data) => {
          console.log(data);
          handleFieldAdded(data);
        }}
      />
    </div>
  );
};

export default DynamicForm;
